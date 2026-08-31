import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock
from urllib.parse import parse_qs, urlparse

import paperlane_server as server


def paper(paper_id, source_id, source="ieee"):
    return {
        "id": paper_id,
        "source": source,
        "sourceId": source_id,
        "sourceLabel": source_id,
        "date": "2026-08-14",
        "category": "Test",
        "title": paper_id,
        "authors": "Test Author",
        "abstract": "Test abstract",
        "tags": ["Test"],
        "url": "https://example.com/{}".format(paper_id),
        "issueType": "formal-issue",
        "issueLabel": "Vol. 1",
        "ieeeIssueRank": 1,
    }


def status(source_id, error=""):
    return {
        "id": source_id,
        "label": source_id,
        "count": 0,
        "error": error,
        "limited": False,
        "note": "",
        "mode": "",
    }


class PaperlaneServerTests(unittest.TestCase):
    def test_ieee_empty_metadata_falls_back_to_rss(self):
        fallback_paper = paper("rss-paper", "ieee-tac")
        with mock.patch.object(server, "request_ieee_json", return_value={}), mock.patch.object(
            server, "fetch_feed", return_value=[fallback_paper]
        ):
            result = server.fetch_ieee(server.FEEDS[0], "ea+1")

        self.assertEqual(result["mode"], "rss-fallback")
        self.assertTrue(result["limited"])
        self.assertEqual([item["id"] for item in result["papers"]], ["rss-paper"])

    def test_ieee_empty_api_and_rss_is_an_error(self):
        with mock.patch.object(server, "request_ieee_json", return_value={}), mock.patch.object(
            server, "fetch_feed", return_value=[]
        ):
            with self.assertRaisesRegex(RuntimeError, "均未返回论文"):
                server.fetch_ieee(server.FEEDS[0], "ea+1")

    def test_partial_failure_keeps_last_successful_ieee_source(self):
        cached_paper = paper("cached-tac", "ieee-tac")
        fresh_nature = paper("fresh-nature", "nature", source="nature")
        fresh = {
            "papers": [fresh_nature],
            "sources": [status("nature"), status("ieee-tac", "HTTP 418")],
            "errors": [status("ieee-tac", "HTTP 418")],
            "fetchedAt": "2026-08-14T08:00:00+00:00",
        }
        source_cache = {
            "ieee-tac|ea+1": {
                "sourceId": "ieee-tac",
                "ieeeScope": "ea+1",
                "updatedAt": "2026-08-14T07:00:00+00:00",
                "papers": [cached_paper],
            }
        }

        with tempfile.TemporaryDirectory() as directory, mock.patch.object(
            server, "HISTORY_PATH", Path(directory) / "history.json"
        ):
            payload = server.build_range_payload(
                fresh,
                ["nature", "ieee-tac"],
                30,
                ieee_scope="ea+1",
                source_cache=source_cache,
            )

        self.assertEqual({item["id"] for item in payload["papers"]}, {"fresh-nature", "cached-tac"})
        self.assertEqual(payload["staleSources"], ["ieee-tac"])
        tac_status = next(item for item in payload["sources"] if item["id"] == "ieee-tac")
        self.assertEqual(tac_status["count"], 1)
        self.assertIn("已保留上次可用数据", tac_status["note"])

    def test_all_failed_sources_return_source_cache_instead_of_empty_payload(self):
        cached_paper = paper("cached-tac", "ieee-tac")
        fresh = {
            "papers": [],
            "sources": [status("ieee-tac", "HTTP 418")],
            "errors": [status("ieee-tac", "HTTP 418")],
            "fetchedAt": "2026-08-14T08:00:00+00:00",
            "requestedSources": ["ieee-tac"],
            "ieeeScope": "ea+1",
            "cached": False,
            "stale": False,
        }

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source_cache_path = root / "source-cache.json"
            source_cache_path.write_text(
                json.dumps(
                    {
                        "entries": {
                            "ieee-tac|ea+1": {
                                "sourceId": "ieee-tac",
                                "ieeeScope": "ea+1",
                                "papers": [cached_paper],
                            }
                        }
                    }
                ),
                encoding="utf-8",
            )
            with mock.patch.object(server, "CACHE_PATH", root / "cache.json"), mock.patch.object(
                server, "HISTORY_PATH", root / "history.json"
            ), mock.patch.object(server, "SOURCE_CACHE_PATH", source_cache_path), mock.patch.object(
                server, "collect_papers", return_value=fresh
            ):
                payload = server.get_papers(
                    force=True,
                    selected_sources=["ieee-tac"],
                    range_days=30,
                    ieee_scope="ea+1",
                )

        self.assertEqual([item["id"] for item in payload["papers"]], ["cached-tac"])
        self.assertTrue(payload["cached"])
        self.assertTrue(payload["stale"])
        self.assertEqual(payload["staleSources"], ["ieee-tac"])

    def test_openreview_pagination_and_decision_labels(self):
        config = {
            "id": "conf-icml",
            "label": "ICML",
            "fullName": "International Conference on Machine Learning · CCF A",
            "invitation": "ICML.cc/{year}/Conference/-/Submission",
            "limit": 2,
        }
        pages = {
            ("ICML.cc/2026/Conference/-/Submission", 0): {
                "notes": [
                    {
                        "id": "oral-1",
                        "forum": "oral-1",
                        "content": {
                            "title": {"value": "A Reliable Robot Learner"},
                            "venue": {"value": "ICML 2026 Oral"},
                            "authors": [{"value": "Alice"}],
                            "abstract": {"value": "A long enough abstract for the oral paper."},
                            "pdf": {"value": "/pdf?id=oral-1"},
                        },
                    },
                    {
                        "id": "spotlight-1",
                        "forum": "spotlight-1",
                        "content": {
                            "title": {"value": "Learning with Sparse Feedback"},
                            "decision": {"value": "Accept (Spotlight)"},
                            "authors": {"value": [{"value": "Bob"}, {"value": "Carol"}]},
                        },
                    },
                ]
            },
            ("ICML.cc/2026/Conference/-/Submission", 2): {
                "notes": [
                    {
                        "id": "reject-1",
                        "content": {
                            "title": {"value": "Rejected Work"},
                            "decision": {"value": "Reject"},
                        },
                    }
                ]
            },
            ("ICML.cc/2025/Conference/-/Submission", 0): {"notes": []},
        }

        def request(url):
            query = parse_qs(urlparse(url).query)
            key = (query["invitation"][0], int(query["offset"][0]))
            return json.dumps(pages[key]).encode("utf-8")

        with mock.patch.object(server, "request_bytes", side_effect=request):
            result = server.fetch_openreview(config)

        self.assertFalse(result["limited"])
        self.assertEqual({paper["decisionLabel"] for paper in result["papers"]}, {"Oral", "Spotlight"})
        oral = next(paper for paper in result["papers"] if paper["decisionLabel"] == "Oral")
        self.assertEqual(oral["authors"], "Alice")
        self.assertTrue(oral["pdfUrl"].endswith("oral-1"))

    def test_official_conference_parser_filters_navigation_links(self):
        raw = b"""
        <script type="application/ld+json">
          [{"@type":["ScholarlyArticle"],"headline":"A Long Robot Paper",
            "url":"https://2025.ieee-icra.org/papers/robot-paper"},
           {"@type":"Article","name":"Final Paper Submission Instructions",
            "url":"https://2025.ieee-icra.org/contribute/final-paper-submission-instructions/"}]
        </script>
        <a href="/papers/another-paper">Another Robot Paper Title</a>
        <a href="/contribute/final-paper-submission-instructions/">Final Paper Submission Instructions</a>
        <a href="/program/">Conference Program</a>
        """
        config = server.CONFERENCE_FEEDS[-2]
        papers = server.parse_official_conference_html(raw, config, 2025)

        self.assertEqual([paper["title"] for paper in papers], ["A Long Robot Paper", "Another Robot Paper Title"])
        self.assertTrue(all("submission" not in paper["url"] for paper in papers))

    def test_conference_primary_failure_falls_back_to_dblp(self):
        fallback = {"papers": [{"id": "dblp-paper"}], "limited": False, "note": "DBLP 会议题录", "mode": "dblp"}
        config = server.CONFERENCE_FEEDS[0]
        with mock.patch.object(server, "fetch_openreview", side_effect=ValueError("challenge")), mock.patch.object(
            server, "fetch_dblp", return_value=fallback
        ):
            result = server.fetch_conference(config)

        self.assertEqual(result["mode"], "dblp-fallback")
        self.assertIn("已回退 DBLP", result["note"])


if __name__ == "__main__":
    unittest.main()
