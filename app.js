const PAGE_SIZE = 60;

const sourceCatalog = [
  { id: "all", label: "全部论文", icon: "ALL", color: "#102a43", group: "all" },
  { id: "arxiv", label: "arXiv", fullName: "arXiv · AI / ML / CV", icon: "aX", color: "#c2410c", group: "arxiv" },
  { id: "ieee-tac", label: "TAC", fullName: "IEEE Transactions on Automatic Control", icon: "TAC", color: "#7c3aed", group: "control" },
  { id: "ieee-tro", label: "T-RO", fullName: "IEEE Transactions on Robotics", icon: "TRO", color: "#7c3aed", group: "control" },
  { id: "ieee-tcst", label: "TCST", fullName: "IEEE Transactions on Control Systems Technology", icon: "TCST", color: "#7c3aed", group: "control" },
  { id: "ieee-tase", label: "T-ASE", fullName: "IEEE Transactions on Automation Science and Engineering", icon: "ASE", color: "#7c3aed", group: "control" },
  { id: "ieee-tsmc", label: "TSMC Systems", fullName: "IEEE Transactions on Systems, Man, and Cybernetics: Systems", icon: "SMC", color: "#7c3aed", group: "control" },
  { id: "ieee-tcyb", label: "TCYB", fullName: "IEEE Transactions on Cybernetics", icon: "CYB", color: "#7c3aed", group: "control" },
  { id: "ieee-thms", label: "THMS", fullName: "IEEE Transactions on Human-Machine Systems", icon: "HMS", color: "#7c3aed", group: "control" },
  { id: "ieee-tie", label: "TIE", fullName: "IEEE Transactions on Industrial Electronics", icon: "TIE", color: "#2563eb", group: "industrial" },
  { id: "ieee-tii", label: "TII", fullName: "IEEE Transactions on Industrial Informatics", icon: "TII", color: "#2563eb", group: "industrial" },
  { id: "ieee-tmech", label: "T-Mech", fullName: "IEEE/ASME Transactions on Mechatronics", icon: "MECH", color: "#2563eb", group: "industrial" },
  { id: "ieee-tits", label: "TITS", fullName: "IEEE Transactions on Intelligent Transportation Systems", icon: "TITS", color: "#2563eb", group: "industrial" },
  { id: "ieee-taes", label: "TAES", fullName: "IEEE Transactions on Aerospace and Electronic Systems", icon: "TAES", color: "#a16207", group: "aerospace" },
  { id: "ieee-tap", label: "TAP", fullName: "IEEE Transactions on Antennas and Propagation", icon: "TAP", color: "#a16207", group: "aerospace" },
  { id: "ieee-temc", label: "TEMC", fullName: "IEEE Transactions on Electromagnetic Compatibility", icon: "EMC", color: "#a16207", group: "aerospace" },
  { id: "ieee-tim", label: "TIM", fullName: "IEEE Transactions on Instrumentation and Measurement", icon: "TIM", color: "#a16207", group: "aerospace" },
  { id: "ieee-tmtt", label: "TMTT", fullName: "IEEE Transactions on Microwave Theory and Techniques", icon: "MTT", color: "#a16207", group: "aerospace" },
  { id: "ieee-trel", label: "TR", fullName: "IEEE Transactions on Reliability", icon: "TR", color: "#a16207", group: "aerospace" },
  { id: "ieee-tvt", label: "TVT", fullName: "IEEE Transactions on Vehicular Technology", icon: "TVT", color: "#a16207", group: "aerospace" },
  { id: "ieee-tcom", label: "TCOM", fullName: "IEEE Transactions on Communications", icon: "COM", color: "#a16207", group: "aerospace" },
  { id: "ieee-tgrs", label: "TGRS", fullName: "IEEE Transactions on Geoscience and Remote Sensing", icon: "GRS", color: "#a16207", group: "aerospace" },
  { id: "ieee-tpami", label: "TPAMI", fullName: "IEEE Transactions on Pattern Analysis and Machine Intelligence", icon: "PAMI", color: "#3551a4", group: "computer" },
  { id: "ieee-tnnls", label: "TNNLS", fullName: "IEEE Transactions on Neural Networks and Learning Systems", icon: "NN", color: "#3551a4", group: "computer" },
  { id: "ieee-tip", label: "TIP", fullName: "IEEE Transactions on Image Processing", icon: "TIP", color: "#3551a4", group: "computer" },
  { id: "ieee-tsp", label: "TSP", fullName: "IEEE Transactions on Signal Processing", icon: "TSP", color: "#3551a4", group: "computer" },
  { id: "ieee-tkde", label: "TKDE", fullName: "IEEE Transactions on Knowledge and Data Engineering", icon: "KDE", color: "#3551a4", group: "computer" },
  { id: "ieee-tmm", label: "TMM", fullName: "IEEE Transactions on Multimedia", icon: "TMM", color: "#3551a4", group: "computer" },
  { id: "ieee-tcsvt", label: "TCSVT", fullName: "IEEE Transactions on Circuits and Systems for Video Technology", icon: "V", color: "#3551a4", group: "computer" },
  { id: "ieee-tmi", label: "TMI", fullName: "IEEE Transactions on Medical Imaging", icon: "TMI", color: "#3551a4", group: "computer" },
  { id: "ieee-tvcg", label: "TVCG", fullName: "IEEE Transactions on Visualization and Computer Graphics", icon: "VCG", color: "#3551a4", group: "computer" },
  { id: "ieee-tc", label: "TC", fullName: "IEEE Transactions on Computers", icon: "TC", color: "#3551a4", group: "computer" },
  { id: "ieee-tse", label: "TSE", fullName: "IEEE Transactions on Software Engineering", icon: "TSE", color: "#3551a4", group: "computer" },
  { id: "nature", label: "Nature", fullName: "Nature", icon: "N", color: "#0f766e", group: "nature-science" },
  { id: "nature-machine-intelligence", label: "NMI", fullName: "Nature Machine Intelligence", icon: "NMI", color: "#0f766e", group: "nature-science" },
  { id: "nature-communications", label: "NC", fullName: "Nature Communications", icon: "NC", color: "#0f766e", group: "nature-science" },
  { id: "nature-methods", label: "NMeth", fullName: "Nature Methods", icon: "NM", color: "#0f766e", group: "nature-science" },
  { id: "nature-biomedical-engineering", label: "NBE", fullName: "Nature Biomedical Engineering", icon: "NBE", color: "#0f766e", group: "nature-science" },
  { id: "science", label: "Science", fullName: "Science", icon: "S", color: "#3551a4", group: "nature-science" },
  { id: "science-robotics", label: "SR", fullName: "Science Robotics", icon: "SR", color: "#3551a4", group: "nature-science" },
];

const DEFAULT_ENABLED_SOURCES = [
  "arxiv", "ieee-tac", "ieee-tro", "ieee-taes", "ieee-tpami", "ieee-tnnls", "ieee-tip",
  "nature", "nature-machine-intelligence", "nature-communications", "science", "science-robotics",
];

const seedPapers = [
  {
    id: "arxiv-2508-04121",
    source: "arxiv",
    sourceLabel: "arXiv",
    date: "2025-08-08",
    category: "cs.AI",
    title: "Reasoning Under Uncertainty: A Benchmark for Calibrated Multimodal Agents",
    authors: "Mina Park, Yutong Chen, Elias Moritz, and 4 more",
    abstract: "We introduce a benchmark for measuring whether multimodal agents can express and update uncertainty while solving long-horizon tasks. The evaluation spans visual grounding, tool use, and evidence attribution across 12 domains.",
    tags: ["AI", "Multimodal", "Benchmark"],
    url: "https://arxiv.org/abs/2508.04121",
  },
  {
    id: "arxiv-2508-03986",
    source: "arxiv",
    sourceLabel: "arXiv",
    date: "2025-08-07",
    category: "cs.LG",
    title: "Sparse Mixture-of-Experts with Adaptive Routing for Efficient Long-Context Learning",
    authors: "Harish Iyer, Sofia Alvarez, Kazuki Sato, and 2 more",
    abstract: "This paper proposes a routing strategy that makes expert activation depend on both token-level novelty and context position. The method reduces active parameters while preserving long-context retrieval quality.",
    tags: ["Machine Learning", "MoE", "Long Context"],
    url: "https://arxiv.org/abs/2508.03986",
  },
  {
    id: "arxiv-2508-03847",
    source: "arxiv",
    sourceLabel: "arXiv",
    date: "2025-08-07",
    category: "cs.CV",
    title: "From Pixels to Programs: Visual World Models for Open-Ended Interaction",
    authors: "Nora Stein, Diego Mendez, Priya Shah, and 5 more",
    abstract: "We study visual world models that translate observations into executable programs. A compact latent state allows an agent to plan interventions and recover from visual changes without task-specific finetuning.",
    tags: ["Computer Vision", "World Model", "Planning"],
    url: "https://arxiv.org/abs/2508.03847",
  },
  {
    id: "nature-2025-robust-cells",
    source: "nature",
    sourceLabel: "Nature",
    date: "2025-08-06",
    category: "Research Article",
    title: "A spatial atlas of cellular resilience across human tissues",
    authors: "L. M. Ortega, Chen Wei, Amara Williams, and 18 more",
    abstract: "A single-cell and spatial transcriptomic atlas reveals shared programs associated with tissue resilience. The study identifies cell-state transitions that predict recovery after inflammatory stress.",
    tags: ["Cell Biology", "Spatial Omics"],
    url: "https://www.nature.com/",
  },
  {
    id: "science-2025-adaptive-matter",
    source: "science",
    sourceLabel: "Science",
    date: "2025-08-05",
    category: "Research Article",
    title: "Programmable matter through reversible mechanical phase transitions",
    authors: "J. A. Kim, Ravi Nair, Elena Rossi, and 9 more",
    abstract: "We demonstrate a class of mechanical metamaterials that switch between load-bearing and reconfigurable states. Reversible phase transitions are controlled by a low-power field and remain stable under repeated cycling.",
    tags: ["Materials", "Metamaterials"],
    url: "https://www.science.org/",
  },
  {
    id: "ieee-2025-privacy-learning",
    source: "ieee-tpami",
    sourceLabel: "TPAMI",
    date: "2025-08-04",
    category: "TMLR",
    title: "Private Federated Learning with Heterogeneous Client Reliability",
    authors: "M. R. Hassan, Qian Luo, Tobias Klein, and 3 more",
    abstract: "We present a federated optimization framework that jointly models client reliability and privacy budget. The approach limits the influence of unstable clients while maintaining formal differential privacy guarantees.",
    tags: ["Federated Learning", "Privacy"],
    url: "https://ieeexplore.ieee.org/",
  },
  {
    id: "ieee-2025-robotic-sensing",
    source: "ieee-tro",
    sourceLabel: "T-RO",
    date: "2025-08-02",
    category: "TRO",
    title: "Contact-Aware Tactile Sensing for Dexterous Manipulation in the Wild",
    authors: "A. B. Patel, Jun Seo, Maria Ferreira, and 6 more",
    abstract: "A tactile sensing stack combines event-based contact features with uncertainty-aware state estimation. Experiments on cluttered household tasks show improved grasp recovery and transfer across objects.",
    tags: ["Robotics", "Tactile Sensing"],
    url: "https://ieeexplore.ieee.org/",
  },
  {
    id: "arxiv-2508-03208",
    source: "arxiv",
    sourceLabel: "arXiv",
    date: "2025-08-01",
    category: "cs.AI",
    title: "A Practical Theory of Tool Selection in Language Model Agents",
    authors: "Noah Feldman, Ying Xu, and Isabelle Laurent",
    abstract: "We formalize tool selection as a partially observed decision problem and derive a simple policy that balances expected utility with execution risk. The analysis explains why concise tool descriptions improve reliability.",
    tags: ["Agents", "Tool Use"],
    url: "https://arxiv.org/abs/2508.03208",
  },
  {
    id: "arxiv-2507-02911",
    source: "arxiv",
    sourceLabel: "arXiv",
    date: "2025-07-30",
    category: "cs.LG",
    title: "Learning Compact Representations for Scientific Discovery with Structured Priors",
    authors: "Mei Lin, Anton Weber, Camila Torres, and 3 more",
    abstract: "We propose a representation learning objective that injects lightweight structural priors from scientific ontologies. The resulting embeddings improve transfer across low-data discovery tasks without additional labels.",
    tags: ["Representation Learning", "Science"],
    url: "https://arxiv.org/abs/2507.02911",
  },
  {
    id: "arxiv-2507-02587",
    source: "arxiv",
    sourceLabel: "arXiv",
    date: "2025-07-29",
    category: "cs.CV",
    title: "Geometry-Aware Video Reasoning with Persistent Scene Memory",
    authors: "Iris Novak, Daniel Okafor, Hyejin Kim, and 2 more",
    abstract: "A persistent scene memory tracks geometry and object identity across long videos. The model improves temporal question answering and physical interaction prediction under camera motion.",
    tags: ["Video", "3D Vision"],
    url: "https://arxiv.org/abs/2507.02587",
  },
  {
    id: "arxiv-2507-02174",
    source: "arxiv",
    sourceLabel: "arXiv",
    date: "2025-07-28",
    category: "cs.AI",
    title: "Evaluating Scientific Agents with Reproducible Experiment Traces",
    authors: "S. R. Mehta, Laura Jensen, Wenbo Liu, and 5 more",
    abstract: "We release an evaluation set that records complete experiment traces, including failed runs, configuration changes, and evidence links. The benchmark measures whether agents produce conclusions that can be reproduced by another lab.",
    tags: ["Scientific AI", "Evaluation"],
    url: "https://arxiv.org/abs/2507.02174",
  },
  {
    id: "arxiv-2507-01812",
    source: "arxiv",
    sourceLabel: "arXiv",
    date: "2025-07-27",
    category: "cs.RO",
    title: "Risk-Sensitive Policy Learning for Contact-Rich Robot Assembly",
    authors: "Keita Nakamura, Elena Petrova, Joseph Brooks, and 4 more",
    abstract: "The policy uses contact-state uncertainty to choose safer corrective actions during assembly. It learns from sparse failures and transfers across tolerances, materials, and fixture layouts.",
    tags: ["Robotics", "Policy Learning"],
    url: "https://arxiv.org/abs/2507.01812",
  },
  {
    id: "nature-2025-quantum-correction",
    source: "nature",
    sourceLabel: "Nature",
    date: "2025-07-26",
    category: "Article",
    title: "Fault-tolerant control of a modular quantum processor",
    authors: "N. Gupta, I. Petrov, Sarah Bell, and 21 more",
    abstract: "A modular control architecture reduces correlated errors between quantum processing units. The experiment demonstrates stable logical operations during repeated interconnect reconfiguration.",
    tags: ["Quantum", "Error Correction"],
    url: "https://www.nature.com/",
  },
  {
    id: "nature-2025-ecosystem-recovery",
    source: "nature",
    sourceLabel: "Nature",
    date: "2025-07-24",
    category: "Brief Communication",
    title: "Early-warning signals of ecosystem recovery after disturbance",
    authors: "A. R. Bell, Tomas Silva, and 11 more",
    abstract: "Longitudinal ecological measurements reveal dynamical signals that precede recovery across lakes and grasslands. The findings support monitoring strategies that distinguish resilience from temporary fluctuation.",
    tags: ["Ecology", "Resilience"],
    url: "https://www.nature.com/",
  },
  {
    id: "science-2025-neural-plasticity",
    source: "science",
    sourceLabel: "Science",
    date: "2025-07-22",
    category: "Research Article",
    title: "A circuit mechanism for stable learning in adult neural networks",
    authors: "M. D. Rivera, Sunil Rao, Emily Hart, and 14 more",
    abstract: "We identify a circuit-level mechanism that allows adult neural networks to incorporate new associations while preserving established representations. Targeted perturbations reproduce the predicted stability-plasticity tradeoff.",
    tags: ["Neuroscience", "Learning"],
    url: "https://www.science.org/",
  },
  {
    id: "ieee-2025-graph-foundation",
    source: "ieee-tpami",
    sourceLabel: "TPAMI",
    date: "2025-07-20",
    category: "TPAMI",
    title: "Graph Foundation Models for Open-World Visual Recognition",
    authors: "Rui Zhang, Hannah Cole, Yifan Zhao, and 6 more",
    abstract: "A graph foundation model represents visual entities and relations in a continuously expanding label space. It reduces catastrophic forgetting when new categories arrive without curated retraining batches.",
    tags: ["Computer Vision", "Graph Learning"],
    url: "https://ieeexplore.ieee.org/",
  },
];

const defaultGroups = [
  { id: "group-deep-read", name: "待精读", color: "#0f766e" },
  { id: "group-methods", name: "方法与工具", color: "#2563eb" },
];

function enabledCatalog() {
  return [sourceCatalog[0], ...sourceCatalog.slice(1).filter((source) => state.enabledSources.includes(source.id))];
}

function rangeLabel(days = state.rangeDays) {
  return days === 365 ? "最近 1 年" : `最近 ${days} 天`;
}

function ieeeScopeLabel(scope = state.ieeeScope) {
  if (scope === "ea") return "仅 Early Access";
  if (scope.startsWith("ea+")) return `Early Access + 最近 ${scope.slice(3)} 期`;
  return `仅最近 ${scope} 期`;
}

function paperSourceId(paper) {
  return paper.sourceId || paper.source;
}

function isIeeePaper(paper) {
  return paper.source === "ieee" || paperSourceId(paper).startsWith("ieee-");
}

function usesStaticData() {
  const override = new URLSearchParams(window.location.search).get("static");
  if (override === "1") return true;
  if (override === "0") return false;
  return Boolean(window.PAPERLANE_STATIC_DATA);
}

function matchesStaticIeeeScope(paper) {
  if (!isIeeePaper(paper) || state.dataMode !== "static") return true;
  const includeEarlyAccess = state.ieeeScope === "ea" || state.ieeeScope.startsWith("ea+");
  const issueCount = state.ieeeScope.includes("+")
    ? Number(state.ieeeScope.split("+")[1])
    : state.ieeeScope === "ea" ? 0 : Number(state.ieeeScope);
  if (paper.issueType === "early-access") return includeEarlyAccess;
  return issueCount > 0 && Number(paper.ieeeIssueRank || 1) <= issueCount;
}

function comparePapers(a, b) {
  const dateOrder = (b.sortDate || b.date || "").localeCompare(a.sortDate || a.date || "");
  return dateOrder || Number(a.sourceOrder || 0) - Number(b.sourceOrder || 0);
}

const state = {
  activeSource: "all",
  activeFilter: "all",
  query: "",
  papers: [...seedPapers],
  enabledSources: [...DEFAULT_ENABLED_SOURCES],
  rangeDays: 30,
  ieeeScope: "ea+1",
  read: {},
  important: {},
  groups: [...defaultGroups],
  groupItems: {},
  renderLimit: PAGE_SIZE,
  dataMode: usesStaticData() ? "static" : "local",
  dataUpdatedAt: "",
  appVersion: "0.5.1",
};

const store = new window.PaperlaneStore();
const cloud = new window.PaperlaneCloud(store);
let feedPapers = [...seedPapers];
let activeNamespace = "guest";
let syncTimer = 0;

const els = {
  sourceNav: document.querySelector("#sourceNav"),
  groupNav: document.querySelector("#groupNav"),
  paperList: document.querySelector("#paperList"),
  emptyState: document.querySelector("#emptyState"),
  feedTitle: document.querySelector("#feedTitle"),
  visibleCount: document.querySelector("#visibleCount"),
  searchInput: document.querySelector("#searchInput"),
  toast: document.querySelector("#toast"),
  groupModal: document.querySelector("#groupModal"),
  groupForm: document.querySelector("#groupForm"),
  groupName: document.querySelector("#groupName"),
  paperGroupModal: document.querySelector("#paperGroupModal"),
  paperGroupForm: document.querySelector("#paperGroupForm"),
  groupPicker: document.querySelector("#groupPicker"),
  modalPaperTitle: document.querySelector("#modalPaperTitle"),
  lastUpdated: document.querySelector("#lastUpdated"),
  sourceStripText: document.querySelector("#sourceStripText"),
  sourceStripMeta: document.querySelector("#sourceStripMeta"),
  connectionState: document.querySelector("#connectionState"),
  todayBreadcrumb: document.querySelector("#todayBreadcrumb"),
  manageSourcesButton: document.querySelector("#manageSourcesButton"),
  sourcesModal: document.querySelector("#sourcesModal"),
  sourcesForm: document.querySelector("#sourcesForm"),
  sourcePicker: document.querySelector("#sourcePicker"),
  sourcePickerSearch: document.querySelector("#sourcePickerSearch"),
  sourceSelectionSummary: document.querySelector("#sourceSelectionSummary"),
  timeRangeSelect: document.querySelector("#timeRangeSelect"),
  ieeeScopeSelect: document.querySelector("#ieeeScopeSelect"),
  loadMoreButton: document.querySelector("#loadMoreButton"),
  profileButton: document.querySelector("#profileButton"),
  accountModal: document.querySelector("#accountModal"),
  accountMode: document.querySelector("#accountMode"),
  accountDetail: document.querySelector("#accountDetail"),
  accountForm: document.querySelector("#accountForm"),
  accountEmail: document.querySelector("#accountEmail"),
  accountPassword: document.querySelector("#accountPassword"),
  accountSignedOut: document.querySelector("#accountSignedOut"),
  accountSignedIn: document.querySelector("#accountSignedIn"),
  accountUserEmail: document.querySelector("#accountUserEmail"),
  syncNowButton: document.querySelector("#syncNowButton"),
  signOutButton: document.querySelector("#signOutButton"),
  signUpButton: document.querySelector("#signUpButton"),
  syncStatusText: document.querySelector("#syncStatusText"),
  storageUsage: document.querySelector("#storageUsage"),
  exportButton: document.querySelector("#exportButton"),
  clearDeviceButton: document.querySelector("#clearDeviceButton"),
  accountInstallButton: document.querySelector("#accountInstallButton"),
  syncCard: document.querySelector("#syncCard"),
  appVersion: document.querySelector("#appVersion"),
  updateBanner: document.querySelector("#updateBanner"),
  applyUpdateButton: document.querySelector("#applyUpdateButton"),
  dismissUpdateButton: document.querySelector("#dismissUpdateButton"),
  installModal: document.querySelector("#installModal"),
  installGuideTitle: document.querySelector("#installGuideTitle"),
  installGuideIntro: document.querySelector("#installGuideIntro"),
  installGuideSteps: document.querySelector("#installGuideSteps"),
  installGuideNote: document.querySelector("#installGuideNote"),
  retryInstallButton: document.querySelector("#retryInstallButton"),
};

let selectedColor = "#0f766e";
let paperForGroup = null;
let toastTimer;
let deferredInstallPrompt;
let sourcePickerSelection = new Set();
let pendingServiceWorker = null;
let serviceWorkerRegistration = null;
let serviceWorkerSetupPromise = null;
let lastSyncError = "";
let abstractResizeTimer = 0;
const expandedAbstracts = new Set();
const collapsibleAbstracts = new Set();

function validSettings(settings) {
  if (!settings) return null;
  const validIds = new Set(sourceCatalog.slice(1).map((source) => source.id));
  const enabledSources = Array.isArray(settings.enabledSources) ? settings.enabledSources.filter((id) => validIds.has(id)) : [];
  const rangeDays = [1, 3, 7, 30, 90, 180, 365].includes(Number(settings.rangeDays)) ? Number(settings.rangeDays) : 30;
  const ieeeScope = new Set(["ea", "1", "2", "3", "5", "ea+1", "ea+2", "ea+3", "ea+5"]).has(settings.ieeeScope) ? settings.ieeeScope : "ea+1";
  return { enabledSources: enabledSources.length ? enabledSources : [...DEFAULT_ENABLED_SOURCES], rangeDays, ieeeScope };
}

async function loadWorkspace(namespace, seedGroups = false) {
  const workspace = await store.loadWorkspace(namespace);
  state.papers = [...feedPapers];
  const settings = validSettings(workspace.settings);
  state.enabledSources = settings?.enabledSources || [...DEFAULT_ENABLED_SOURCES];
  state.rangeDays = settings?.rangeDays || 30;
  state.ieeeScope = settings?.ieeeScope || "ea+1";
  state.read = {};
  state.important = {};
  workspace.paperStates.filter((record) => !record.deletedAt).forEach((record) => {
    if (record.isRead) state.read[record.paperId] = true;
    if (record.isImportant) state.important[record.paperId] = true;
  });
  state.groups = workspace.collections.filter((record) => !record.deletedAt).map(({ id, name, color, updatedAt }) => ({ id, name, color, updatedAt }));
  if (seedGroups && !workspace.collections.length) {
    state.groups = defaultGroups.map((group) => ({ ...group }));
    await Promise.all(state.groups.map((group) => store.saveCollection(namespace, group, false)));
  }
  state.groupItems = {};
  workspace.memberships.filter((record) => !record.deletedAt).forEach((record) => {
    state.groupItems[record.collectionId] ||= {};
    state.groupItems[record.collectionId][record.paperId] = true;
  });
  const knownIds = new Set(state.papers.map((paper) => paper.id));
  workspace.snapshots.filter((record) => !record.deletedAt && record.snapshot && !knownIds.has(record.paperId)).forEach((record) => state.papers.push(record.snapshot));
  state.renderLimit = PAGE_SIZE;
  els.timeRangeSelect.value = String(state.rangeDays);
  els.ieeeScopeSelect.value = state.ieeeScope;
}

async function saveSettings() {
  await store.saveSettings(activeNamespace, {
    enabledSources: state.enabledSources,
    rangeDays: state.rangeDays,
    ieeeScope: state.ieeeScope,
  });
  scheduleSync();
}

function scheduleSync() {
  if (!cloud.user || !navigator.onLine) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncAccount(true), 900);
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(date);
}

function relativeDate(dateString) {
  const now = new Date();
  const date = new Date(`${dateString}T12:00:00`);
  const days = Math.floor((now - date) / 86400000);
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  return formatDate(dateString);
}

function updateTodayBreadcrumb() {
  if (!els.todayBreadcrumb) return;
  const today = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
  els.todayBreadcrumb.textContent = `今天 · ${today}`;
}

function sourceCount(sourceId) {
  if (sourceId === "all") return enabledPapers().length;
  return enabledPapers().filter((paper) => paperSourceId(paper) === sourceId).length;
}

function currentRangeCutoff() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - Math.max(state.rangeDays - 1, 0));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function enabledPapers() {
  const cutoff = currentRangeCutoff();
  return state.papers.filter((paper) => {
    if (!state.enabledSources.includes(paperSourceId(paper))) return false;
    if (!matchesStaticIeeeScope(paper)) return false;
    return isIeeePaper(paper) || paper.date >= cutoff;
  });
}

function filteredPapers() {
  const normalizedQuery = state.query.trim().toLowerCase();
  return enabledPapers()
    .filter((paper) => state.activeSource === "all" || paperSourceId(paper) === state.activeSource)
    .filter((paper) => {
      if (state.activeFilter === "unread") return !state.read[paper.id];
      if (state.activeFilter === "important") return Boolean(state.important[paper.id]);
      if (state.activeFilter === "read") return Boolean(state.read[paper.id]);
      return true;
    })
    .filter((paper) => {
      if (!normalizedQuery) return true;
      return [paper.title, paper.authors, paper.abstract, paper.category, ...paper.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort(comparePapers);
}

function renderSources() {
  els.sourceNav.innerHTML = enabledCatalog().map((source) => `
    <button class="nav-item ${state.activeSource === source.id ? "active" : ""}" data-source="${source.id}" title="${escapeHtml(source.fullName || source.label)}">
      <span class="nav-icon" style="background:${source.color}">${source.icon}</span>
      <span class="source-nav-copy"><strong>${source.label}</strong>${source.fullName ? `<small>${escapeHtml(source.fullName)}</small>` : ""}</span>
      <span class="nav-count">${sourceCount(source.id)}</span>
    </button>
  `).join("");

  els.groupNav.innerHTML = state.groups.map((group) => {
    const count = Object.values(state.groupItems[group.id] || {}).filter(Boolean).length;
    return `
      <div class="nav-item group-nav-item ${state.activeSource === `group:${group.id}` ? "active" : ""}">
        <button class="group-select" data-source="group:${escapeHtml(group.id)}">
          <span class="group-dot" style="background:${safeColor(group.color)}"></span>
          <span>${escapeHtml(group.name)}</span>
          <span class="nav-count">${count}</span>
        </button>
        <button class="group-delete" data-group-delete="${escapeHtml(group.id)}" title="删除分组" aria-label="删除分组">×</button>
      </div>
    `;
  }).join("");
}

function renderSourcePicker() {
  if (!els.sourcePicker) return;
  const query = (els.sourcePickerSearch?.value || "").trim().toLowerCase();
  const options = sourceCatalog.slice(1).filter((source) => {
    if (!query) return true;
    return `${source.label} ${source.fullName}`.toLowerCase().includes(query);
  });
  els.sourcePicker.innerHTML = options.map((source) => `
    <label class="source-option">
      <input type="checkbox" data-source-picker="${source.id}" ${sourcePickerSelection.has(source.id) ? "checked" : ""} />
      <span class="nav-icon" style="background:${source.color}">${source.icon}</span>
      <span class="source-option-copy"><strong>${escapeHtml(source.label)}</strong><small>${escapeHtml(source.fullName)}</small></span>
    </label>
  `).join("");
  els.sourceSelectionSummary.textContent = `已选择 ${sourcePickerSelection.size} 本`;
}

function openSourcesModal() {
  sourcePickerSelection = new Set(state.enabledSources);
  if (els.sourcePickerSearch) els.sourcePickerSearch.value = "";
  renderSourcePicker();
  els.sourcesModal.showModal();
}

async function saveSources() {
  if (!sourcePickerSelection.size) {
    showToast("至少选择一本期刊");
    return;
  }
  state.enabledSources = [...sourcePickerSelection];
  if (state.activeSource !== "all" && !state.enabledSources.includes(state.activeSource)) state.activeSource = "all";
  await saveSettings();
  state.renderLimit = PAGE_SIZE;
  render();
  els.sourcesModal.close();
  refreshPapers(true, false);
}

function renderCounts() {
  const visible = enabledPapers();
  const all = visible.length;
  const unread = visible.filter((paper) => !state.read[paper.id]).length;
  const important = visible.filter((paper) => state.important[paper.id]).length;
  document.querySelectorAll("#allCount, #desktopAllCount").forEach((node) => { node.textContent = all; });
  document.querySelectorAll("#unreadCount, #desktopUnreadCount").forEach((node) => { node.textContent = unread; });
  document.querySelectorAll("#importantCount, #desktopImportantCount").forEach((node) => { node.textContent = important; });
}

function groupIdsForPaper(paperId) {
  return state.groups.filter((group) => state.groupItems[group.id]?.[paperId]).map((group) => group.id);
}

function paperMatchesGroup(paper, groupId) {
  return Boolean(state.groupItems[groupId]?.[paper.id]);
}

function currentPapers() {
  const available = enabledPapers();
  const sourceFiltered = state.activeSource.startsWith("group:")
    ? available.filter((paper) => paperMatchesGroup(paper, state.activeSource.slice(6)))
    : state.activeSource === "all"
      ? available
      : available.filter((paper) => paperSourceId(paper) === state.activeSource);
  return sourceFiltered.filter((paper) => {
    const normalizedQuery = state.query.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return [paper.title, paper.authors, paper.abstract, paper.category, ...paper.tags].join(" ").toLowerCase().includes(normalizedQuery);
  }).filter((paper) => {
    if (state.activeFilter === "unread") return !state.read[paper.id];
    if (state.activeFilter === "important") return Boolean(state.important[paper.id]);
    if (state.activeFilter === "read") return Boolean(state.read[paper.id]);
    return true;
  }).sort(comparePapers);
}

function renderPapers() {
  const papers = currentPapers();
  const rendered = papers.slice(0, state.renderLimit);
  els.paperList.innerHTML = rendered.map(renderPaper).join("");
  window.requestAnimationFrame(updateAbstractToggles);
  els.paperList.hidden = papers.length === 0;
  els.emptyState.hidden = papers.length !== 0;
  els.visibleCount.textContent = papers.length;
  if (els.loadMoreButton) {
    const remaining = Math.max(0, papers.length - rendered.length);
    els.loadMoreButton.hidden = remaining === 0;
    els.loadMoreButton.textContent = remaining ? `显示更多（剩余 ${remaining} 篇）` : "";
  }
  updateFeedTitle();
}

function renderPaper(paper) {
  const isRead = Boolean(state.read[paper.id]);
  const isImportant = Boolean(state.important[paper.id]);
  const sourceClass = paper.source === "nature" ? "nature" : paper.source === "science" ? "science" : paper.source === "ieee" ? "ieee" : "";
  const paperTiming = paper.issueLabel
    ? `${paper.issueLabel}${paper.issueType === "early-access" ? ` · ${paper.date.slice(0, 4)}` : ""}`
    : `${relativeDate(paper.date)} · ${formatDate(paper.date)}`;
  const abstractExpanded = expandedAbstracts.has(paper.id);
  const abstractExcerpt = /(?:\.\.\.|…)$/.test(String(paper.abstract || "").trim());
  return `
    <article class="paper-card ${isRead ? "read" : ""} ${isImportant ? "important" : ""}" data-paper-id="${escapeHtml(paper.id)}">
      <div class="paper-topline">
        <div class="paper-meta">
          <span class="source-chip ${sourceClass}">${escapeHtml(paper.sourceLabel)}</span>
          <span class="meta-separator">·</span>
          ${paper.issueLabel ? "" : `<span>${escapeHtml(paper.category)}</span><span class="meta-separator">·</span>`}
          <span>${escapeHtml(paperTiming)}</span>
        </div>
        <div class="paper-actions-top">
          <button class="star-button ${isImportant ? "active" : ""}" data-action="important" title="${isImportant ? "取消重要" : "标记重要"}" aria-label="${isImportant ? "取消重要" : "标记重要"}">${isImportant ? "★" : "☆"}</button>
          <button class="more-button" data-action="group" title="添加到分组" aria-label="添加到分组">•••</button>
        </div>
      </div>
      <h3 class="paper-title">${escapeHtml(paper.title)}</h3>
      <p class="paper-authors">${escapeHtml(paper.authors)}</p>
      <div class="paper-abstract-wrap">
        <p class="paper-abstract ${abstractExpanded ? "expanded" : ""}">${escapeHtml(paper.abstract)}</p>
        <button class="abstract-toggle" type="button" data-action="abstract" aria-expanded="${abstractExpanded}" ${abstractExpanded || collapsibleAbstracts.has(paper.id) ? "" : "hidden"}>${abstractExpanded ? "收起摘要" : abstractExcerpt ? "展开摘要片段" : "展开摘要"}</button>
        ${abstractExpanded && abstractExcerpt ? `<span class="abstract-source-note">来源只提供摘要片段，请查看原文获取完整内容</span>` : ""}
      </div>
      <div class="paper-footer">
        <div class="paper-tags">${(Array.isArray(paper.tags) ? paper.tags : []).map((tag) => `<span class="paper-tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="paper-actions">
          <button class="text-button" data-action="share">分享链接</button>
          <button class="read-button" data-action="read">${isRead ? "已读" : "标记已读"}</button>
          <a class="open-link" href="${safeUrl(paper.url)}" target="_blank" rel="noreferrer">查看原文 ↗</a>
        </div>
      </div>
    </article>
  `;
}

function updateAbstractToggles() {
  els.paperList.querySelectorAll("[data-paper-id]").forEach((card) => {
    const paperId = card.dataset.paperId;
    const abstract = card.querySelector(".paper-abstract");
    const button = card.querySelector(".abstract-toggle");
    if (!abstract || !button) return;
    if (expandedAbstracts.has(paperId)) {
      button.hidden = false;
      return;
    }
    const truncated = abstract.scrollHeight > abstract.clientHeight + 1;
    if (truncated) collapsibleAbstracts.add(paperId);
    else collapsibleAbstracts.delete(paperId);
    button.hidden = !truncated;
  });
}

function updateFeedTitle() {
  const activeSource = sourceCatalog.find((source) => source.id === state.activeSource);
  if (activeSource) {
    els.feedTitle.textContent = activeSource.label;
    if (activeSource.id === "all") {
      els.sourceStripText.textContent = `${state.enabledSources.length} 本已选期刊 · 其他来源${rangeLabel()} · IEEE ${ieeeScopeLabel()}`;
    } else if (activeSource.id.startsWith("ieee-")) {
      els.sourceStripText.textContent = `${activeSource.fullName || activeSource.label} · ${ieeeScopeLabel()}`;
    } else {
      els.sourceStripText.textContent = `${activeSource.fullName || activeSource.label} · ${rangeLabel()}`;
    }
  } else if (state.activeSource.startsWith("group:")) {
    const group = state.groups.find((item) => item.id === state.activeSource.slice(6));
    els.feedTitle.textContent = group ? group.name : "我的分组";
    els.sourceStripText.textContent = "自定义分组 · 本地收藏";
  }
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.activeFilter);
    button.setAttribute("aria-selected", String(button.dataset.filter === state.activeFilter));
  });
}

function render() {
  renderSources();
  renderCounts();
  renderPapers();
  updateFilterButtons();
}

async function handlePaperAction(event) {
  const actionButton = event.target.closest("[data-action]");
  const card = event.target.closest("[data-paper-id]");
  if (!actionButton || !card) return;
  const paperId = card.dataset.paperId;
  const paper = state.papers.find((item) => item.id === paperId);
  if (!paper) return;
  const action = actionButton.dataset.action;
  if (action === "abstract") {
    const expanded = !expandedAbstracts.has(paperId);
    if (expanded) expandedAbstracts.add(paperId);
    else expandedAbstracts.delete(paperId);
    const abstract = card.querySelector(".paper-abstract");
    abstract?.classList.toggle("expanded", expanded);
    actionButton.setAttribute("aria-expanded", String(expanded));
    actionButton.textContent = expanded ? "收起摘要" : "展开摘要";
    return;
  }
  if (action === "read") {
    state.read[paperId] = !state.read[paperId];
    await store.savePaperState(activeNamespace, paperId, state.read[paperId], state.important[paperId]);
    render();
    showToast(state.read[paperId] ? "已标记为已读" : "已恢复为未读");
    scheduleSync();
  }
  if (action === "important") {
    state.important[paperId] = !state.important[paperId];
    await store.savePaperState(activeNamespace, paperId, state.read[paperId], state.important[paperId]);
    if (state.important[paperId]) await store.saveSnapshot(activeNamespace, paper);
    else if (!groupIdsForPaper(paperId).length) await store.deleteSnapshot(activeNamespace, paperId);
    render();
    showToast(state.important[paperId] ? "已加入重要文献" : "已取消重要标记");
    scheduleSync();
  }
  if (action === "group") openGroupPicker(paper);
  if (action === "share") sharePaper(paper);
}

async function sharePaper(paper) {
  const url = safeUrl(paper.url, false);
  if (!url) {
    showToast("原文链接无效");
    return;
  }
  const shareData = { title: paper.title, text: `${paper.title} · ${paper.sourceLabel}`, url };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(url);
    showToast("原文链接已复制");
  } catch (error) {
    if (error?.name !== "AbortError") showToast("链接复制失败，请直接打开原文");
  }
}

function openGroupPicker(paper) {
  paperForGroup = paper;
  els.modalPaperTitle.textContent = paper.title;
  els.groupPicker.innerHTML = state.groups.length
    ? state.groups.map((group) => {
      const selected = Boolean(state.groupItems[group.id]?.[paper.id]);
      return `<label class="group-option ${selected ? "selected" : ""}"><input type="checkbox" value="${escapeHtml(group.id)}" ${selected ? "checked" : ""} /> <span class="group-dot" style="background:${safeColor(group.color)}"></span> ${escapeHtml(group.name)}</label>`;
    }).join("")
    : `<p class="modal-paper-title">还没有分组，请先创建一个。</p>`;
  els.paperGroupModal.showModal();
}

async function savePaperGroups() {
  if (!paperForGroup) return;
  const selected = new Set([...els.groupPicker.querySelectorAll("input:checked")].map((input) => input.value));
  const changes = [];
  state.groups.forEach((group) => {
    state.groupItems[group.id] ||= {};
    const wasSelected = Boolean(state.groupItems[group.id][paperForGroup.id]);
    const isSelected = selected.has(group.id);
    if (isSelected) state.groupItems[group.id][paperForGroup.id] = true;
    else delete state.groupItems[group.id][paperForGroup.id];
    if (wasSelected !== isSelected) changes.push(store.saveMembership(activeNamespace, group.id, paperForGroup.id, isSelected));
  });
  await Promise.all(changes);
  if (selected.size) await store.saveSnapshot(activeNamespace, paperForGroup);
  else if (!state.important[paperForGroup.id]) await store.deleteSnapshot(activeNamespace, paperForGroup.id);
  render();
  els.paperGroupModal.close();
  showToast("分组已更新");
  scheduleSync();
}

async function createGroup() {
  const name = els.groupName.value.trim();
  if (!name) return;
  const uniqueId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const group = { id: `group-${uniqueId}`, name, color: selectedColor };
  state.groups.push(group);
  state.groupItems[group.id] = {};
  await store.saveCollection(activeNamespace, group);
  render();
  els.groupForm.reset();
  els.groupModal.close();
  showToast(`已创建「${name}」`);
  scheduleSync();
}

async function deleteGroup(groupId) {
  const group = state.groups.find((item) => item.id === groupId);
  if (!group) return;
  if (!window.confirm(`确定删除分组“${group.name}”吗？其中的论文不会被删除。`)) return;
  const deletedAt = new Date().toISOString();
  const paperIds = Object.keys(state.groupItems[groupId] || {});
  await Promise.all([
    store.saveCollection(activeNamespace, { ...group, updatedAt: deletedAt, deletedAt }),
    ...paperIds.map((paperId) => store.saveMembership(activeNamespace, groupId, paperId, false, true, deletedAt)),
  ]);
  state.groups = state.groups.filter((item) => item.id !== groupId);
  delete state.groupItems[groupId];
  if (state.activeSource === `group:${groupId}`) state.activeSource = "all";
  await Promise.all(paperIds.filter((paperId) => !state.important[paperId] && !groupIdsForPaper(paperId).length).map((paperId) => store.deleteSnapshot(activeNamespace, paperId)));
  render();
  showToast(`已删除「${group.name}」`);
  scheduleSync();
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? value : "#0f766e";
}

function safeUrl(value, escaped = true) {
  try {
    const url = new URL(String(value));
    if (!["http:", "https:"].includes(url.protocol)) return escaped ? "#" : "";
    return escaped ? escapeHtml(url.href) : url.href;
  } catch {
    return escaped ? "#" : "";
  }
}

function formatUpdateMoment(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知时间";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

async function fetchStaticPapers(force) {
  const suffix = force ? `?refresh=${Date.now()}` : "";
  const catalogResponse = await fetch(`./data/catalog.json${suffix}`, { cache: "no-store" });
  if (!catalogResponse.ok) throw new Error(`静态数据目录返回 ${catalogResponse.status}`);
  const catalog = await catalogResponse.json();
  const catalogStatuses = new Map((catalog.sources || []).map((source) => [source.id, source]));
  const versionToken = encodeURIComponent(catalog.fetchedAt || catalog.generatedAt || Date.now());
  const loadSource = async (sourceId) => {
    const source = sourceCatalog.find((item) => item.id === sourceId);
    try {
      let response;
      let lastError;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          response = await fetch(`./data/sources/${encodeURIComponent(sourceId)}.json?v=${versionToken}`, { cache: "no-store" });
          if (response.ok) break;
          lastError = new Error(`HTTP ${response.status}`);
        } catch (error) { lastError = error; }
        await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
      }
      if (!response?.ok) throw lastError || new Error("请求失败");
      const payload = await response.json();
      if (!Array.isArray(payload.papers)) throw new Error("数据格式无效");
      return { sourceId, papers: payload.papers, status: payload.status || catalogStatuses.get(sourceId) || {} };
    } catch (error) {
      return {
        sourceId, papers: [],
        status: { error: `${source?.label || sourceId}: ${error.message}`, limited: true },
      };
    }
  };
  const results = [];
  const queue = [...state.enabledSources];
  const worker = async () => { while (queue.length) results.push(await loadSource(queue.shift())); };
  await Promise.all([worker(), worker(), worker()]);
  const unique = new Map();
  results.flatMap((result) => result.papers).forEach((paper) => unique.set(paper.id, paper));
  const errors = results.filter((result) => result.status.error).map((result) => ({
    id: result.sourceId,
    label: sourceCatalog.find((source) => source.id === result.sourceId)?.label || result.sourceId,
    error: result.status.error,
  }));
  const coverageDates = [...unique.values()]
    .filter((paper) => !isIeeePaper(paper) && paper.date && paper.date !== "1970-01-01")
    .map((paper) => paper.date);
  return {
    papers: [...unique.values()],
    errors,
    fetchedAt: catalog.fetchedAt || catalog.generatedAt,
    coverageFrom: coverageDates.length ? coverageDates.sort()[0] : "",
    coverageLimited: results.some((result) => result.status.limited),
    requestedSources: [...state.enabledSources],
    static: true,
    cached: false,
    stale: false,
  };
}

async function refreshPapers(force = true, quiet = false) {
  let completedLabel = "刚刚更新";
  const button = document.querySelector("#refreshButton");
  if (button) {
    button.disabled = true;
    button.classList.add("spinning");
  }
  els.lastUpdated.textContent = force ? "正在刷新" : "正在加载";
  const sourceQuery = encodeURIComponent(state.enabledSources.join(","));
  const ieeeScopeQuery = encodeURIComponent(state.ieeeScope);
  const query = `sources=${sourceQuery}&days=${state.rangeDays}&ieee=${ieeeScopeQuery}${force ? "&refresh=1" : ""}`;
  const endpoint = window.location.protocol === "file:"
    ? `http://127.0.0.1:8765/api/papers?${query}`
    : `/api/papers?${query}`;
  try {
    let payload;
    if (usesStaticData()) {
      payload = await fetchStaticPapers(force);
    } else {
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`数据服务返回 ${response.status}`);
      payload = await response.json();
    }
    if (!Array.isArray(payload.papers)) throw new Error("论文数据格式无效");
    state.dataMode = payload.static ? "static" : "local";
    state.dataUpdatedAt = payload.fetchedAt || "";
    if (state.dataUpdatedAt) completedLabel = `数据更新于 ${formatUpdateMoment(state.dataUpdatedAt)}`;
    feedPapers = payload.papers;
    await loadWorkspace(activeNamespace, false);
    state.renderLimit = PAGE_SIZE;
    const errorCount = Array.isArray(payload.errors) ? payload.errors.length : 0;
    const status = payload.static ? "GitHub 定时数据" : payload.cached ? (payload.stale ? "离线缓存" : "本地缓存") : "实时数据";
    const hasDatedSource = state.enabledSources.some((sourceId) => !sourceId.startsWith("ieee-"));
    const coverage = hasDatedSource
      ? (payload.coverageFrom ? `其他来源最早 ${payload.coverageFrom}` : "其他来源暂无论文")
      : ieeeScopeLabel();
    const coverageState = payload.coverageLimited ? "部分来源范围有限" : "已覆盖所选范围";
    els.sourceStripMeta.textContent = `${status} · ${coverage} · ${coverageState}`;
    updateConnectionState();
    render();
    store.savePaperCache(feedPapers).catch(() => {});
    if (!quiet) {
      if (!payload.papers.length && !errorCount) showToast("所选范围内暂无论文");
      else if (errorCount) showToast(`已更新 ${payload.papers.length} 篇，${errorCount} 个来源暂不可用`);
      else if (payload.coverageLimited) showToast(`已更新 ${payload.papers.length} 篇；部分来源公开订阅范围有限`);
      else showToast(payload.static ? `已载入 ${payload.papers.length} 篇 GitHub 最新数据` : `已更新 ${payload.papers.length} 篇真实论文`);
    }
  } catch (error) {
    const message = window.location.protocol === "file:"
      ? "实时数据需要双击 Start-Paperlane.bat 打开"
      : usesStaticData() ? "GitHub 数据暂不可用，已保留本地缓存" : "数据服务暂时不可用，已保留本地缓存";
    completedLabel = "正在使用离线缓存";
    els.sourceStripMeta.textContent = message;
    els.connectionState.innerHTML = `<span class="status-dot" style="background:var(--orange);box-shadow:0 0 0 4px var(--orange-soft)"></span>本地缓存`;
    if (!quiet) showToast(message);
  } finally {
    if (button) {
      button.disabled = false;
      button.classList.remove("spinning");
    }
    els.lastUpdated.textContent = completedLabel;
  }
}

function updateConnectionState() {
  const online = navigator.onLine;
  els.connectionState.innerHTML = `<span class="status-dot" style="background:${online ? "var(--teal)" : "var(--orange)"};box-shadow:0 0 0 4px ${online ? "var(--teal-soft)" : "var(--orange-soft)"}"></span>${online ? "已连接" : "离线模式"}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "占用少于 1 MB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isAppInstalled() {
  const installedModes = ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"];
  return installedModes.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches) || Boolean(window.navigator.standalone);
}

function updateInstallUi() {
  const installed = isAppInstalled();
  els.appVersion.textContent = `v${state.appVersion}`;
  els.accountInstallButton.textContent = installed
    ? "已安装到设备"
    : deferredInstallPrompt ? "安装 Paperlane" : "查看安装方法";
  els.accountInstallButton.disabled = installed;
  const sidebarButton = document.querySelector("#installButton");
  if (sidebarButton) sidebarButton.hidden = installed || !deferredInstallPrompt;
}

function cloudConfigurationMessage() {
  if (cloud.configured) return "登录后自动同步已读、重要、分组和期刊设置。";
  if (state.dataMode === "static" && /尚未填写|尚未/i.test(cloud.configurationIssue)) {
    return "线上未注入 Supabase 配置：请设置 GitHub Actions Variables 中的 SUPABASE_URL 和 SUPABASE_PUBLISHABLE_KEY，然后重新运行 Pages workflow。";
  }
  return `云同步不可用：${cloud.configurationIssue}。本地功能不受影响。`;
}

async function updateAccountUi() {
  const loggedIn = Boolean(cloud.user);
  const pending = await store.getOutbox(activeNamespace);
  const lastSync = await store.getMeta(`lastSync:${activeNamespace}`);
  els.accountSignedOut.hidden = loggedIn;
  els.accountSignedIn.hidden = !loggedIn;
  els.accountMode.textContent = loggedIn ? "账号同步模式" : "本地模式";
  els.accountDetail.textContent = loggedIn ? "本机优先，联网后自动同步" : "数据仅保存在当前设备";
  document.querySelector(".account-status")?.classList.toggle("synced", loggedIn);
  document.querySelector("#accountStatusIcon").textContent = loggedIn ? "S" : "L";
  els.profileButton.textContent = loggedIn ? (cloud.user.email || "S").slice(0, 1).toUpperCase() : "L";
  els.profileButton.title = loggedIn ? `已登录 ${cloud.user.email || "账号"}` : "本地模式 · 账号与同步";
  document.querySelector("#sidebarSyncTitle").textContent = loggedIn ? "已开启同步" : "本地模式";
  document.querySelector("#sidebarSyncDetail").textContent = loggedIn ? (pending.length ? `${pending.length} 项等待同步` : "多设备记录已连接") : "标记保存在此设备";

  if (loggedIn) {
    els.accountUserEmail.textContent = cloud.user.email || cloud.user.id;
    els.syncStatusText.textContent = lastSyncError
      ? `同步失败：${lastSyncError}`
      : pending.length
      ? `${pending.length} 项等待同步`
      : lastSync ? `上次 ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(lastSync))}` : "尚未同步";
  } else {
    const inputs = els.accountForm.querySelectorAll("input, button");
    inputs.forEach((element) => { element.disabled = !cloud.configured; });
    const note = document.querySelector("#cloudConfigNote");
    note.textContent = cloudConfigurationMessage();
    note.classList.toggle("warning", !cloud.configured);
  }

  if (navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      els.storageUsage.textContent = `浏览器数据约 ${formatBytes(estimate.usage)}`;
    } catch {
      els.storageUsage.textContent = "本地存储可用";
    }
  } else {
    els.storageUsage.textContent = "本地存储可用";
  }
  updateInstallUi();
}

async function loadVersionInfo() {
  try {
    const response = await fetch(`./version.json?check=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const version = await response.json();
    if (version.version) state.appVersion = String(version.version);
    if (els.appVersion) els.appVersion.textContent = `v${state.appVersion}`;
  } catch {
    // Offline startup keeps the bundled version label.
  }
}

function offerAppUpdate(worker) {
  pendingServiceWorker = worker;
  els.updateBanner.hidden = false;
}

async function setupServiceWorker() {
  if (serviceWorkerSetupPromise) return serviceWorkerSetupPromise;
  serviceWorkerSetupPromise = (async () => {
    if (!("serviceWorker" in navigator) || window.location.protocol === "file:") return;
    serviceWorkerRegistration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
    if (serviceWorkerRegistration.waiting && navigator.serviceWorker.controller) {
      offerAppUpdate(serviceWorkerRegistration.waiting);
    }
    serviceWorkerRegistration.addEventListener("updatefound", () => {
      const worker = serviceWorkerRegistration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) offerAppUpdate(worker);
      });
    });
    let reloading = false;
    let controllerSeen = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!controllerSeen) {
        controllerSeen = true;
        return;
      }
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
    window.setInterval(() => serviceWorkerRegistration.update().catch(() => {}), 60 * 60 * 1000);
  })();
  return serviceWorkerSetupPromise;
}

async function openAccountModal() {
  await updateAccountUi();
  els.accountModal.showModal();
}

async function syncAccount(quiet = false) {
  if (!cloud.user || !navigator.onLine) {
    if (!quiet) showToast(navigator.onLine ? "请先登录账号" : "当前离线，操作会在联网后同步");
    return false;
  }
  els.syncStatusText.textContent = "正在同步";
  try {
    await cloud.sync(activeNamespace);
    lastSyncError = "";
    await loadWorkspace(activeNamespace, false);
    render();
    await updateAccountUi();
    if (!quiet) showToast("同步完成");
    return true;
  } catch (error) {
    lastSyncError = error.message;
    els.syncStatusText.textContent = `同步失败：${error.message}`;
    if (!quiet) showToast(`同步暂不可用：${error.message}`);
    return false;
  }
}

async function activateUser(user, importGuest = true) {
  activeNamespace = `user:${user.id}`;
  const importKey = `guestImported:${user.id}`;
  if (importGuest && !await store.getMeta(importKey)) {
    await store.importNamespace("guest", activeNamespace);
    await store.setMeta(importKey, new Date().toISOString());
  }
  await loadWorkspace(activeNamespace, false);
  render();
  if (navigator.onLine) await syncAccount(true);
  await updateAccountUi();
}

async function signIn(event) {
  event.preventDefault();
  const email = els.accountEmail.value.trim();
  const password = els.accountPassword.value;
  try {
    const user = await cloud.signIn(email, password);
    await activateUser(user, true);
    els.accountPassword.value = "";
    showToast("已登录并启用同步");
  } catch (error) {
    showToast(`登录失败：${error.message}`);
  }
}

async function signUp() {
  if (!els.accountForm.reportValidity()) return;
  const email = els.accountEmail.value.trim();
  const password = els.accountPassword.value;
  try {
    const result = await cloud.signUp(email, password);
    if (result.signedIn) {
      await activateUser(result.user, true);
      els.accountPassword.value = "";
      showToast("账号已创建，同步已开启");
    } else {
      showToast("注册成功，请先在邮箱中确认账号");
    }
  } catch (error) {
    showToast(`注册失败：${error.message}`);
  }
}

async function signOut() {
  const accountNamespace = activeNamespace;
  if (navigator.onLine) await syncAccount(true);
  const pending = await store.getOutbox(accountNamespace);
  if (pending.length && !window.confirm(`还有 ${pending.length} 项未同步。现在退出会清除这些本机待同步记录，仍要退出吗？`)) return;
  await cloud.signOut();
  await store.clearNamespace(accountNamespace);
  activeNamespace = "guest";
  await loadWorkspace(activeNamespace, true);
  render();
  await updateAccountUi();
  showToast("已退出，当前为本地模式");
}

async function exportLocalData() {
  const payload = await store.exportNamespace(activeNamespace);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `paperlane-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("本地记录已导出");
}

async function clearDeviceData() {
  const message = cloud.user
    ? "将清除此账号在当前设备的同步缓存并退出登录；云端和其他设备的数据不会删除。"
    : "将清除此设备的已读、重要、分组和期刊设置；论文离线缓存会保留。";
  if (!window.confirm(message)) return;
  const namespace = activeNamespace;
  if (cloud.user) await cloud.signOut();
  await store.clearNamespace(namespace);
  activeNamespace = "guest";
  await loadWorkspace(activeNamespace, true);
  render();
  await updateAccountUi();
  showToast("当前设备记录已清除");
}

async function promptNativeInstall() {
  if (!deferredInstallPrompt) return false;
  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice?.outcome === "accepted") showToast("正在安装 Paperlane");
  } catch {
    showToast("浏览器未能打开安装窗口，请查看安装方法");
    updateInstallUi();
    return false;
  }
  updateInstallUi();
  return true;
}

function showInstallGuide() {
  const userAgent = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const iosAlternateBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
  const android = /Android/i.test(userAgent);
  const inAppBrowser = /MicroMessenger|QQ\/|Weibo|FBAN|FBAV|Instagram/i.test(userAgent);
  let title = "安装到当前设备";
  let intro = "当前浏览器没有提供可由网页直接调用的安装窗口。";
  let steps = ["打开浏览器主菜单。", "选择“安装应用”“添加到主屏幕”或“创建快捷方式”。"];
  let note = "不同浏览器的菜单名称可能略有不同。安装后，Paperlane 会以独立窗口启动。";

  if (isAppInstalled()) {
    title = "Paperlane 已安装";
    intro = "当前页面已经在独立应用模式中运行，无需再次安装。";
    steps = [];
    note = "可以从设备主屏幕或应用列表再次打开 Paperlane。";
  } else if (ios) {
    title = "添加到 iPhone / iPad 主屏幕";
    intro = iosAlternateBrowser ? "iOS 上请改用 Safari 完成安装。" : "Safari 通过“添加到主屏幕”安装网页应用。";
    steps = iosAlternateBrowser
      ? ["复制当前网址并使用 Safari 打开。", "点击 Safari 工具栏中的分享按钮。", "向下滑动并选择“添加到主屏幕”，然后确认。"]
      : ["点击 Safari 工具栏中的分享按钮。", "向下滑动并选择“添加到主屏幕”。", "点击右上角“添加”确认。"];
    note = "iPhone 和 iPad 不会触发网页内的原生安装弹窗，这是系统浏览器的限制。";
  } else if (inAppBrowser) {
    title = "请先用系统浏览器打开";
    intro = "微信、QQ 等应用内浏览器通常不开放 PWA 安装功能。";
    steps = ["点击右上角菜单并选择“在浏览器打开”。", "使用手机自带浏览器或其他支持网页应用的浏览器继续打开。", "回到 Paperlane 后再次点击安装。"];
    note = "切换到支持 PWA 的浏览器后，安装按钮会在浏览器准备就绪时直接打开安装窗口。";
  } else if (android) {
    title = "安装到 Android";
    intro = "浏览器尚未提供原生安装窗口，可以先从浏览器菜单安装。";
    steps = ["确认当前页面使用 HTTPS 打开。", "打开浏览器右上角主菜单。", "选择“安装应用”或“添加到主屏幕”。"];
    note = "部分浏览器需要先在页面停留片刻并进行一次点击；如果网页没有直接弹窗，请使用浏览器菜单中的安装或添加到主屏幕。";
  }

  els.installGuideTitle.textContent = title;
  els.installGuideIntro.textContent = intro;
  els.installGuideSteps.innerHTML = steps.map((step) => `<li>${step}</li>`).join("");
  els.installGuideSteps.hidden = steps.length === 0;
  els.installGuideNote.textContent = note;
  els.retryInstallButton.hidden = isAppInstalled();
  if (!els.installModal.open) els.installModal.showModal();
}

async function installApp() {
  if (isAppInstalled()) {
    updateInstallUi();
    showToast("Paperlane 已安装到当前设备");
    return;
  }
  if (await promptNativeInstall()) return;
  await setupServiceWorker().catch(() => {});
  showInstallGuide();
}

document.addEventListener("click", async (event) => {
  const deleteGroupButton = event.target.closest("[data-group-delete]");
  if (deleteGroupButton) {
    event.preventDefault();
    event.stopPropagation();
    await deleteGroup(deleteGroupButton.dataset.groupDelete);
    return;
  }
  const sourceButton = event.target.closest("[data-source]");
  if (sourceButton) {
    state.activeSource = sourceButton.dataset.source;
    state.renderLimit = PAGE_SIZE;
    render();
    return;
  }
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    state.activeFilter = filterButton.dataset.filter;
    state.renderLimit = PAGE_SIZE;
    render();
  }
});

els.paperList.addEventListener("click", (event) => handlePaperAction(event).catch(() => showToast("本地记录保存失败")));
els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  state.renderLimit = PAGE_SIZE;
  renderPapers();
});
document.querySelector("#refreshButton").addEventListener("click", () => refreshPapers(true, false));
els.timeRangeSelect.addEventListener("change", async () => {
  state.rangeDays = Number(els.timeRangeSelect.value);
  await saveSettings();
  state.renderLimit = PAGE_SIZE;
  render();
  showToast(`已设为${rangeLabel()}，请点击刷新`);
});
els.ieeeScopeSelect.addEventListener("change", async () => {
  state.ieeeScope = els.ieeeScopeSelect.value;
  await saveSettings();
  state.renderLimit = PAGE_SIZE;
  render();
  showToast(`IEEE 已设为${ieeeScopeLabel()}，请点击刷新`);
});
els.manageSourcesButton.addEventListener("click", openSourcesModal);
els.sourcePickerSearch.addEventListener("input", renderSourcePicker);
els.sourcePicker.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-source-picker]");
  if (!checkbox) return;
  if (checkbox.checked) sourcePickerSelection.add(checkbox.dataset.sourcePicker);
  else sourcePickerSelection.delete(checkbox.dataset.sourcePicker);
  els.sourceSelectionSummary.textContent = `已选择 ${sourcePickerSelection.size} 本`;
});
document.querySelector("#selectAllSourcesButton").addEventListener("click", () => {
  sourceCatalog.slice(1).forEach((source) => sourcePickerSelection.add(source.id));
  renderSourcePicker();
});
document.querySelector("#clearSourcesButton").addEventListener("click", () => {
  sourcePickerSelection.clear();
  renderSourcePicker();
});
els.sourcesForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (event.submitter?.value === "cancel") {
    els.sourcesModal.close();
    return;
  }
  await saveSources();
});
document.querySelector("#newGroupButton").addEventListener("click", () => { els.groupModal.showModal(); setTimeout(() => els.groupName.focus(), 50); });
document.querySelector("#installButton").addEventListener("click", installApp);
els.accountInstallButton.addEventListener("click", installApp);
document.querySelector("#closeInstallModalButton").addEventListener("click", () => els.installModal.close());
document.querySelector("#dismissInstallGuideButton").addEventListener("click", () => els.installModal.close());
els.retryInstallButton.addEventListener("click", async () => {
  els.retryInstallButton.disabled = true;
  if (await promptNativeInstall()) {
    els.retryInstallButton.disabled = false;
    els.installModal.close();
    return;
  }
  await setupServiceWorker().catch(() => {});
  els.retryInstallButton.disabled = false;
  showInstallGuide();
});
els.groupForm.addEventListener("submit", async (event) => { event.preventDefault(); await createGroup(); });
els.paperGroupForm.addEventListener("submit", async (event) => { event.preventDefault(); await savePaperGroups(); });
els.loadMoreButton.addEventListener("click", () => {
  state.renderLimit += PAGE_SIZE;
  renderPapers();
});
els.profileButton.addEventListener("click", openAccountModal);
els.syncCard.addEventListener("click", openAccountModal);
document.querySelector("[data-close-account]").addEventListener("click", () => els.accountModal.close());
els.accountForm.addEventListener("submit", signIn);
els.signUpButton.addEventListener("click", signUp);
els.signOutButton.addEventListener("click", signOut);
els.syncNowButton.addEventListener("click", () => syncAccount(false));
els.exportButton.addEventListener("click", exportLocalData);
els.clearDeviceButton.addEventListener("click", clearDeviceData);
els.applyUpdateButton.addEventListener("click", () => {
  if (pendingServiceWorker) pendingServiceWorker.postMessage({ type: "SKIP_WAITING" });
});
els.dismissUpdateButton.addEventListener("click", () => {
  els.updateBanner.hidden = true;
});
document.querySelectorAll(".color-option").forEach((button) => button.addEventListener("click", () => {
  selectedColor = button.dataset.color;
  document.querySelectorAll(".color-option").forEach((option) => option.classList.toggle("selected", option === button));
}));
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== els.searchInput) {
    event.preventDefault();
    els.searchInput.focus();
  }
});
window.addEventListener("online", () => {
  updateConnectionState();
  syncAccount(true);
});
window.addEventListener("offline", updateConnectionState);
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallUi();
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  if (els.installModal.open) els.installModal.close();
  updateInstallUi();
  showToast("Paperlane 已安装完成");
});
window.addEventListener("resize", () => {
  window.clearTimeout(abstractResizeTimer);
  abstractResizeTimer = window.setTimeout(updateAbstractToggles, 120);
});

// Register early: installability checks should not wait for paper data or cloud startup.
const serviceWorkerStartup = setupServiceWorker().catch(() => null);

async function initializeApp() {
  const storageReady = await store.open();
  if (storageReady) {
    await store.migrateLegacy(defaultGroups);
    const cachedPapers = await store.loadPaperCache();
    if (cachedPapers) feedPapers = cachedPapers;
    else if (usesStaticData()) feedPapers = [];
  }
  const restoredUser = storageReady ? await cloud.init() : null;
  activeNamespace = restoredUser ? `user:${restoredUser.id}` : "guest";
  await loadWorkspace(activeNamespace, !restoredUser);
  updateTodayBreadcrumb();
  updateConnectionState();
  render();
  await loadVersionInfo();
  await updateAccountUi();
  if (!storageReady) showToast("浏览器未开放本地数据库，本次记录仅临时保存");
  if (restoredUser && navigator.onLine) await syncAccount(true);
  await serviceWorkerStartup;
  if (window.location.protocol !== "file:") refreshPapers(false, true);
}

initializeApp().catch((error) => {
  updateTodayBreadcrumb();
  updateConnectionState();
  render();
  showToast(`启动时部分本地数据未载入：${error.message}`);
});
