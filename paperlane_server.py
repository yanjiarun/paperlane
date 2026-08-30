#!/usr/bin/env python3
"""Local Paperlane server and public academic-feed aggregator."""

import argparse
import base64
import concurrent.futures
import email.utils
import gzip
import hashlib
import html
import json
import os
import re
import shutil
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
CACHE_PATH = ROOT / "paper-cache.json"
HISTORY_PATH = ROOT / "paper-history.json"
SOURCE_CACHE_PATH = ROOT / "paper-source-cache.json"
CACHE_SECONDS = 30 * 60
HISTORY_RETENTION_DAYS = 730
DEFAULT_RANGE_DAYS = 30
DEFAULT_IEEE_SCOPE = "ea+1"
IEEE_SCOPE_OPTIONS = {"ea", "1", "2", "3", "5", "ea+1", "ea+2", "ea+3", "ea+5"}
IEEE_ROWS_PER_PAGE = 100
IEEE_MAX_RECORDS_PER_COLLECTION = 1000
ARXIV_MAX_RESULTS = 500
STATIC_RANGE_DAYS = 365
STATIC_IEEE_SCOPE = "ea+5"
USER_AGENT = "Paperlane/0.6 (personal academic feed reader)"
IEEE_BROWSER_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
REQUEST_TIMEOUT = 30
REQUEST_ATTEMPTS = 3
RETRYABLE_HTTP_CODES = {408, 425, 429, 500, 502, 503, 504}
NO_ABSTRACT = "该来源没有在公开订阅中提供摘要，请点击“查看原文”阅读。"
CACHE_LOCK = threading.Lock()

FEEDS = [
    {"id": "ieee-tac", "label": "TAC", "fullName": "IEEE Transactions on Automatic Control", "journal": "IEEE TAC", "group": "control", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC9.XML", "limit": 15},
    {"id": "ieee-tro", "label": "T-RO", "fullName": "IEEE Transactions on Robotics", "journal": "IEEE T-RO", "group": "control", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC8860.XML", "limit": 15},
    {"id": "ieee-tcst", "label": "TCST", "fullName": "IEEE Transactions on Control Systems Technology", "journal": "IEEE TCST", "group": "control", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC87.XML", "limit": 15},
    {"id": "ieee-tase", "label": "T-ASE", "fullName": "IEEE Transactions on Automation Science and Engineering", "journal": "IEEE T-ASE", "group": "control", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC8856.XML", "limit": 15},
    {"id": "ieee-tsmc", "label": "TSMC Systems", "fullName": "IEEE Transactions on Systems, Man, and Cybernetics: Systems", "journal": "IEEE TSMC Systems", "group": "control", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC6221021.XML", "limit": 15},
    {"id": "ieee-tcyb", "label": "TCYB", "fullName": "IEEE Transactions on Cybernetics", "journal": "IEEE TCYB", "group": "control", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC6221036.XML", "limit": 15},
    {"id": "ieee-thms", "label": "THMS", "fullName": "IEEE Transactions on Human-Machine Systems", "journal": "IEEE THMS", "group": "control", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC6221037.XML", "limit": 15},
    {"id": "ieee-tie", "label": "TIE", "fullName": "IEEE Transactions on Industrial Electronics", "journal": "IEEE TIE", "group": "industrial", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC41.XML", "limit": 15},
    {"id": "ieee-tii", "label": "TII", "fullName": "IEEE Transactions on Industrial Informatics", "journal": "IEEE TII", "group": "industrial", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC9424.XML", "limit": 15},
    {"id": "ieee-tmech", "label": "T-Mech", "fullName": "IEEE/ASME Transactions on Mechatronics", "journal": "IEEE T-Mech", "group": "industrial", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC3516.XML", "limit": 15},
    {"id": "ieee-tits", "label": "TITS", "fullName": "IEEE Transactions on Intelligent Transportation Systems", "journal": "IEEE TITS", "group": "industrial", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC6979.XML", "limit": 15},
    {"id": "ieee-taes", "label": "TAES", "fullName": "IEEE Transactions on Aerospace and Electronic Systems", "journal": "IEEE TAES", "group": "aerospace", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC7.XML", "limit": 15},
    {"id": "ieee-tap", "label": "TAP", "fullName": "IEEE Transactions on Antennas and Propagation", "journal": "IEEE TAP", "group": "aerospace", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC8.XML", "limit": 15},
    {"id": "ieee-temc", "label": "TEMC", "fullName": "IEEE Transactions on Electromagnetic Compatibility", "journal": "IEEE TEMC", "group": "aerospace", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC15.XML", "limit": 15},
    {"id": "ieee-tim", "label": "TIM", "fullName": "IEEE Transactions on Instrumentation and Measurement", "journal": "IEEE TIM", "group": "aerospace", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC19.XML", "limit": 15},
    {"id": "ieee-tmtt", "label": "TMTT", "fullName": "IEEE Transactions on Microwave Theory and Techniques", "journal": "IEEE TMTT", "group": "aerospace", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC22.XML", "limit": 15},
    {"id": "ieee-trel", "label": "TR", "fullName": "IEEE Transactions on Reliability", "journal": "IEEE TR", "group": "aerospace", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC24.XML", "limit": 15},
    {"id": "ieee-tvt", "label": "TVT", "fullName": "IEEE Transactions on Vehicular Technology", "journal": "IEEE TVT", "group": "aerospace", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC25.XML", "limit": 15},
    {"id": "ieee-tcom", "label": "TCOM", "fullName": "IEEE Transactions on Communications", "journal": "IEEE TCOM", "group": "aerospace", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC26.XML", "limit": 15},
    {"id": "ieee-tgrs", "label": "TGRS", "fullName": "IEEE Transactions on Geoscience and Remote Sensing", "journal": "IEEE TGRS", "group": "aerospace", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC36.XML", "limit": 15},
    {"id": "ieee-tpami", "label": "TPAMI", "fullName": "IEEE Transactions on Pattern Analysis and Machine Intelligence", "journal": "IEEE TPAMI", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC34.XML", "limit": 15},
    {"id": "ieee-tnnls", "label": "TNNLS", "fullName": "IEEE Transactions on Neural Networks and Learning Systems", "journal": "IEEE TNNLS", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC5962385.XML", "limit": 15},
    {"id": "ieee-tip", "label": "TIP", "fullName": "IEEE Transactions on Image Processing", "journal": "IEEE TIP", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC83.XML", "limit": 15},
    {"id": "ieee-tsp", "label": "TSP", "fullName": "IEEE Transactions on Signal Processing", "journal": "IEEE TSP", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC78.XML", "limit": 15},
    {"id": "ieee-tkde", "label": "TKDE", "fullName": "IEEE Transactions on Knowledge and Data Engineering", "journal": "IEEE TKDE", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC69.XML", "limit": 15},
    {"id": "ieee-tmm", "label": "TMM", "fullName": "IEEE Transactions on Multimedia", "journal": "IEEE TMM", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC6046.XML", "limit": 15},
    {"id": "ieee-tcsvt", "label": "TCSVT", "fullName": "IEEE Transactions on Circuits and Systems for Video Technology", "journal": "IEEE TCSVT", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC76.XML", "limit": 15},
    {"id": "ieee-tmi", "label": "TMI", "fullName": "IEEE Transactions on Medical Imaging", "journal": "IEEE TMI", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC42.XML", "limit": 15},
    {"id": "ieee-tvcg", "label": "TVCG", "fullName": "IEEE Transactions on Visualization and Computer Graphics", "journal": "IEEE TVCG", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC2945.XML", "limit": 15},
    {"id": "ieee-tc", "label": "TC", "fullName": "IEEE Transactions on Computers", "journal": "IEEE TC", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC12.XML", "limit": 15},
    {"id": "ieee-tse", "label": "TSE", "fullName": "IEEE Transactions on Software Engineering", "journal": "IEEE TSE", "group": "computer", "publisher": "ieee", "url": "https://ieeexplore.ieee.org/rss/TOC32.XML", "limit": 15},
    {"id": "nature", "label": "Nature", "fullName": "Nature", "journal": "Nature", "group": "nature-science", "publisher": "nature", "url": "https://www.nature.com/nature.rss", "limit": 15},
    {"id": "nature-machine-intelligence", "label": "NMI", "fullName": "Nature Machine Intelligence", "journal": "Nature Machine Intelligence", "group": "nature-science", "publisher": "nature", "url": "https://www.nature.com/natmachintell.rss", "limit": 12},
    {"id": "nature-communications", "label": "NC", "fullName": "Nature Communications", "journal": "Nature Communications", "group": "nature-science", "publisher": "nature", "url": "https://www.nature.com/ncomms.rss", "limit": 12},
    {"id": "nature-methods", "label": "NMeth", "fullName": "Nature Methods", "journal": "Nature Methods", "group": "nature-science", "publisher": "nature", "url": "https://www.nature.com/nmeth.rss", "limit": 12},
    {"id": "nature-biomedical-engineering", "label": "NBE", "fullName": "Nature Biomedical Engineering", "journal": "Nature Biomedical Engineering", "group": "nature-science", "publisher": "nature", "url": "https://www.nature.com/natbiomedeng.rss", "limit": 12},
    {"id": "science", "label": "Science", "fullName": "Science", "journal": "Science", "group": "nature-science", "publisher": "science", "url": "https://www.science.org/action/showFeed?type=etoc&feed=rss&jc=science", "limit": 15},
    {"id": "science-robotics", "label": "SR", "fullName": "Science Robotics", "journal": "Science Robotics", "group": "nature-science", "publisher": "science", "url": "https://www.science.org/action/showFeed?type=etoc&feed=rss&jc=scirobotics", "limit": 12},
]

# DBLP exposes a stable, key-free search endpoint for recent proceedings.  These
# sources cover the machine-learning, vision, and robotics conferences most
# useful for this reader; the endpoint returns bibliographic metadata rather
# than full text, so abstracts use the same source note as RSS records without
# an abstract.
CONFERENCE_FEEDS = [
    {"id": "conf-icml", "label": "ICML", "fullName": "International Conference on Machine Learning · CCF A", "conference": "ICML", "query": "venue:ICML", "group": "conference", "publisher": "dblp", "limit": 300},
    {"id": "conf-iclr", "label": "ICLR", "fullName": "International Conference on Learning Representations · CCF A", "conference": "ICLR", "query": "venue:ICLR", "group": "conference", "publisher": "dblp", "limit": 300},
    {"id": "conf-neurips", "label": "NeurIPS", "fullName": "Conference on Neural Information Processing Systems · CCF A", "conference": "NeurIPS", "query": "venue:NeurIPS", "group": "conference", "publisher": "dblp", "limit": 300},
    {"id": "conf-cvpr", "label": "CVPR", "fullName": "IEEE/CVF Conference on Computer Vision and Pattern Recognition · CCF A", "conference": "CVPR", "query": "venue:CVPR", "group": "conference", "publisher": "dblp", "limit": 300},
    {"id": "conf-icra", "label": "ICRA", "fullName": "IEEE International Conference on Robotics and Automation", "conference": "ICRA", "query": "venue:ICRA", "group": "conference", "publisher": "dblp", "limit": 300},
    {"id": "conf-iros", "label": "IROS", "fullName": "IEEE/RSJ International Conference on Intelligent Robots and Systems", "conference": "IROS", "query": "venue:IROS", "group": "conference", "publisher": "dblp", "limit": 300},
]

ARXIV_SOURCE = {"id": "arxiv", "label": "arXiv", "fullName": "arXiv · AI / ML / CV", "group": "arxiv", "publisher": "arxiv"}
ALL_SOURCE_IDS = [ARXIV_SOURCE["id"]] + [feed["id"] for feed in FEEDS] + [feed["id"] for feed in CONFERENCE_FEEDS]
IEEE_SOURCE_IDS = {feed["id"] for feed in FEEDS if feed["publisher"] == "ieee"}
CONFERENCE_SOURCE_IDS = {feed["id"] for feed in CONFERENCE_FEEDS}


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)

    def text(self):
        return " ".join(self.parts)


def utc_now():
    return datetime.now(timezone.utc)


def clean_text(value):
    if not value:
        return ""
    parser = TextExtractor()
    try:
        parser.feed(html.unescape(str(value)))
        value = parser.text()
    except Exception:
        value = re.sub(r"<[^>]+>", " ", str(value))
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def local_name(tag):
    return tag.rsplit("}", 1)[-1].lower()


def child_values(node, *names):
    wanted = {name.lower() for name in names}
    values = []
    for child in list(node):
        if local_name(child.tag) in wanted:
            value = "".join(child.itertext()).strip()
            if value:
                values.append(value)
    return values


def first_value(node, *names):
    values = child_values(node, *names)
    return values[0] if values else ""


def normalize_date(value):
    if not value:
        return "1970-01-01"
    value = value.strip()
    iso_match = re.search(r"\d{4}-\d{2}-\d{2}", value)
    if iso_match:
        return iso_match.group(0)
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        return parsed.date().isoformat()
    except (TypeError, ValueError, OverflowError):
        return "1970-01-01"


def normalize_doi(value):
    if not value:
        return ""
    value = value.strip()
    value = re.sub(r"^(?:https?://(?:dx\.)?doi\.org/|doi:\s*)", "", value, flags=re.I)
    match = re.search(r"10\.\d{4,9}/\S+", value, flags=re.I)
    return match.group(0).rstrip(".,;)") if match else ""


def format_authors(names):
    cleaned = []
    for name in names:
        for part in re.split(r"\s*;\s*", clean_text(name)):
            if part and part not in cleaned:
                cleaned.append(part)
    if not cleaned:
        return "作者信息暂缺"
    if len(cleaned) <= 5:
        return ", ".join(cleaned)
    return ", ".join(cleaned[:5]) + " 等 {} 人".format(len(cleaned) - 5)


def stable_paper_id(source, doi, url, title):
    identity = doi or url or title
    digest = hashlib.sha1(identity.encode("utf-8", errors="ignore")).hexdigest()[:16]
    return "{}-{}".format(source, digest)


def read_request(build_request):
    for attempt in range(REQUEST_ATTEMPTS):
        try:
            with urllib.request.urlopen(build_request(), timeout=REQUEST_TIMEOUT) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in RETRYABLE_HTTP_CODES or attempt == REQUEST_ATTEMPTS - 1:
                raise
        except (urllib.error.URLError, TimeoutError, OSError):
            if attempt == REQUEST_ATTEMPTS - 1:
                raise
        time.sleep(2 ** attempt)


def request_bytes(url):
    return read_request(lambda: urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/atom+xml, application/rss+xml, application/xml, text/xml, application/json;q=0.8",
        },
    ))


def request_ieee_json(url, payload=None, publication_number=""):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    raw = read_request(lambda: urllib.request.Request(
        url,
        data=body,
        method="POST" if body is not None else "GET",
        headers={
            "User-Agent": IEEE_BROWSER_USER_AGENT,
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Origin": "https://ieeexplore.ieee.org",
            "Referer": "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber={}".format(publication_number),
        },
    ))
    if not raw:
        raise ValueError("IEEE Xplore 返回了空数据")
    return json.loads(raw.decode("utf-8"))


def ieee_publication_number(config):
    match = re.search(r"/TOC(\d+)\.XML", config["url"], flags=re.I)
    if not match:
        raise ValueError("无法识别 IEEE publication number")
    return match.group(1)


def parse_ieee_scope(scope):
    scope = scope if scope in IEEE_SCOPE_OPTIONS else DEFAULT_IEEE_SCOPE
    include_early_access = scope.startswith("ea")
    issue_count = int(scope.split("+", 1)[1]) if "+" in scope else (0 if include_early_access else int(scope))
    return scope, include_early_access, issue_count


def ieee_date(value, fallback_year="", early_access=False):
    if early_access:
        return utc_now().date().isoformat()
    cleaned = clean_text(value).replace(",", "").replace(".", "")
    for date_format in ("%b %Y", "%B %Y"):
        try:
            return datetime.strptime(cleaned, date_format).date().replace(day=1).isoformat()
        except ValueError:
            pass
    year_match = re.search(r"\b(?:19|20)\d{2}\b", cleaned or str(fallback_year))
    return "{}-01-01".format(year_match.group(0)) if year_match else utc_now().date().isoformat()


def ieee_issue_label(issue, early_access=False):
    if early_access:
        return "Early Access"
    parts = []
    if issue.get("volume"):
        parts.append("Vol. {}".format(issue["volume"]))
    if issue.get("issue"):
        parts.append("Issue {}".format(issue["issue"]))
    published = clean_text(issue.get("publicationDateAsStr") or "{} {}".format(issue.get("month", ""), issue.get("year", "")))
    if published:
        parts.append(published)
    return " · ".join(parts) or "正式期"


def paper_abstract(node, title):
    raw = first_value(node, "description", "encoded", "summary", "abstract")
    value = clean_text(raw)
    if title and title.lower() in value.lower():
        start = value.lower().find(title.lower())
        value = (value[:start] + value[start + len(title):]).strip(" .:-")
    metadata_only = (
        len(value) < 45
        or re.fullmatch(r"(?:Nature|Science).*?(?:\d{4}|doi:.*)", value, flags=re.I) is not None
    )
    return NO_ABSTRACT if metadata_only else value


def fetch_arxiv(range_days=DEFAULT_RANGE_DAYS):
    from_date = (utc_now() - timedelta(days=max(range_days - 1, 0))).strftime("%Y%m%d0000")
    to_date = utc_now().strftime("%Y%m%d2359")
    query = "(cat:cs.AI OR cat:cs.LG OR cat:cs.CV) AND submittedDate:[{} TO {}]".format(from_date, to_date)
    params = urllib.parse.urlencode(
        {
            "search_query": query,
            "start": 0,
            "max_results": ARXIV_MAX_RESULTS,
            "sortBy": "submittedDate",
            "sortOrder": "descending",
        }
    )
    root = ET.fromstring(request_bytes("https://export.arxiv.org/api/query?" + params))
    atom = "{http://www.w3.org/2005/Atom}"
    arxiv = "{http://arxiv.org/schemas/atom}"
    papers = []
    for entry in root.findall(atom + "entry"):
        id_url = first_value(entry, "id")
        canonical_id = id_url.rsplit("/", 1)[-1]
        canonical_id = re.sub(r"v\d+$", "", canonical_id)
        links = {link.get("rel", ""): link.get("href", "") for link in entry.findall(atom + "link")}
        categories = [node.get("term", "") for node in entry.findall(atom + "category") if node.get("term")]
        primary_node = entry.find(arxiv + "primary_category")
        primary = primary_node.get("term", "") if primary_node is not None else (categories[0] if categories else "arXiv")
        authors = [first_value(node, "name") for node in entry.findall(atom + "author")]
        url = links.get("alternate") or id_url.replace("http://", "https://")
        papers.append(
            {
                "id": "arxiv-" + canonical_id.replace("/", "-"),
                "source": "arxiv",
                "sourceId": "arxiv",
                "sourceLabel": "arXiv",
                "journal": "arXiv",
                "date": normalize_date(first_value(entry, "published", "updated")),
                "category": primary,
                "title": clean_text(first_value(entry, "title")) or "未命名论文",
                "authors": format_authors(authors),
                "abstract": clean_text(first_value(entry, "summary")) or NO_ABSTRACT,
                "tags": categories[:3] or [primary],
                "url": url,
                "pdfUrl": links.get("related", ""),
                "doi": normalize_doi(first_value(entry, "doi")),
            }
        )
    return papers


def fetch_feed(config):
    root = ET.fromstring(request_bytes(config["url"]))
    items = [node for node in root.iter() if local_name(node.tag) == "item"]
    papers = []
    publisher = config["publisher"]
    source_label = config["label"]
    for item in items:
        title = clean_text(first_value(item, "title")) or "未命名论文"
        links = child_values(item, "link", "url")
        url = next((value for value in links if value.startswith("http")), links[0] if links else "")
        if url.startswith("http://"):
            url = "https://" + url[len("http://") :]
        identifiers = child_values(item, "doi", "identifier", "guid")
        doi = next((normalize_doi(value) for value in identifiers if normalize_doi(value)), "")
        authors = child_values(item, "creator", "authors", "author")
        journal = clean_text(first_value(item, "publicationName")) or config["journal"]
        article_type = clean_text(first_value(item, "type", "category"))
        date = normalize_date(first_value(item, "date", "pubDate", "coverDate"))
        tags = [value for value in [journal, article_type] if value][:3]
        paper = {
            "id": stable_paper_id(publisher, doi, url, title),
            "source": publisher,
            "sourceId": config["id"],
            "sourceLabel": source_label,
            "journal": journal,
            "date": date,
            "category": journal,
            "title": title,
            "authors": format_authors(authors),
            "abstract": paper_abstract(item, title),
            "tags": tags or [config["journal"]],
            "url": url,
            "pdfUrl": "",
            "doi": doi,
        }
        if publisher == "ieee":
            issue = clean_text(first_value(item, "issue"))
            volume = clean_text(first_value(item, "volume"))
            early_access = not issue or issue.lower() == "null" or issue == "99"
            issue_parts = [part for part in ["Vol. {}".format(volume) if volume else "", "Issue {}".format(issue) if issue and not early_access else ""] if part]
            issue_label = "Early Access" if early_access else " · ".join(issue_parts) or "最新正式期"
            paper.update(
                {
                    "issueType": "early-access" if early_access else "formal-issue",
                    "issueLabel": issue_label,
                    "issue": issue,
                    "volume": volume,
                    "ieeeCollectionKey": "rss:{}".format(issue_label),
                }
            )
            paper["tags"] = [config["journal"], issue_label]
        papers.append(paper)
    return papers


def fetch_dblp(config, range_days=DEFAULT_RANGE_DAYS):
    """Fetch recent proceedings metadata from DBLP's public search API."""
    params = urllib.parse.urlencode({
        "q": config["query"],
        "h": config.get("limit", 300),
        "format": "json",
    })
    payload = json.loads(request_bytes("https://dblp.org/search/publ/api?" + params).decode("utf-8"))
    hits = payload.get("result", {}).get("hits", {}).get("hit", []) or []
    if isinstance(hits, dict):
        hits = [hits]
    current_year = utc_now().year
    papers = []
    for hit in hits:
        info = hit.get("info") or {}
        try:
            year = int(info.get("year"))
        except (TypeError, ValueError):
            continue
        # Keep the current and preceding proceedings year.  Conference papers
        # are annual, so a date-range filter would hide a useful whole volume.
        if year < current_year - 1 or year > current_year:
            continue
        title = clean_text(info.get("title")) or "未命名论文"
        author_block = info.get("authors") or {}
        authors = author_block.get("author", []) if isinstance(author_block, dict) else []
        if isinstance(authors, dict):
            authors = [authors]
        author_names = [author.get("text", "") if isinstance(author, dict) else str(author) for author in authors]
        ee = info.get("ee")
        if isinstance(ee, list):
            ee = next((value for value in ee if str(value).startswith("http")), "")
        url = str(ee or info.get("url") or "")
        doi = normalize_doi(info.get("doi", "")) if isinstance(info.get("doi", ""), str) else ""
        if not url and doi:
            url = "https://doi.org/{}".format(doi)
        label = config["label"]
        category = "{} {}".format(label, year)
        papers.append({
            "id": stable_paper_id("conference", doi, url, title),
            "source": "conference",
            "sourceId": config["id"],
            "sourceLabel": label,
            "journal": config["fullName"],
            "date": "{}-07-01".format(year),
            "sortDate": "{}-07-01".format(year),
            "sourceOrder": len(papers),
            "category": category,
            "title": title,
            "authors": format_authors(author_names),
            "abstract": NO_ABSTRACT,
            "tags": [label, "CCF A" if "CCF A" in config["fullName"] else "Robotics", "DBLP"],
            "url": url,
            "pdfUrl": "",
            "doi": doi,
            "conferenceYear": year,
        })
    if not papers:
        raise ValueError("DBLP 未返回 {} 最近两年的论文".format(config["label"]))
    return {"papers": papers, "limited": len(hits) >= config.get("limit", 300), "note": "DBLP 会议题录", "mode": "dblp"}


def ieee_record_to_paper(record, config, issue, early_access, source_order):
    publication_number = ieee_publication_number(config)
    title = clean_text(record.get("articleTitle")) or "未命名论文"
    doi = normalize_doi(record.get("doi", ""))
    document_link = record.get("documentLink") or record.get("htmlLink") or ""
    url = urllib.parse.urljoin("https://ieeexplore.ieee.org", document_link) if document_link else ""
    if not url:
        url = "https://doi.org/{}".format(doi) if doi else "https://ieeexplore.ieee.org"
    pdf_link = record.get("pdfLink") or ""
    authors = []
    for author in record.get("authors") or []:
        if isinstance(author, dict):
            authors.append(author.get("preferredName") or author.get("normalizedName") or "")
        else:
            authors.append(str(author))
    issue_label = ieee_issue_label(issue, early_access=early_access)
    date = ieee_date(
        record.get("publicationDate") or issue.get("publicationDateAsStr") or issue.get("month"),
        fallback_year=record.get("publicationYear") or issue.get("year"),
        early_access=early_access,
    )
    category = "Early Access" if early_access else issue_label
    issue_number = str(issue.get("issueNumber") or record.get("isNumber") or "")
    return {
        "id": stable_paper_id("ieee", doi, url, title),
        "source": "ieee",
        "sourceId": config["id"],
        "sourceLabel": config["label"],
        "journal": config["journal"],
        "date": date,
        "sortDate": date,
        "sourceOrder": source_order,
        "category": category,
        "title": title,
        "authors": format_authors(authors),
        "abstract": clean_text(record.get("abstract")) or NO_ABSTRACT,
        "tags": [config["journal"], category],
        "url": url,
        "pdfUrl": urllib.parse.urljoin("https://ieeexplore.ieee.org", pdf_link) if pdf_link else "",
        "doi": doi,
        "issueType": "early-access" if early_access else "formal-issue",
        "issueLabel": issue_label,
        "issue": clean_text(record.get("issue") or issue.get("issue")),
        "volume": clean_text(record.get("volume") or issue.get("volume")),
        "ieeeCollectionKey": "{}:{}".format("ea" if early_access else "issue", issue_number),
        "publicationNumber": publication_number,
    }


def fetch_ieee_collection(config, issue, early_access=False):
    publication_number = ieee_publication_number(config)
    issue_number = str(issue.get("issueNumber") or "")
    if not issue_number:
        return [], False
    papers = []
    page_number = 1
    limited = False
    while len(papers) < IEEE_MAX_RECORDS_PER_COLLECTION:
        payload = {
            "punumber": publication_number,
            "isnumber": issue_number,
            "rowsPerPage": str(IEEE_ROWS_PER_PAGE),
            "pageNumber": page_number,
            "sortType": "vol-only-newest" if early_access else "vol-only-seq",
            "nonEphemera": True,
        }
        response = request_ieee_json(
            "https://ieeexplore.ieee.org/rest/search/pub/{}/issue/{}/toc".format(publication_number, issue_number),
            payload=payload,
            publication_number=publication_number,
        )
        records = response.get("records") or []
        base_order = len(papers)
        papers.extend(
            ieee_record_to_paper(record, config, issue, early_access, base_order + index)
            for index, record in enumerate(records)
            if not record.get("ephemera")
        )
        total_records = int(response.get("totalRecords") or len(papers))
        total_pages = int(response.get("totalPages") or 1)
        if page_number >= total_pages or not records:
            break
        page_number += 1
    if len(papers) < int(response.get("totalRecords") or len(papers)):
        limited = True
    return papers[:IEEE_MAX_RECORDS_PER_COLLECTION], limited


def flatten_ieee_issues(payload):
    issues = []
    seen = set()
    for decade in payload.get("issuelist") or payload.get("issueList") or []:
        for year in decade.get("years") or []:
            for issue in year.get("issues") or []:
                issue_number = str(issue.get("issueNumber") or "")
                if issue_number and issue_number not in seen:
                    issues.append(issue)
                    seen.add(issue_number)
    return issues


def fetch_ieee(config, scope=DEFAULT_IEEE_SCOPE):
    scope, include_early_access, issue_count = parse_ieee_scope(scope)
    publication_number = ieee_publication_number(config)
    try:
        metadata = request_ieee_json(
            "https://ieeexplore.ieee.org/rest/publication/home/metadata?pubid={}".format(publication_number),
            publication_number=publication_number,
        )
        collections = []
        if include_early_access and metadata.get("preprintIssue"):
            collections.append((metadata["preprintIssue"], True))
        if issue_count:
            if issue_count == 1 and metadata.get("currentIssue"):
                formal_issues = [metadata["currentIssue"]]
            else:
                issue_payload = request_ieee_json(
                    "https://ieeexplore.ieee.org/rest/publication/{}/regular-issues".format(publication_number),
                    publication_number=publication_number,
                )
                formal_issues = flatten_ieee_issues(issue_payload)[:issue_count]
            collections.extend((issue, False) for issue in formal_issues)

        if not collections:
            raise ValueError("IEEE Xplore 未返回可用期次")

        papers = []
        limited = False
        formal_rank = 0
        for issue, early_access in collections:
            if not early_access:
                formal_rank += 1
            collection_papers, collection_limited = fetch_ieee_collection(config, issue, early_access=early_access)
            for paper in collection_papers:
                paper["ieeeIssueRank"] = 0 if early_access else formal_rank
            papers.extend(collection_papers)
            limited = limited or collection_limited
        if not papers:
            raise ValueError("IEEE Xplore 可用期次未返回论文")
        return {
            "papers": deduplicate(papers),
            "limited": limited,
            "note": "IEEE Xplore 官网期次接口",
            "mode": scope,
        }
    except Exception as error:
        papers = fetch_feed(config)
        if not papers:
            raise RuntimeError("IEEE Xplore 与 RSS 均未返回论文：{}".format(error))
        for paper in papers:
            paper["ieeeIssueRank"] = 0 if paper.get("issueType") == "early-access" else 1
        return {
            "papers": papers,
            "limited": True,
            "note": "官网期次接口暂不可用，已回退 RSS：{}".format(error),
            "mode": "rss-fallback",
        }


def source_job(source_id, label, callback):
    try:
        result = callback()
        if isinstance(result, dict):
            papers = result.get("papers", [])
            limited = bool(result.get("limited"))
            note = result.get("note", "")
            mode = result.get("mode", "")
        else:
            papers = result
            limited = False
            note = ""
            mode = ""
        return {
            "id": source_id,
            "label": label,
            "papers": papers,
            "count": len(papers),
            "error": "",
            "limited": limited,
            "note": note,
            "mode": mode,
        }
    except Exception as error:
        return {
            "id": source_id,
            "label": label,
            "papers": [],
            "count": 0,
            "error": "{}: {}".format(type(error).__name__, str(error)),
            "limited": False,
            "note": "",
            "mode": "",
        }


def deduplicate(papers):
    unique = {}
    for paper in papers:
        key = paper.get("doi", "").lower()
        if not key:
            key = re.sub(r"[?#].*$", "", paper.get("url", "").lower())
        if not key:
            key = re.sub(r"\W+", "", paper.get("title", "").lower())
        existing = unique.get(key)
        if not existing or len(paper.get("abstract", "")) > len(existing.get("abstract", "")):
            unique[key] = paper
    return sorted(
        unique.values(),
        key=lambda paper: (paper.get("sortDate") or paper.get("date", ""), -int(paper.get("sourceOrder", 0))),
        reverse=True,
    )


def collect_papers(selected_sources=None, range_days=DEFAULT_RANGE_DAYS, ieee_scope=DEFAULT_IEEE_SCOPE):
    selected = set(selected_sources or ALL_SOURCE_IDS)
    jobs = []
    if "arxiv" in selected:
        jobs.append(("arxiv", "arXiv", partial(fetch_arxiv, range_days)))
    for config in FEEDS:
        if config["id"] in selected:
            callback = partial(fetch_ieee, config, ieee_scope) if config["publisher"] == "ieee" else partial(fetch_feed, config)
            jobs.append((config["id"], config["label"], callback))
    for config in CONFERENCE_FEEDS:
        if config["id"] in selected:
            jobs.append((config["id"], config["label"], partial(fetch_dblp, config, range_days)))

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(source_job, source_id, label, callback) for source_id, label, callback in jobs]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    papers = deduplicate([paper for result in results for paper in result["papers"]])
    statuses = [
        {
            "id": result["id"],
            "label": result["label"],
            "count": result["count"],
            "error": result["error"],
            "limited": result["limited"],
            "note": result["note"],
            "mode": result["mode"],
        }
        for result in sorted(results, key=lambda item: item["label"])
    ]
    return {
        "papers": papers,
        "sources": statuses,
        "errors": [status for status in statuses if status["error"]],
        "fetchedAt": utc_now().isoformat(),
        "requestedSources": [source_id for source_id in ALL_SOURCE_IDS if source_id in selected],
        "ieeeScope": ieee_scope,
        "cached": False,
        "stale": False,
    }


def load_cache():
    try:
        with CACHE_PATH.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        if "papers" not in payload and payload.get("paperIds"):
            history = {paper.get("id"): paper for paper in load_history()}
            payload["papers"] = [history[paper_id] for paper_id in payload["paperIds"] if paper_id in history]
        return payload
    except (OSError, ValueError):
        return None


def cache_is_fresh(payload):
    try:
        fetched = datetime.fromisoformat(payload["fetchedAt"].replace("Z", "+00:00"))
        return (utc_now() - fetched).total_seconds() < CACHE_SECONDS
    except (KeyError, TypeError, ValueError):
        return False


def save_cache(payload):
    compact = {key: value for key, value in payload.items() if key != "papers"}
    compact["paperIds"] = [paper["id"] for paper in payload.get("papers", []) if paper.get("id")]
    temporary = CACHE_PATH.with_suffix(".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        json.dump(compact, handle, ensure_ascii=False, separators=(",", ":"))
    temporary.replace(CACHE_PATH)


def range_cutoff(range_days):
    return (utc_now().date() - timedelta(days=max(range_days - 1, 0))).isoformat()


def load_history():
    try:
        with HISTORY_PATH.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
            return payload.get("papers", []) if isinstance(payload, dict) else payload
    except (OSError, ValueError, TypeError):
        return []


def save_history(papers):
    temporary = HISTORY_PATH.with_suffix(".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        json.dump({"updatedAt": utc_now().isoformat(), "papers": papers}, handle, ensure_ascii=False, separators=(",", ":"))
    temporary.replace(HISTORY_PATH)


def load_source_cache():
    try:
        with SOURCE_CACHE_PATH.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        entries = payload.get("entries", {}) if isinstance(payload, dict) else {}
        return entries if isinstance(entries, dict) else {}
    except (OSError, ValueError, TypeError):
        return {}


def save_source_cache(entries):
    temporary = SOURCE_CACHE_PATH.with_suffix(".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        json.dump(
            {"updatedAt": utc_now().isoformat(), "entries": entries},
            handle,
            ensure_ascii=False,
            separators=(",", ":"),
        )
    temporary.replace(SOURCE_CACHE_PATH)


def source_cache_key(source_id, ieee_scope=DEFAULT_IEEE_SCOPE):
    return "{}|{}".format(source_id, ieee_scope) if source_id in IEEE_SOURCE_IDS else source_id


def update_source_cache(fresh, ieee_scope=DEFAULT_IEEE_SCOPE):
    entries = load_source_cache()
    changed = False
    for status in fresh.get("sources", []):
        source_id = status.get("id")
        if not source_id or status.get("error"):
            continue
        papers = [paper for paper in fresh.get("papers", []) if paper.get("sourceId") == source_id]
        if not papers:
            continue
        entries[source_cache_key(source_id, ieee_scope)] = {
            "sourceId": source_id,
            "ieeeScope": ieee_scope if source_id in IEEE_SOURCE_IDS else "",
            "updatedAt": fresh.get("fetchedAt") or utc_now().isoformat(),
            "papers": deduplicate(papers),
        }
        changed = True
    if changed:
        save_source_cache(entries)
    return entries


def source_fallback_papers(source_id, ieee_scope, source_cache, fallback_payload=None):
    entry = source_cache.get(source_cache_key(source_id, ieee_scope), {})
    papers = entry.get("papers", []) if isinstance(entry, dict) else []
    if papers:
        return papers
    if (
        fallback_payload
        and fallback_payload.get("ieeeScope") == ieee_scope
        and isinstance(fallback_payload.get("papers"), list)
    ):
        return [paper for paper in fallback_payload["papers"] if paper.get("sourceId") == source_id]
    return []


def merge_history(fresh_papers):
    retention_from = (utc_now().date() - timedelta(days=HISTORY_RETENTION_DAYS)).isoformat()
    merged = deduplicate(load_history() + fresh_papers)
    retained = [
        paper for paper in merged
        if paper.get("date", "1970-01-01") >= retention_from and paper.get("sourceId")
    ]
    save_history(retained)
    return retained


def build_range_payload(
    fresh,
    selected,
    range_days,
    ieee_scope=DEFAULT_IEEE_SCOPE,
    source_cache=None,
    fallback_payload=None,
):
    cutoff = range_cutoff(range_days)
    history = merge_history(fresh["papers"])
    ranged_papers = [
        paper for paper in history
        if paper.get("sourceId") in selected
        and paper.get("sourceId") not in IEEE_SOURCE_IDS
        and (paper.get("sourceId") in CONFERENCE_SOURCE_IDS or paper.get("date", "1970-01-01") >= cutoff)
    ]
    source_cache = source_cache if source_cache is not None else load_source_cache()
    status_by_id = {status["id"]: status for status in fresh["sources"]}
    ieee_papers = [paper for paper in fresh["papers"] if paper.get("sourceId") in selected and paper.get("sourceId") in IEEE_SOURCE_IDS]
    stale_sources = []
    for source_id in selected:
        status = status_by_id.get(source_id, {})
        if source_id not in IEEE_SOURCE_IDS or not status.get("error"):
            continue
        fallback_papers = source_fallback_papers(source_id, ieee_scope, source_cache, fallback_payload)
        if fallback_papers:
            ieee_papers.extend(fallback_papers)
            stale_sources.append(source_id)
    papers = deduplicate(ranged_papers + ieee_papers)
    statuses = []
    for status in fresh["sources"]:
        source_id = status["id"]
        current_dates = [paper["date"] for paper in fresh["papers"] if paper.get("sourceId") == source_id and paper.get("date") != "1970-01-01"]
        returned_dates = [paper["date"] for paper in papers if paper.get("sourceId") == source_id and paper.get("date") != "1970-01-01"]
        limited = bool(status.get("limited"))
        if not status["error"]:
            if source_id == "arxiv":
                limited = len(current_dates) >= ARXIV_MAX_RESULTS
            elif source_id not in IEEE_SOURCE_IDS and source_id not in CONFERENCE_SOURCE_IDS:
                limited = not current_dates or min(current_dates) > cutoff
        fallback_used = source_id in stale_sources
        note = status.get("note", "")
        if fallback_used:
            note = "{}；{}".format(note, "本轮获取失败，已保留上次可用数据").strip("；")
        statuses.append(
            {
                "id": source_id,
                "label": status["label"],
                "count": sum(1 for paper in papers if paper.get("sourceId") == source_id),
                "error": status["error"],
                "coverageFrom": min(returned_dates) if returned_dates else "",
                "limited": limited or fallback_used,
                "note": note,
                "mode": status.get("mode", ""),
            }
        )
    coverage_dates = [
        paper["date"] for paper in papers
        if paper.get("sourceId") not in IEEE_SOURCE_IDS
        and paper.get("sourceId") not in CONFERENCE_SOURCE_IDS
        and paper.get("date") != "1970-01-01"
    ]
    return {
        "papers": papers,
        "sources": statuses,
        "errors": [status for status in statuses if status["error"]],
        "fetchedAt": fresh["fetchedAt"],
        "requestedSources": sorted(selected),
        "rangeDays": range_days,
        "ieeeScope": ieee_scope,
        "requestedFrom": cutoff,
        "coverageFrom": min(coverage_dates) if coverage_dates else "",
        "coverageLimited": any(status["limited"] for status in statuses),
        "staleSources": stale_sources,
        "historySize": len(history),
        "cached": False,
        "stale": False,
    }


def get_papers(force=False, selected_sources=None, range_days=DEFAULT_RANGE_DAYS, ieee_scope=DEFAULT_IEEE_SCOPE):
    selected = sorted(set(selected_sources or ALL_SOURCE_IDS))
    range_days = max(1, min(int(range_days), HISTORY_RETENTION_DAYS))
    ieee_scope = ieee_scope if ieee_scope in IEEE_SCOPE_OPTIONS else DEFAULT_IEEE_SCOPE
    with CACHE_LOCK:
        cached = load_cache()
        cache_matches = (
            cached
            and sorted(cached.get("requestedSources", [])) == selected
            and cached.get("rangeDays") == range_days
            and cached.get("ieeeScope") == ieee_scope
        )
        if cached and cache_matches and not force and cache_is_fresh(cached):
            cached["cached"] = True
            return cached

        fresh = collect_papers(selected, range_days=range_days, ieee_scope=ieee_scope)
        source_cache = update_source_cache(fresh, ieee_scope)
        has_successful_source = any(not status["error"] for status in fresh["sources"])
        payload = build_range_payload(
            fresh,
            selected,
            range_days,
            ieee_scope=ieee_scope,
            source_cache=source_cache,
            fallback_payload=cached,
        )
        if has_successful_source:
            save_cache(payload)
            return payload
        if payload["papers"]:
            payload["cached"] = True
            payload["stale"] = True
            return payload
        if cached and cache_matches:
            cached["cached"] = True
            cached["stale"] = True
            cached["errors"] = fresh["errors"]
            return cached
        raise RuntimeError("所有公开数据源均暂时不可用")


def source_catalog():
    return [ARXIV_SOURCE] + [
        {
            "id": feed["id"],
            "label": feed["label"],
            "fullName": feed["fullName"],
            "journal": feed["journal"],
            "group": feed["group"],
            "publisher": feed["publisher"],
        }
        for feed in FEEDS
    ] + [
        {
            "id": feed["id"],
            "label": feed["label"],
            "fullName": feed["fullName"],
            "conference": feed["conference"],
            "group": feed["group"],
            "publisher": feed["publisher"],
            "kind": "conference",
        }
        for feed in CONFERENCE_FEEDS
    ]


STATIC_ASSETS = (
    "index.html",
    "styles.css",
    "hosting-config.js",
    "supabase-config.js",
    "storage.js",
    "cloud-sync.js",
    "app.js",
    "manifest.webmanifest",
    "icon.svg",
    "icon-192.png",
    "icon-512.png",
    "sw.js",
)


def compact_static_paper(paper):
    fields = (
        "id", "source", "sourceId", "sourceLabel", "date", "sortDate", "sourceOrder",
        "category", "title", "authors", "abstract", "tags", "url", "doi", "issueType",
        "issueLabel", "ieeeCollectionKey", "ieeeIssueRank",
    )
    return {field: paper[field] for field in fields if field in paper and paper[field] not in ("", None)}


def write_compact_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))
    temporary.replace(path)


def supabase_key_role(value):
    """Return the role embedded in a legacy JWT key, if one is present."""
    try:
        payload = value.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload.encode("ascii"))
        return json.loads(decoded.decode("utf-8")).get("role", "")
    except (IndexError, ValueError, TypeError, UnicodeError):
        return ""


def build_static_site(output_directory, refresh=True, range_days=STATIC_RANGE_DAYS, ieee_scope=STATIC_IEEE_SCOPE):
    output = Path(output_directory).resolve()
    if output == ROOT or output in ROOT.parents:
        raise ValueError("静态网站输出目录不能是项目目录或其上级目录")
    output.mkdir(parents=True, exist_ok=True)
    sources_directory = output / "data" / "sources"
    sources_directory.mkdir(parents=True, exist_ok=True)
    for old_file in sources_directory.glob("*.json"):
        old_file.unlink()

    if refresh:
        fresh = collect_papers(ALL_SOURCE_IDS, range_days=range_days, ieee_scope=ieee_scope)
        source_cache = update_source_cache(fresh, ieee_scope)
        history = merge_history(fresh["papers"])
    else:
        fresh = load_cache() or {
            "papers": [],
            "sources": [],
            "errors": [],
            "fetchedAt": utc_now().isoformat(),
            "requestedSources": [],
        }
        source_cache = load_source_cache()
        history = load_history()

    status_by_id = {status["id"]: status for status in fresh.get("sources", [])}
    fresh_by_source = {
        source_id: [paper for paper in fresh.get("papers", []) if paper.get("sourceId") == source_id]
        for source_id in ALL_SOURCE_IDS
    }
    cutoff = range_cutoff(range_days)
    catalog_sources = []

    for source in source_catalog():
        source_id = source["id"]
        is_ieee = source_id in IEEE_SOURCE_IDS
        status = dict(status_by_id.get(source_id) or {})
        if is_ieee:
            papers = fresh_by_source[source_id]
            if not papers:
                papers = source_fallback_papers(source_id, ieee_scope, source_cache, fresh)
                if papers:
                    status["limited"] = True
                    status["note"] = "{}；{}".format(
                        status.get("note", ""),
                        "本轮获取失败，已保留上次可用数据",
                    ).strip("；")
                else:
                    papers = [
                        dict(paper) for paper in history
                        if paper.get("sourceId") == source_id and paper.get("date", "1970-01-01") >= cutoff
                    ]
                    for paper in papers:
                        paper.setdefault("ieeeIssueRank", 0 if paper.get("issueType") == "early-access" else 1)
        else:
            papers = [
                paper for paper in history
                if paper.get("sourceId") == source_id
                and (source_id in CONFERENCE_SOURCE_IDS or paper.get("date", "1970-01-01") >= cutoff)
            ]
        papers = deduplicate(papers)
        source_payload = {
            "schemaVersion": 1,
            "sourceId": source_id,
            "fetchedAt": fresh.get("fetchedAt") or utc_now().isoformat(),
            "generatedAt": utc_now().isoformat(),
            "status": {
                "error": status.get("error", ""),
                "limited": bool(status.get("limited")),
                "note": status.get("note", ""),
                "mode": status.get("mode", ""),
            },
            "papers": [compact_static_paper(paper) for paper in papers],
        }
        write_compact_json(sources_directory / "{}.json".format(source_id), source_payload)
        dates = [paper.get("date") for paper in papers if paper.get("date") and paper.get("date") != "1970-01-01"]
        catalog_sources.append({
            "id": source_id,
            "label": source.get("label", source_id),
            "count": len(papers),
            "error": status.get("error", ""),
            "limited": bool(status.get("limited")),
            "coverageFrom": min(dates) if dates else "",
            "mode": status.get("mode", ""),
        })

    for asset in STATIC_ASSETS:
        source_path = ROOT / asset
        if source_path.exists():
            shutil.copy2(str(source_path), str(output / asset))
    (output / "hosting-config.js").write_text("window.PAPERLANE_STATIC_DATA = true;\n", encoding="ascii")

    supabase_url = os.environ.get("PAPERLANE_SUPABASE_URL", "").strip()
    supabase_public_key = (
        os.environ.get("PAPERLANE_SUPABASE_PUBLISHABLE_KEY", "").strip()
        or os.environ.get("PAPERLANE_SUPABASE_ANON_KEY", "").strip()
    )
    if supabase_public_key.startswith("sb_secret_") or supabase_key_role(supabase_public_key) == "service_role":
        raise ValueError("检测到 Supabase secret/service_role key；静态网页只能使用 publishable/anon key")
    configuration_issue = ""
    if not supabase_url or not supabase_public_key:
        configuration_issue = (
            "GitHub Pages 构建未收到 SUPABASE_URL 和 SUPABASE_PUBLISHABLE_KEY；"
            "设置 Repository variables 后请重新运行 Pages workflow"
        )
    config = (
        "// Generated at build time. Never use a secret or service_role key here.\n"
        "window.PAPERLANE_SUPABASE = Object.freeze({\n"
        "  url: %s,\n"
        "  anonKey: %s,\n"
        "  configurationIssue: %s,\n"
        "});\n"
    ) % (
        json.dumps(supabase_url),
        json.dumps(supabase_public_key),
        json.dumps(configuration_issue, ensure_ascii=False),
    )
    (output / "supabase-config.js").write_text(config, encoding="utf-8")

    source_version = {"version": "0.6.0"}
    try:
        with (ROOT / "version.json").open("r", encoding="utf-8") as handle:
            source_version.update(json.load(handle))
    except (OSError, ValueError, TypeError):
        pass
    source_version.update({
        "revision": os.environ.get("PAPERLANE_REVISION", "local"),
        "builtAt": utc_now().isoformat(),
        "dataUpdatedAt": fresh.get("fetchedAt") or utc_now().isoformat(),
    })
    revision = re.sub(r"[^0-9a-zA-Z_-]", "", source_version["revision"])[:16]
    if revision and revision != "local":
        service_worker_path = output / "sw.js"
        service_worker = service_worker_path.read_text(encoding="utf-8")
        service_worker = re.sub(r"paperlane-shell-v\d+", "paperlane-shell-{}".format(revision), service_worker)
        service_worker_path.write_text(service_worker, encoding="utf-8")
    write_compact_json(output / "version.json", source_version)
    write_compact_json(output / "data" / "catalog.json", {
        "schemaVersion": 1,
        "generatedAt": utc_now().isoformat(),
        "fetchedAt": fresh.get("fetchedAt") or utc_now().isoformat(),
        "rangeDays": range_days,
        "ieeeScope": ieee_scope,
        "sources": catalog_sources,
    })
    (output / ".nojekyll").write_text("", encoding="ascii")
    return {
        "output": str(output),
        "sources": len(catalog_sources),
        "papers": sum(source["count"] for source in catalog_sources),
        "errors": sum(1 for source in catalog_sources if source["error"]),
        "fetchedAt": fresh.get("fetchedAt"),
    }


class PaperlaneHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".webmanifest": "application/manifest+json",
    }

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/health":
            self.send_json(200, {"ok": True, "service": "Paperlane", "time": utc_now().isoformat()})
            return
        if parsed.path == "/api/catalog":
            self.send_json(200, {"sources": source_catalog()})
            return
        if parsed.path == "/api/papers":
            query = urllib.parse.parse_qs(parsed.query)
            force = query.get("refresh", ["0"])[0] == "1"
            requested = query.get("sources", [""])[0]
            selected = [source_id for source_id in requested.split(",") if source_id in ALL_SOURCE_IDS] if requested else ALL_SOURCE_IDS
            try:
                range_days = int(query.get("days", [str(DEFAULT_RANGE_DAYS)])[0])
            except ValueError:
                range_days = DEFAULT_RANGE_DAYS
            ieee_scope = query.get("ieee", [DEFAULT_IEEE_SCOPE])[0]
            try:
                self.send_json(
                    200,
                    get_papers(
                        force=force,
                        selected_sources=selected,
                        range_days=range_days,
                        ieee_scope=ieee_scope,
                    ),
                )
            except Exception as error:
                self.send_json(502, {"papers": [], "errors": [{"label": "全部来源", "error": str(error)}]})
            return
        super().do_GET()

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        compressed = "gzip" in self.headers.get("Accept-Encoding", "").lower() and len(body) > 1024
        if compressed:
            body = gzip.compress(body, compresslevel=5)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        if compressed:
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, message_format, *args):
        print("[Paperlane] {} - {}".format(self.address_string(), message_format % args))


def main():
    parser = argparse.ArgumentParser(description="Paperlane local server")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--refresh-once", action="store_true")
    parser.add_argument("--build-static", metavar="DIRECTORY")
    parser.add_argument("--static-from-cache", action="store_true")
    parser.add_argument("--days", type=int, default=STATIC_RANGE_DAYS)
    parser.add_argument("--ieee-scope", choices=sorted(IEEE_SCOPE_OPTIONS), default=STATIC_IEEE_SCOPE)
    args = parser.parse_args()

    if args.build_static:
        summary = build_static_site(
            args.build_static,
            refresh=not args.static_from_cache,
            range_days=max(1, min(args.days, HISTORY_RETENTION_DAYS)),
            ieee_scope=args.ieee_scope,
        )
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return

    if args.refresh_once:
        payload = get_papers(
            force=True,
            selected_sources=ALL_SOURCE_IDS,
            range_days=max(1, min(args.days, HISTORY_RETENTION_DAYS)),
            ieee_scope=args.ieee_scope,
        )
        summary = {
            "papers": len(payload["papers"]),
            "sources": payload["sources"],
            "fetchedAt": payload["fetchedAt"],
            "rangeDays": payload["rangeDays"],
            "ieeeScope": payload["ieeeScope"],
            "coverageFrom": payload["coverageFrom"],
            "coverageLimited": payload["coverageLimited"],
        }
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return

    handler = partial(PaperlaneHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print("Paperlane is running at http://localhost:{}".format(args.port))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
