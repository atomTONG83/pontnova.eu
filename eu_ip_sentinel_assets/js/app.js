/**
 * app.js — Pontnova Europe IP Intelligence前端逻辑
 * 中文主界面（保留英文字段作后续扩展）
 */

'use strict';

// ──────────────────────────────────────────────
// Config & State
// ──────────────────────────────────────────────

const API = '/api';
const STATIC_MODE = true;
const STATIC_DATA_ROOT = 'eu_ip_sentinel_assets/data';
const STATIC_SNAPSHOT_URL = `${STATIC_DATA_ROOT}/snapshot.index.json`;
const LEGACY_STATIC_SNAPSHOT_URL = `${STATIC_DATA_ROOT}/snapshot.json`;
const STATIC_DEFAULT_FILES = {
  news_index: 'news.index.json',
  news_lane_files: {
    core: 'news.core.json',
    watch: 'news.watch.json',
    calendar: 'news.calendar.json',
    pending: 'news.pending.json',
  },
  topic_details_dir: 'topic-details',
};
const DEFAULT_LANG = 'zh';
const THEME_VALUES = ['light', 'dark'];
const SCOPE_VALUES = ['eu', 'intl', 'uk', 'de', 'fr', 'benelux', 'scandinavia', 'all'];
const EDITORIAL_LANE_VALUES = ['all', 'core', 'watch', 'calendar'];
const getInitialTheme = () => 'dark';
const getInitialScope = () => {
  const stored = localStorage.getItem('pontnova_scope');
  return SCOPE_VALUES.includes(stored) ? stored : 'eu';
};
const getDefaultEditorialLaneSelection = () => 'all';
const getInitialEditorialLane = () => {
  const stored = localStorage.getItem('pontnova_editorial_lane');
  return EDITORIAL_LANE_VALUES.includes(stored) ? stored : getDefaultEditorialLaneSelection();
};

function releaseDefaultEditorialLaneForFocusedNews() {
  if (state.filters.editorial_lane === getDefaultEditorialLaneSelection()) {
    state.filters.editorial_lane = 'all';
  }
}

function shouldReleaseDefaultEditorialLane(filter, value) {
  if (state.filters.editorial_lane !== getDefaultEditorialLaneSelection()) return false;
  if (filter === 'ip_type') return Boolean(value) && value !== 'all';
  if (filter === 'category') return Boolean(value) && value !== 'all';
  if (filter === 'scope') return Boolean(value) && value !== 'eu';
  if (filter === 'has_ai') return !state.filters.has_ai;
  return false;
}

const state = {
  lang: DEFAULT_LANG,
  theme: getInitialTheme(),
  currentPage: 'news',
  focusViewExpanded: false,
  pendingTopicScrollId: '',
  filters: {
    ip_type: 'all',
    editorial_lane: getInitialEditorialLane(),
    category: 'all',
    source: '',
    q: '',
    date_from: '',
    has_ai: false,
    scope: getInitialScope(),
  },
  pagination: { page: 1, limit: 20, total: 0, pages: 1 },
  stats: null,
  intelOverview: null,
  dailyReport: null,
  weeklyReport: null,
  dailyAudioBrief: null,
  dailyAudioHistory: [],
  topicBriefs: [],
  currentTopicId: '',
  currentTopicBrief: null,
  currentTopicItems: [],
  sources: [],
  scraping: false,
  searchDebounceTimer: null,
  lastStatsToken: '',
};

const EUROPE_HEAT_POINTS = [
  { id: 'ie', x: 182, y: 195, lx: 144, ly: 176, anchor: 'end' },
  { id: 'uk', x: 202, y: 180, lx: 174, ly: 146, anchor: 'end' },
  { id: 'pt', x: 185, y: 287, lx: 150, ly: 322, anchor: 'end' },
  { id: 'es', x: 207, y: 283, lx: 198, ly: 320, anchor: 'end' },
  { id: 'fr', x: 231, y: 247, lx: 188, ly: 272, anchor: 'end' },
  { id: 'benelux', x: 246, y: 214, lx: 225, ly: 184, anchor: 'end' },
  { id: 'de', x: 268, y: 205, lx: 314, ly: 184, anchor: 'start' },
  { id: 'ch', x: 260, y: 243, lx: 240, ly: 272, anchor: 'end' },
  { id: 'it', x: 277, y: 274, lx: 252, ly: 323, anchor: 'end' },
  { id: 'dk', x: 269, y: 177, lx: 288, ly: 150, anchor: 'start' },
  { id: 'scandinavia', x: 304, y: 104, lx: 356, ly: 72, anchor: 'start' },
  { id: 'pl', x: 308, y: 207, lx: 356, ly: 200, anchor: 'start' },
  { id: 'sk', x: 310, y: 230, lx: 342, ly: 233, anchor: 'start' },
  { id: 'hu', x: 310, y: 240, lx: 350, ly: 254, anchor: 'start' },
  { id: 'si', x: 289, y: 248, lx: 315, ly: 278, anchor: 'start' },
  { id: 'bg', x: 337, y: 268, lx: 380, ly: 277, anchor: 'start' },
  { id: 'gr', x: 330, y: 296, lx: 374, ly: 326, anchor: 'start' },
  { id: 'mt', x: 286, y: 309, lx: 260, ly: 338, anchor: 'end' },
  { id: 'cy', x: 373, y: 314, lx: 414, ly: 336, anchor: 'start' },
  { id: 'lt', x: 330, y: 182, lx: 372, ly: 168, anchor: 'start' },
  { id: 'al', x: 313, y: 279, lx: 347, ly: 302, anchor: 'start' },
];

const EUROPE_HEAT_MAP_ASSET = 'eu_ip_sentinel_assets/assets/europe-heat-base.svg';
const EUROPE_HEAT_SHAPE_GROUPS = {
  uk: ['gb'],
  benelux: ['be', 'nl', 'lu'],
  scandinavia: ['is', 'no', 'se', 'fi', 'dk'],
};
const EUROPE_HEAT_TARGET_MATCHES = {
  uk: ['uk'],
  gb: ['uk'],
  benelux: ['benelux', 'be', 'nl', 'lu'],
  be: ['be', 'benelux'],
  nl: ['nl', 'benelux'],
  lu: ['lu', 'benelux'],
  scandinavia: ['scandinavia', 'is', 'no', 'se', 'fi', 'dk'],
  is: ['is', 'scandinavia'],
  no: ['no', 'scandinavia'],
  se: ['se', 'scandinavia'],
  fi: ['fi', 'scandinavia'],
  dk: ['dk', 'scandinavia'],
};
const EUROPE_HEAT_GEO_LABELS = [
  { id: 'ie', x: 170, y: 190, priority: 'essential' },
  { id: 'uk', x: 203, y: 169, priority: 'essential' },
  { id: 'es', x: 215, y: 294, priority: 'essential' },
  { id: 'fr', x: 231, y: 249, priority: 'support' },
  { id: 'de', x: 270, y: 206, priority: 'support' },
  { id: 'it', x: 281, y: 286, priority: 'essential' },
];
const EUROPE_HEAT_EU_MEMBER_CODES = new Set([
  'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu',
  'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se',
]);
const EUROPE_HEAT_EPC_MEMBER_CODES = new Set([
  'al', 'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu',
  'is', 'ie', 'it', 'lv', 'li', 'lt', 'lu', 'mt', 'mc', 'me', 'mk', 'nl', 'no', 'pl',
  'pt', 'ro', 'sm', 'rs', 'sk', 'si', 'es', 'se', 'ch', 'tr', 'uk',
]);
const EUROPE_HEAT_UPC_MEMBER_CODES = new Set([
  'at', 'be', 'bg', 'dk', 'ee', 'fi', 'fr', 'de', 'it', 'lv', 'lt', 'lu', 'mt', 'nl',
  'pt', 'ro', 'si', 'se',
]);

let europeHeatBaseMapPromise = null;
let regionDisplayNamesZh = null;
let regionDisplayNamesEn = null;

localStorage.setItem('pontnova_lang', DEFAULT_LANG);

let staticSnapshotPromise = null;
let staticNewsIndexPromise = null;
let staticNewsIndexUrl = '';
const staticNewsLanePromises = new Map();
const staticTopicDetailPromises = new Map();

function cloneData(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeEditorialLaneValue(lane = '') {
  const normalized = String(lane || '').trim().toLowerCase();
  return ['core', 'watch', 'calendar', 'pending'].includes(normalized) ? normalized : '';
}

function resolveStaticFileUrl(path = '') {
  const rawPath = String(path || '');
  if (!rawPath) return STATIC_DATA_ROOT;
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  const normalized = rawPath.replace(/^\/+/, '');
  if (normalized.startsWith(STATIC_DATA_ROOT)) return normalized;
  return `${STATIC_DATA_ROOT}/${normalized}`;
}

async function fetchStaticJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Static snapshot error: ${res.status} ${res.statusText}`);
  return res.json();
}

function decorateStaticSnapshot(snapshot) {
  const staticFiles = snapshot?.static_files || {};
  return {
    ...snapshot,
    _staticFiles: {
      news_index: resolveStaticFileUrl(staticFiles.news_index || STATIC_DEFAULT_FILES.news_index),
      news_lane_files: Object.fromEntries(
        Object.entries({ ...STATIC_DEFAULT_FILES.news_lane_files, ...(staticFiles.news_lane_files || {}) })
          .map(([lane, path]) => [lane, resolveStaticFileUrl(path)])
      ),
      topic_details_dir: resolveStaticFileUrl(staticFiles.topic_details_dir || STATIC_DEFAULT_FILES.topic_details_dir),
      topic_detail_files: staticFiles.topic_detail_files || {},
    },
  };
}

async function loadStaticSnapshot() {
  if (!staticSnapshotPromise) {
    staticSnapshotPromise = (async () => {
      try {
        return decorateStaticSnapshot(await fetchStaticJson(STATIC_SNAPSHOT_URL));
      } catch {
        return decorateStaticSnapshot(await fetchStaticJson(LEGACY_STATIC_SNAPSHOT_URL));
      }
    })();
  }
  return staticSnapshotPromise;
}

async function loadStaticNewsLane(snapshot, lane) {
  const normalizedLane = normalizeEditorialLaneValue(lane);
  if (!normalizedLane) return [];
  const laneUrl = snapshot?._staticFiles?.news_lane_files?.[normalizedLane];
  if (!laneUrl) return [];
  if (!staticNewsLanePromises.has(laneUrl)) {
    staticNewsLanePromises.set(laneUrl, fetchStaticJson(laneUrl).then((payload) => payload?.items || []));
  }
  return staticNewsLanePromises.get(laneUrl);
}

async function loadStaticNewsIndex(snapshot, lane = '') {
  const normalizedLane = normalizeEditorialLaneValue(lane);
  if (Array.isArray(snapshot?.news_items)) {
    return normalizedLane
      ? snapshot.news_items.filter((item) => getEditorialLane(item) === normalizedLane)
      : snapshot.news_items;
  }
  if (normalizedLane) {
    try {
      return await loadStaticNewsLane(snapshot, normalizedLane);
    } catch (error) {
      console.warn('Lane shard fallback to full news index', normalizedLane, error);
    }
  }
  const newsUrl = snapshot?._staticFiles?.news_index || resolveStaticFileUrl(STATIC_DEFAULT_FILES.news_index);
  if (!staticNewsIndexPromise || staticNewsIndexUrl !== newsUrl) {
    staticNewsIndexUrl = newsUrl;
    staticNewsIndexPromise = fetchStaticJson(newsUrl).then((payload) => payload?.items || []);
  }
  const items = await staticNewsIndexPromise;
  return normalizedLane
    ? items.filter((item) => getEditorialLane(item) === normalizedLane)
    : items;
}

async function loadStaticTopicDetail(snapshot, topicId) {
  if (snapshot?.topic_details?.[topicId]) {
    return snapshot.topic_details[topicId];
  }
  const explicitUrl = snapshot?._staticFiles?.topic_detail_files?.[topicId];
  const detailUrl = explicitUrl
    ? resolveStaticFileUrl(explicitUrl)
    : `${snapshot?._staticFiles?.topic_details_dir || resolveStaticFileUrl(STATIC_DEFAULT_FILES.topic_details_dir)}/${encodeURIComponent(topicId)}.json`;
  if (!staticTopicDetailPromises.has(detailUrl)) {
    staticTopicDetailPromises.set(detailUrl, fetchStaticJson(detailUrl).catch(() => ({
      brief: snapshot?.topic_briefs_payload?.topics?.find((topic) => topic?.topic_id === topicId) || null,
      items: [],
      total: 0,
    })));
  }
  return staticTopicDetailPromises.get(detailUrl);
}

function getStaticComparableDate(item) {
  return item?.published_at || item?.scraped_at || '';
}

function staticMatchScope(item, scope) {
  if (!scope || scope === 'all') return true;
  const primary = String(item?.primary_scope || '').toLowerCase();
  const tags = Array.isArray(item?.geo_tags_list) ? item.geo_tags_list.map((tag) => String(tag).toLowerCase()) : [];
  return primary === scope || tags.includes(scope);
}

function staticFilterNews(items, params) {
  let filtered = [...(items || [])];
  const ipType = params.get('ip_type');
  const editorialLane = params.get('editorial_lane');
  const source = params.get('source');
  const category = params.get('category');
  const query = (params.get('q') || '').trim().toLowerCase();
  const dateFrom = params.get('date_from') || '';
  const dateTo = params.get('date_to') || '';
  const hasAiRaw = params.get('has_ai');
  const relevantOnlyRaw = params.get('relevant_only');
  const scope = params.get('scope') || '';

  if (ipType && ipType !== 'all') filtered = filtered.filter((item) => item.ip_type === ipType);
  if (editorialLane && editorialLane !== 'all') filtered = filtered.filter((item) => getEditorialLane(item) === editorialLane);
  if (source) filtered = filtered.filter((item) => item.source_id === source);
  if (category) filtered = filtered.filter((item) => item.category === category);
  if (scope) filtered = filtered.filter((item) => staticMatchScope(item, scope));
  if (dateFrom) filtered = filtered.filter((item) => getStaticComparableDate(item) >= dateFrom);
  if (dateTo) filtered = filtered.filter((item) => getStaticComparableDate(item) <= dateTo);
  if (hasAiRaw === 'true') filtered = filtered.filter((item) => item.ai_status === 'done');
  if (hasAiRaw === 'false') filtered = filtered.filter((item) => item.ai_status !== 'done');
  if (relevantOnlyRaw === 'true') filtered = filtered.filter((item) => item.ai_is_relevant !== 0);
  if (relevantOnlyRaw === 'false') filtered = filtered.filter((item) => item.ai_is_relevant === 0);
  if (query) {
    filtered = filtered.filter((item) => {
      const haystack = [
        item.title,
        item.title_zh,
        item.summary,
        item.ai_summary_zh,
        item.ai_insight_zh,
        item.source_name,
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  filtered.sort((left, right) => getStaticComparableDate(right).localeCompare(getStaticComparableDate(left)));
  const page = Math.max(1, Number(params.get('page') || 1));
  const limit = Math.max(1, Math.min(100, Number(params.get('limit') || 20)));
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;
  return {
    items: filtered.slice(offset, offset + limit),
    total,
    page,
    pages,
    limit,
    date_from: dateFrom || '',
    date_to: dateTo || '',
  };
}

async function staticApiFetch(path, options = {}) {
  if ((options.method || 'GET').toUpperCase() !== 'GET') {
    throw new Error('Static showcase is read-only');
  }
  const snapshot = await loadStaticSnapshot();
  const [rawPath, rawQuery = ''] = path.split('?');
  const params = new URLSearchParams(rawQuery);

  if (rawPath === '/health') return cloneData(snapshot.health);
  if (rawPath === '/stats') return cloneData(snapshot.stats);
  if (rawPath === '/intel-overview') return cloneData(snapshot.intel_overview);
  if (rawPath === '/reports/daily') return cloneData(snapshot.daily_report);
  if (rawPath === '/reports/weekly') return cloneData(snapshot.weekly_report);
  if (rawPath === '/reports/daily/audio/latest') return cloneData(snapshot.daily_audio_latest);
  if (rawPath === '/reports/daily/audio/history') return cloneData({ items: [], total: 0 });
  if (rawPath === '/reports/archive') return cloneData(snapshot.archive || { groups: { daily: [], weekly: [] }, items: [], total: 0 });
  if (rawPath === '/sources') return cloneData(snapshot.sources_payload);
  if (rawPath === '/topic-briefs') return cloneData(snapshot.topic_briefs_payload);
  if (rawPath === '/news') {
    const newsItems = await loadStaticNewsIndex(snapshot, params.get('editorial_lane') || '');
    return staticFilterNews(cloneData(newsItems || []), params);
  }

  const topicDetailMatch = rawPath.match(/^\/topic-briefs\/([^/]+)$/);
  if (topicDetailMatch) {
    const topicId = decodeURIComponent(topicDetailMatch[1]);
    const detail = await loadStaticTopicDetail(snapshot, topicId);
    return cloneData(detail?.brief || null);
  }
  const topicItemsMatch = rawPath.match(/^\/topic-briefs\/([^/]+)\/items$/);
  if (topicItemsMatch) {
    const topicId = decodeURIComponent(topicItemsMatch[1]);
    const detail = await loadStaticTopicDetail(snapshot, topicId);
    return cloneData({ items: detail.items || [], total: detail.total || (detail.items || []).length });
  }

  throw new Error(`Static API route not implemented: ${rawPath}`);
}

// ──────────────────────────────────────────────
// i18n Translations
// ──────────────────────────────────────────────

const i18n = {
  zh: {
    brand: 'Pontnova Europe IP Intelligence',
    brand_mark: '',
    brand_title: 'Pontnova Europe IP Intelligence',
    brand_sub: 'EU IP SENTINEL',
    tagline: '实时追踪欧洲知识产权动态',
    nav_news: '最新资讯',
    nav_patent: '专利',
    nav_trademark: '商标',
    nav_design: '外观设计',
    nav_copyright: '版权',
    nav_data: '数据保护',
    nav_sep: 'SEP标准必要专利',
    nav_gi: '地理标志',
    nav_general: '综合IP',
    nav_reports: '情报简报',
    nav_sources: '研究来源',
    nav_stats: '运行看板',
    nav_settings: '设置',
    nav_about: '研究方法',
    topbar_sub_news: '',
    topbar_sub_reports: '先看当前日报与周报，再回看可追溯明细、最近几期与历史归档。',
    topbar_sub_sources: '查看当前窗口内真正活跃的研究来源、相关性与原文质量。',
    topbar_sub_stats: '值守抓取、质检、AI分析与异常来源，快速判断链路是否稳定。',
    topbar_sub_about: '查看这一研究页的定位、来源体系、加工链路与 AI 判断机制。',
    topbar_sub_settings: '调整自动抓取时间、AI 模型与运行参数。',
    cat_official: '官方机构',
    cat_media: 'IP媒体',
    cat_lawfirm: '律所博客',
    filter_all: '全部',
    filter_patent: '专利',
    filter_trademark: '商标',
    filter_design: '外观设计',
    filter_copyright: '版权',
    filter_data: '数据保护',
    filter_sep: 'SEP标准必要专利',
    filter_gi: '地理标志',
    filter_general: '综合IP',
    filter_scope: '法域/国家',
    filter_scope_eu: '欧洲',
    filter_scope_intl: '国际',
    filter_scope_uk: '英国',
    filter_scope_de: '德国',
    filter_scope_fr: '法国',
    filter_scope_benelux: '比荷卢',
    filter_scope_scandinavia: '北欧',
    filter_official: '官方',
    filter_media: '媒体',
    filter_lawfirm: '律所',
    filter_lane: '阅读层级',
    filter_lane_core: '核心流',
    filter_lane_watch: '观察流',
    filter_lane_calendar: '活动公告',
    filter_has_ai: '🤖 有AI分析',
    search_placeholder: '搜索知识产权新闻...',
    btn_refresh: '全源刷新',
    btn_refreshing: '刷新中...',
    btn_read_more: '阅读全文',
    btn_close: '关闭',
    btn_save: '保存',
    stat_total: '收录总量',
    stat_today: '今日新增',
    stat_sources: '研究来源',
    stat_next: '下次更新',
    no_news: '暂无新闻',
    no_news_desc: '当前暂无可展示情报，可手动触发一次全源刷新。',
    loading: '加载中...',
    sources_title: '研究来源',
    sources_desc: '平台收录以下欧洲知识产权权威信息源',
    col_source: '来源',
    col_type: '类型',
    col_category: '领域',
    col_country: '国家',
    col_scope: '覆盖范围',
    col_status: '状态',
    col_window_items: '窗口内',
    col_relevant_items: '相关',
    col_rich_items: '原文',
    col_latest_seen: '最新日期',
    status_active: '运行中',
    sources_window_title: '来源覆盖概览',
    sources_window_desc: '优先展示当前观察窗口内真正跑起来的来源与正文覆盖情况。',
    sources_summary_active: '活跃来源',
    sources_summary_relevant_ratio: '相关占比',
    sources_summary_rich_ratio: '正文占比',
    sources_summary_window: '观察窗口',
    source_quality_full: '正文优先',
    source_quality_partial: '正文混合',
    source_quality_summary: '摘要为主',
    source_tier_core: '核心主盘',
    source_tier_stable: '稳定来源',
    source_tier_watch: '观察来源',
    source_tier_summary: '来源结构',
    source_signal_strong: '相关稳定',
    source_signal_mixed: '相关混合',
    source_signal_watch: '继续观察',
    stats_title: '运行看板',
    stats_overview_title: '系统运行概览',
    stats_overview_desc: '查看当前观察窗口、抓取链路、质检与 AI 解读的整体状态。',
    stats_by_type: '按IP类型分布',
    stats_by_source: '按来源排行（Top 10）',
    stats_trend: '近7日收录趋势',
    stats_runtime_title: '当前状态',
    stats_runtime_window: '观察窗口',
    stats_runtime_scheduler: '自动调度',
    stats_runtime_model: 'AI模型',
    stats_runtime_latest_scrape: '最近抓取',
    stats_runtime_latest_ai: '最近分析',
    stats_runtime_latest_quality: '最近质检',
    stats_runtime_relevant: '相关资讯',
    stats_runtime_structured: '已完成标定',
    stats_runtime_pending: '待补分析',
    stats_runtime_duplicates: '重复候选',
    stats_runtime_event_clusters: '事件簇',
    stats_runtime_cross_source: '跨来源事件',
    stats_runtime_source_tiers: '来源分级',
    stats_runtime_active_sources: '活跃来源',
    stats_runtime_health_24h: '近24小时运行健康度',
    stats_runtime_scrape_success: '抓取成功率',
    stats_runtime_ai_success: '分析成功率',
    stats_runtime_quality_success: '质检成功率',
    stats_runtime_scrape_volume: '抓取量',
    stats_runtime_ai_volume: '分析量',
    stats_runtime_quality_volume: '质检清理',
    stats_scrape_history: '抓取记录',
    stats_ai_history: '分析记录',
    stats_quality_history: '质检记录',
    stats_event_clusters: '同题事件',
    stats_event_clusters_desc: '把多来源指向同一议题的资讯聚在一起看，便于判断哪些主题正在持续升温。',
    stats_source_alerts: '异常来源',
    stats_source_alerts_desc: '最近几轮抓取连续无结果、无新增或出现失败的来源，会在这里高亮，方便快速巡检。',
    stats_alerts_scrape: '抓取异常',
    stats_alerts_quiet: '来源静默',
    stats_alerts_scrape_desc: '最近几轮抓取异常、连续 0 抓到或窗口内没有有效内容的来源。',
    stats_alerts_quiet_desc: '近期持续无新增、相关性偏弱或内容明显陈旧的来源。',
    stats_alerts_empty_scrape: '当前没有明显的抓取异常来源。',
    stats_alerts_empty_quiet: '当前没有需要额外关注的静默来源。',
    stats_alert_total: '告警来源',
    stats_alert_error: '异常',
    stats_alert_warn: '关注',
    stats_alert_watch: '观察',
    stats_alert_none: '当前暂无需要优先处理的异常来源，日更链路运行平稳。',
    stats_alert_reason_error: '最近一次抓取失败，建议检查源站可访问性或抓取规则。',
    stats_alert_reason_unstable: '最近几轮抓取出现多次失败，建议继续观察并核对规则稳定性。',
    stats_alert_reason_no_signal: '连续多轮抓取结果为 0，疑似入口失效、页面结构变化或该源当前没有可读内容。',
    stats_alert_reason_no_window_items: '该来源当前窗口内尚无有效资讯，建议确认是否继续保留为日更来源。',
    stats_alert_reason_stale: '连续多轮没有新增，且最近收录已经明显变旧，建议检查该源近期活跃度。',
    stats_alert_reason_low_relevance: '连续多轮没有新增，且当前窗口内有效相关资讯偏少，建议降低观察优先级。',
    stats_alert_reason_quality_watch: '该来源当前被归为观察来源：相关性或正文质量偏弱，建议只作为补充信号使用。',
    stats_alert_last_run: '最近运行',
    stats_alert_found: '抓到',
    stats_alert_new: '新增',
    stats_alert_window_items: '窗口内',
    stats_alert_relevant: '相关',
    stats_alert_latest_content: '最近收录',
    stats_alert_action: '建议处理',
    stats_alert_action_check_source_rule: '检查抓取规则',
    stats_alert_action_downgrade_source: '降级观察频率',
    stats_alert_action_watch_source: '继续观察',
    stats_cluster_items: '条资讯',
    stats_cluster_sources: '个来源',
    stats_cluster_latest: '最近信号',
    stats_col_source: '来源',
    stats_col_started: '开始时间',
    stats_col_finished: '完成时间',
    stats_col_found: '抓到',
    stats_col_new: '新增',
    stats_col_attempted: '尝试',
    stats_col_success: '成功',
    stats_col_failed: '失败',
    stats_col_stage: '阶段',
    stats_col_matched: '命中',
    stats_col_deleted: '删除',
    stats_col_model: '模型',
    stats_col_status: '状态',
    settings_title: '系统设置',
    settings_interval: '自动抓取时间（每日）',
    settings_interval_desc: '每天几点自动抓取（上海时间，0-23时）',
    settings_interval_unit: '时',
    settings_ai_title: 'AI分析设置',
    settings_ai_model: 'AI模型',
    settings_ai_model_desc: '通义千问模型名称（如 qwen-plus、qwen-turbo）',
    settings_ai_key_status: 'API密钥状态',
    settings_ai_key_set: '✅ 已配置',
    settings_ai_key_unset: '❌ 未配置（请设置 QWEN_API_KEY 环境变量）',
    settings_ai_auto: '抓取后自动分析',
    settings_ai_auto_desc: '每次抓取完成后自动触发AI分析',
    settings_theme: '界面主题',
    settings_theme_desc: '切换浅色或深色界面主题',
    settings_theme_dark: '深色模式',
    btn_analyze: 'AI分析',
    btn_analyze_now: '立即分析',
    btn_analyze_hint: '对当前库中待分析的资讯执行 AI 解读，不重新抓取新数据',
    btn_analyzing: '分析中...',
    btn_pipeline: '抓取+分析',
    topbar_ai_powered: 'AI驱动',
    topbar_ai_powered_en: 'Powered by AI',
    topbar_ai_badge_hint: '自动抓取、清洗与AI解读共同驱动当前情报盘面',
    topbar_auto_live: '自动巡航',
    topbar_status_hint: '首页内容会随后台抓取与AI分析结果自动更新',
    analyze_started: 'AI分析任务已启动',
    analyze_error: 'AI分析启动失败，请检查API密钥',
    ai_title_zh: '标题译文',
    ai_title_en: '原文标题',
    ai_summary: '核心摘要',
    ai_insight: '企业洞察',
    ai_pending: '待分析',
    ai_done: '已分析',
    ai_failed: '分析失败',
    scrape_started: '抓取任务已启动，稍后刷新查看结果',
    scrape_error: '抓取启动失败，请检查服务状态',
    total_items: '条资讯',
    page_of: '共',
    page_page: '页',
    detail_source: '来源',
    detail_published: '发布时间',
    label_published_short: '发布',
    label_captured_short: '采集',
    detail_type: 'IP类型',
    detail_analysis_depth: '分析深度',
    detail_link: '原文链接',
    detail_btn: '查看原文 →',
    detail_btn_short: '原文',
    detail_view_btn: '查看完整信息',
    hero_kicker: '总览',
    sidebar_section_label: '主题导航',
    hero_title: '一屏掌握欧洲知识产权全局态势',
    hero_desc: '围绕官方机构、法院、专业媒体与律所信号，优先呈现最新变化、重点法域与可执行解读。',
    hero_scope: '当前法域',
    hero_focus: '当前重点',
    hero_mode: '分析模式',
    hero_mode_ai: 'AI深读',
    hero_mode_live: '实时情报',
    hero_top_source: '最活跃来源',
    hero_top_type: '最热权利类型',
    hero_source_mix: '核心来源结构',
    hero_source_policy: '首页优先核心主盘与稳定来源，观察来源仅作为补充信号。',
    hero_ai_density: 'AI覆盖率',
    hero_watch: '观察重点',
    hero_editorial_note: '围绕官方机构、法院、专业媒体与顶级律所四类高信号源，建立全域连续观察。',
    hero_refresh: '最近刷新',
    hero_authority: '核心来源带',
    hero_authority_desc: '将官网、法院与头部专业媒体压缩为一条快速扫读信号带。',
    hero_focus_note: '先看官网与法院，再看媒体与律所，首页按可信度与时效优先排序。',
    hero_overview_sources: '覆盖来源',
    hero_overview_samples: '综合样本',
    priority_cover_note: '封面导语',
    priority_signal: '关键焦点',
    priority_policy_note: '主盘优先展示核心与稳定来源，再用观察来源补充边缘信号。',
    news_card_brief: '快速提要',
    block_bilingual_title: '标题',
    block_core_points: '核心要点',
    block_insight: '洞察',
    block_original_link: '原始链接',
    block_overview_summary: '综合态势',
    block_overview_signals: '关键联动',
    block_overview_cross: '穿透观察',
    block_overview_implications: '企业影响',
    block_overview_watchlist: '下一步盯盘',
    block_overview_basis: '生成依据',
    block_representative_signal: '代表资讯',
    block_key_moves: '核心变化',
    block_business_actions: '行动建议',
    block_topic_points: '核心信号',
    block_topic_actions: '行动重点',
    overview_pending: '综合态势生成中',
    section_priority: '战情简报',
    section_reports: '当前简报',
    section_reports_desc_home: '首页先看当前日报与周报；详细要点默认折叠，完整 20 条明细、最近几期与历史归档都在简报页。',
    section_reports_desc_page: '先看当前窗口最重要的两份简报和 20 条可追溯明细，再往下看最近几期的连续变化。',
    section_today_published: '今日发布',
    section_today_published_desc: '只按原始发布日期收今天发出的内容，先快速扫一遍今天真正新增的盘面。',
    section_today_published_desc_fallback: '今日原始发布暂时为空，以下先展示今日新抓且已完成判断的高价值资讯。',
    section_today_published_empty: '今天暂时还没有新的发布内容。',
    section_today_published_count: '条今日发布',
    section_today_published_expand: '展开其余今日发布',
    section_today_published_collapse: '收起今日发布',
    section_europe_heat: '欧洲热区',
    section_europe_heat_desc: '按近7天资讯涉及的欧洲国家或地区热度显示，帮助快速判断哪里正在升温。',
    section_europe_heat_recent: '近7天热度',
    section_europe_heat_wide: '欧洲范围',
    section_europe_heat_hotspots: '热点国家/地区',
    section_europe_heat_empty: '当前筛选下暂无可标注的地区热度。',
    section_europe_heat_click_hint: '点击地图国家或右侧热点，可直接查看该国/地区的近期资讯。',
    section_europe_heat_hover_count: '条资讯',
    section_europe_heat_country_feed: '该国/地区资讯',
    section_europe_heat_country_desc: '基于当前筛选流展示该国/地区的近期资讯，便于快速判断相关动态。',
    section_europe_heat_country_empty: '当前筛选下，这个国家或地区暂时没有可展示的资讯。',
    section_europe_heat_member_eu: 'EU成员',
    section_europe_heat_non_member_eu: '非EU',
    section_europe_heat_member_epc: 'EPC成员',
    section_europe_heat_non_member_epc: '非EPC',
    section_europe_heat_member_upc: 'UPC成员',
    section_europe_heat_non_member_upc: '非UPC',
    section_europe_heat_primary_feed: '该国主线资讯',
    section_europe_heat_related_feed: '涉及该国的相关资讯',
    section_europe_heat_upc_overall: 'UPC整体',
    section_europe_heat_upc_overall_desc: '涉及 UPC 制度、规则、任命、统计等系统级动态，不强行归入单一国家。',
    label_today_scraped: '今日新抓',
    today_published_state_captured: '今日新抓',
    section_latest_dynamics: '最新动态',
    section_latest_dynamics_desc: '在进入完整情报流前，先快速扫一遍近48小时最值得优先关注的高信号变化。',
    section_latest_dynamics_empty: '近48小时暂无新的高信号动态。',
    latest_dynamics_filter_all: '全部',
    latest_dynamics_filter_official: '官方',
    latest_dynamics_filter_court: '裁判',
    latest_dynamics_filter_sep: 'SEP',
    latest_dynamics_filter_business: '企业动作',
    section_reports_summary_briefs: '份当前战报',
    section_reports_summary_items: '条可追溯明细',
    section_reports_summary_split: '日报 / 周报',
    reports_open_center: '进入简报页查看完整内容',
    reports_open_center_short: '查看完整简报',
    reports_center_title: '情报简报',
    reports_center_desc: '围绕当前两份简报、20 条可追溯明细、最近几期与历史归档组织整个简报流，便于持续跟踪盘面变化。',
    reports_center_window: '当前观察窗口',
    reports_center_daily_mix: '日报来源结构',
    reports_center_weekly_mix: '周报来源结构',
    reports_center_recent_count: '最近几期',
    reports_center_archive_count: '历史归档',
    reports_center_pending: '待补分析',
    reports_center_export_daily_pdf: '下载今日日报PDF',
    reports_center_export_weekly_pdf: '下载本周战报PDF',
    reports_center_action_read: '直接阅读',
    reports_center_action_export: '快捷导出',
    reports_center_open_daily: '查看今日日报',
    reports_center_open_weekly: '查看本周战报',
    reports_center_daily_desc: '更偏当天新增变化、机构动作与法院信号。',
    reports_center_weekly_desc: '更偏一周结构趋势、制度变化与跨来源共识。',
    reports_center_daily_compare: '日报窗口对比',
    reports_center_weekly_compare: '周报窗口对比',
    report_compare_items: '条情报',
    report_compare_sources: '个来源',
    report_compare_flat: '与上一窗口基本持平',
    report_items_title: '简报明细',
    report_items_desc: '围绕当前简报列出最多 10 条可直接下钻的具体资讯。',
    report_items_count: '条重点资讯',
    report_items_expand: '展开其余',
    report_items_collapse: '收起附加条目',
    report_items_hint: '默认先展开前 5 条，便于快速浏览。',
    report_items_preview_title: '代表情报',
    report_items_preview_more: '进入简报页查看全部 10 条',
    report_export_pdf_short: '下载PDF',
    report_items_preview_title_daily: '今日代表情报',
    report_items_preview_title_weekly: '本周代表情报',
    report_scope_items: '条明细',
    report_scope_sources: '个来源',
    report_home_fold_open: '展开战报',
    report_home_fold_close: '收起战报',
    report_home_fold_desc: '默认收起详细要点与代表情报，避免首页过于拥挤。',
    report_block_moves_daily: '今日变化',
    report_block_moves_weekly: '本周结构',
    report_block_watch_daily: '下一步盯盘',
    report_block_watch_weekly: '下周观察',
    report_points_expand: '展开全部要点',
    report_points_collapse: '收起要点',
    reports_nav_current: '当前简报',
    reports_nav_recent: '最近几期',
    reports_nav_archive: '归档资料',
    reports_role_current: '主盘层',
    reports_role_recent: '连续回看',
    reports_role_archive: '资料层',
    report_signal_strengthening: '信号升温',
    report_signal_easing: '信号回落',
    report_signal_steady: '基本持平',
    reports_archive_title: '归档资料',
    reports_archive_desc: '保留导出的日报与周报文件，作为可回看、可发送的资料层。',
    reports_archive_empty: '当前还没有战报导出记录。',
    reports_archive_daily: '日报归档',
    reports_archive_weekly: '周报归档',
    reports_archive_size: '文件大小',
    reports_archive_open: '打开',
    reports_archive_download: '下载',
    reports_archive_open_brief: '打开简报',
    reports_archive_download_file: '下载文件',
    reports_timeline_title: '最近几期',
    reports_timeline_desc: '把最近导出的日报与周报按时间串起来，便于对照最近几期的变化。',
    reports_timeline_empty: '最近还没有可展示的战报记录。',
    report_label_daily: '日报',
    report_label_weekly: '周报',
    section_topics: '专题研判',
    section_actions: '行动建议',
    section_pulse: '战场脉搏',
    section_watchlist: '重点观察源',
    section_theaters: '主题版图',
    section_stream: '资讯情报流',
    section_latest: '最新动态',
    lane_core_kicker: '主流信号',
    lane_core_title: '核心资讯流',
    lane_core_desc: '优先处理判决、政策、官方更新与高信号专题分析。',
    lane_watch_kicker: '趋势补充',
    lane_watch_title: '观察资讯',
    lane_watch_desc: '保留值得跟踪的分析评论，适合扫面趋势与补充判断。',
    lane_calendar_kicker: '活动提醒',
    lane_calendar_title: '活动与公告',
    lane_calendar_desc: '会议、活动和通知单独放在这里，不再挤占主资讯流。',
    focus_mode_kicker: '主题浏览模式',
    focus_mode_title: '当前已切换到聚焦资讯流',
    focus_mode_desc: '当你按专利、商标、地理标志或关键词筛选时，页面会优先展示当前主题相关资讯；全局态势、报表和专题模块会收起，避免浏览时被前面大块内容打断。',
    focus_mode_global_title: '全局辅助模块',
    focus_mode_global_desc: '以下保留欧洲全局态势、报表和专题，只有在需要回看整体战场时再展开。',
    focus_mode_expand: '展开全局模块',
    focus_mode_collapse: '收起全局模块',
    focus_mode_reset: '返回总览',
    focus_mode_filters: '当前筛选',
    focus_mode_results: '当前命中',
    focus_mode_sources: '涉及来源',
    focus_mode_ai: 'AI完成',
    focus_mode_ai_only: '仅AI解读',
    focus_mode_sep_ai_title: 'SEP专题AI分析不在这页',
    focus_mode_sep_ai_desc: '你现在看到的是“SEP标准必要专利聚焦资讯流”。AI图表、AI洞察卡和趋势判断都在 SEP标准必要专利专题详情页里。',
    focus_mode_sep_ai_open: '进入 SEP标准必要专利AI分析',
    stream_must_read: '必须看',
    stream_must_read_desc: '优先查看的高价值动态',
    stream_scan: '快速浏览',
    stream_scan_desc: '需要了解但紧迫度次一级',
    stream_background: '背景监测',
    stream_background_desc: '用于持续观察与趋势补充',
    stream_sort_note: '按时间从新到旧',
    stream_group_today: '今天',
    stream_group_yesterday: '昨天',
    stream_group_this_week: '本周较早',
    stream_group_this_month: '本月较早',
    stream_group_undated: '待补日期',
    stream_group_items: '条',
    stream_group_expand: '展开其余',
    stream_group_collapse: '收起本组',
    stream_group_browser_hint: '左右滑动浏览本组档案',
    stream_group_open_modal: '查看本组全部',
    chronology_modal_timeline_label: '时间轴',
    chronology_modal_summary_range: '覆盖范围',
    chronology_modal_summary_dates: '日期节点',
    chronology_modal_summary_items: '资讯条目',
    card_priority: '优先阅读',
    card_latest: '最新信号',
    card_sources: '热源监测',
    card_main_sources: '主盘来源',
    card_mix: '类型热度',
    card_empty: '暂无可显示情报',
    report_daily: '今日战报',
    report_weekly: '周度战报',
    topic_btn: '查看相关资讯',
    topic_open: '进入专题研判',
    topic_back: '返回情报首页',
    topic_related: '相关情报',
    topic_timeline: '专题时间轴',
    topic_timeline_desc: '按信号强弱排列的近期专题动态',
    topic_latest_signal: '最近动态',
    topic_sep_actors: '关键参与方',
    topic_sep_actors_desc: '这一长窗专题里最常出现的核心当事方、平台与机构。',
    topic_sep_case_line: '关键案件线',
    topic_sep_case_line_desc: '按时间抽样回看 2025 年以来 SEP标准必要专利议题的代表节点。',
    topic_sep_signal_mix: '专题结构',
    topic_sep_signal_mix_desc: '按案件、政策规则和许可动作拆解这条长窗专题。',
    topic_sep_china_impact: '对中国企业影响',
    topic_sep_china_impact_desc: '把这条长窗专题直接转译成中国企业在欧布局需要关心的经营与合规动作。',
    topic_sep_china_focus: '重点企业',
    topic_sep_china_related: '中企相关',
    topic_sep_company_map: '企业联动线',
    topic_sep_company_map_desc: '把重点企业、关联节点和下一步动作串起来看，更快定位对中国企业最直接的影响。',
    topic_sep_company_risks: '主要风险',
    topic_sep_company_trend: '变化判断',
    topic_sep_company_conclusion: '观察结论',
    topic_sep_company_recent: '最近节点变化',
    topic_sep_company_sources: '代表来源',
    topic_sep_company_latest: '最近更新',
    topic_sep_company_source_quality: '来源可信度',
    topic_sep_company_freshness: '信号新鲜度',
    topic_sep_company_latest_signal: '最近关键动作',
    topic_sep_company_action_link: '对应动作',
    topic_sep_company_nodes: '相关节点',
    topic_sep_company_node_groups: '节点分组',
    topic_sep_company_snapshot: '企业全景快照',
    topic_sep_company_timeline: '最近时间轴',
    topic_sep_company_latest_badge: '最新',
    topic_sep_company_recent_window: '近期',
    topic_sep_company_previous_window: '前期',
    topic_sep_ai_analysis: 'SEP标准必要专利AI分析',
    topic_sep_ai_analysis_desc: '把长窗样本按时间、信号类型、主导法域和分析基础拆开看，更快发现真正的升温方向。',
    topic_sep_ai_monthly: '月度趋势',
    topic_sep_ai_monthly_desc: '按月回看 SEP标准必要专利信号量的变化轨迹。',
    topic_sep_ai_mix: '类型热度',
    topic_sep_ai_mix_desc: '对比近120天与前120天，判断案件、政策和许可哪条线在升温。',
    topic_sep_ai_forum: '主导法域',
    topic_sep_ai_forum_desc: '近120天最活跃的争议法域与政策场域。',
    topic_sep_ai_depth: '分析基础',
    topic_sep_ai_depth_desc: '当前专题里有多少判断基于全文、公开预览或摘要级输入。',
    topic_sep_ai_insight_cards: 'AI洞察卡',
    topic_sep_ai_insight_cards_desc: '把争议结构、法域重心、中企暴露和分析基础压成几张可直接读的判断卡。',
    topic_sep_ai_judgments: 'AI趋势判断',
    topic_sep_ai_recent_total: '近120天信号',
    topic_sep_ai_china_related: '中企相关',
    topic_sep_ai_dominant_signal: '主导类型',
    topic_sep_ai_dominant_scope: '主导法域',
    topic_sep_ai_recent_window: '近120天',
    topic_sep_ai_previous_window: '前120天',
    topic_sep_ai_share: '占比',
    topic_sep_ai_card_insight: '洞察',
    topic_sep_ai_card_action: '动作',
    topic_sep_ai_card_evidence: '证据',
    topic_sep_open_ai: '查看本专题AI分析',
    topic_sep_ai_hint: '在“长窗覆盖进度”下面，直接查看图表与洞察卡',
    topic_sep_ai_preview_cards: 'AI洞察卡',
    topic_sep_ai_preview_months: '趋势月份',
    topic_sep_ai_preview_judgments: '趋势判断',
    topic_sep_coverage: '长窗覆盖进度',
    topic_sep_coverage_desc: '把这条长窗专题当前补到哪里、分析到哪里，直接摆在专题页最前面。',
    topic_sep_coverage_window: '观察起点',
    topic_sep_coverage_total: '长窗样本',
    topic_sep_coverage_iam: 'IAM已补到',
    topic_sep_coverage_done: '已分析',
    topic_expand_related_nodes: '展开其余节点',
    topic_collapse_related_nodes: '收起节点',
    topic_open_source: '查看原文',
    topic_page_kicker: '专题研判',
    topic_metric_sources: '覆盖来源',
    topic_metric_items: '样本规模',
    topic_metric_window: '观察窗口',
    topic_long_window: '长窗专题',
    topic_long_window_hint: '自 2025-01-01 起追踪，并随日更自动回填',
    export_html: '导出HTML',
    export_md: '导出Markdown',
    export_pdf: '导出PDF',
    export_done: '已导出',
    export_failed: '导出失败',
    risk_label: '风险',
    impact_label: '影响',
    urgency_label: '紧急度',
    level_high: '高',
    level_medium: '中',
    level_low: '低',
    level_immediate: '立即',
    level_soon: '近期',
    level_watch: '观察',
    label_showing: '当前结果',
    label_scope_all: '全域',
    label_ai_ready: '已带AI解读',
    label_manual_refresh: '全源刷新',
    label_brief_summary: '态势摘要',
    label_brief_insight: '行动建议',
    label_original_title: '原标题',
    label_translated_title: '中文标题',
    label_latest_update: '最新更新',
    label_next_window: '下次窗口',
    label_article_count: '情报总量',
    about_title: '研究方法',
    about_subtitle: '了解这一研究页的定位、来源体系、加工链路与稳定输出机制',
    about_purpose_kicker: '页面定位',
    about_purpose_title: '这页想解决什么问题',
    about_purpose_desc: '这不是简单的资讯聚合页，而是一套面向欧洲知识产权议题的持续研究界面。它优先关注官方机构、法院、专业媒体与律所的高价值动态，帮助读者更快获得及时、全面、去噪后的欧洲 IP 情报，并形成可执行的商业判断视角。',
    about_status_kicker: '当前状态',
    about_status_title: '本窗口资讯已按新流程重跑',
    about_status_desc: '当前收集窗口内的资讯已经全部重新走过“抓取 → 清洗 → AI 编辑标注 → 四段式解读”的新流程，后续自动化也将沿用这套模式。',
    about_status_total: '窗口内资讯',
    about_status_structured: '已完成编辑标注',
    about_status_relevant: 'AI判定相关',
    about_status_irrelevant: 'AI判定排除',
    about_workflow_kicker: '工作流程',
    about_workflow_title: '这页如何获取、加工并呈现研究内容',
    about_workflow_step1: '1. 收集资讯',
    about_workflow_step1_desc: '从官网、媒体、律所等权威源抓取标题、摘要、正文、附件与原始链接，并限定在当前观察窗口内。',
    about_workflow_step2: '2. 去噪清洗',
    about_workflow_step2_desc: '剔除导航页、活动页、播客、周报合集和与欧洲知识产权无关的低价值条目，减少噪音。',
    about_workflow_step3: '3. AI编辑标注',
    about_workflow_step3_desc: 'AI 先像编辑一样判断是否相关，并标定法域、国家/地区、主题、文种、机构和置信度。',
    about_workflow_step4: '4. 四段式解读',
    about_workflow_step4_desc: '对保留下来的资讯输出标题、核心要点、洞察和原始链接，保持统一阅读结构。',
    about_workflow_step5: '5. 分类呈现',
    about_workflow_step5_desc: '再把这些结构化结果用于首页、主题浏览、专题页、日报和周报，形成可连续使用的研究情报界面。',
    about_sources_kicker: '信息源',
    about_sources_title: '覆盖哪些研究来源',
    about_sources_desc: '来源分为官方、媒体、律所三类；以下优先展示当前窗口内实际产生资讯的研究来源。',
    about_source_official: '官方机构',
    about_source_media: '专业媒体',
    about_source_lawfirm: '律所观察',
    about_source_window: '窗口内',
    about_source_relevant: '相关',
    about_source_rich: '原文',
    about_source_latest: '最新',
    about_method_kicker: 'AI 精度',
    about_method_title: 'AI 如何尽量做到准而稳',
    about_method_intro: '这一研究页不会把文章直接交给 AI 自由发挥，而是用“规则底座 + AI 编辑标注 + 服务端归一化 + 质量守卫”的方式，尽量压低误判、漂移和噪音回流。',
    about_method_note: 'AI 不是唯一裁决者。来源规则、日期纠偏、主题回写、质量守卫和来源回归巡检会一起参与校正。',
    about_method_metric_ai_success: '24小时分析成功率',
    about_method_metric_ai_success_desc: '最近 24 小时 AI 批次的完成成功率',
    about_method_metric_quality_deleted: '24小时质检清理',
    about_method_metric_quality_deleted_desc: '最近 24 小时质量守卫清掉的低价值条目数',
    about_method_metric_last_quality: '最近质检',
    about_method_metric_last_quality_desc: '最近一次自动质检完成时间',
    about_method_precision_title: '精准机制',
    about_method_precision_1: 'AI 先做相关性、法域、主题、文种、机构等编辑标注，再做摘要和洞察，不直接自由发挥。',
    about_method_precision_2: '分析输入优先使用标题、摘要、正文、原文链接与来源规则提示，不只依赖标题做判断。',
    about_method_precision_3: '主题、法域、文种全部走封闭枚举；像专利 / 外观设计这类冲突，会用 AI 主主题回写最终分类。',
    about_method_precision_4: '抓取前后都有限制：来源级欧洲过滤、日期修复、去重和低价值内容拦截，会先压掉一批误差。',
    about_method_stability_title: '稳定机制',
    about_method_stability_1: '每次自动运行都沿用同一条标准流水线：抓取、清洗、日期纠偏、AI 标定、解读、质检、生成总览。',
    about_method_stability_2: '服务端会二次归一化 AI 输出，修正非法枚举、空列表、异常格式和不一致字段。',
    about_method_stability_3: '原文更新、正文回填或规则修正后，旧 AI 结果会被重置并重新分析，保证解读跟随原始材料同步。',
    about_method_stability_4: '质量守卫和来源回归巡检会持续检查噪音回流、来源退化和弱相关条目，避免旧问题反复出现。',
    about_outputs_kicker: '标准输出',
    about_outputs_title: '每条资讯最终会产出什么',
    about_output_title: '标题',
    about_output_core: '核心内容',
    about_output_insight: '洞察',
    about_output_link: '原文链接',
    about_output_meta: '编辑标注',
    about_output_meta_desc: '相关性、法域、国家/地区、主题、文种、机构、置信度',
    about_cta_sources: '查看研究来源',
    about_cta_back: '返回情报页',
  },
  en: {
    brand: 'Pontnova Europe IP Intelligence',
    brand_mark: '',
    brand_title: 'Pontnova Europe IP Intelligence',
    brand_sub: 'EU IP SENTINEL',
    tagline: 'Real-time European IP Intelligence',
    nav_news: 'Latest News',
    nav_patent: 'Patents',
    nav_trademark: 'Trademarks',
    nav_design: 'Designs',
    nav_copyright: 'Copyright',
    nav_data: 'Data Protection',
    nav_sep: 'SEP Standard-Essential Patents',
    nav_gi: 'Geographical Indications',
    nav_general: 'General IP',
    nav_reports: 'Reports',
    nav_sources: 'Sources',
    nav_stats: 'Operations Board',
    nav_settings: 'Settings',
    nav_about: 'About',
    cat_official: 'Official Institutions',
    cat_media: 'IP Media',
    cat_lawfirm: 'Law Firm Blogs',
    filter_all: 'All',
    filter_patent: 'Patent',
    filter_trademark: 'Trademark',
    filter_design: 'Design',
    filter_copyright: 'Copyright',
    filter_data: 'Data',
    filter_sep: 'SEP Standard-Essential Patents',
    filter_gi: 'GI',
    filter_general: 'General',
    filter_scope: 'Jurisdiction',
    filter_scope_eu: 'Europe',
    filter_scope_intl: 'International',
    filter_scope_uk: 'UK',
    filter_scope_de: 'Germany',
    filter_scope_fr: 'France',
    filter_scope_benelux: 'Benelux',
    filter_scope_scandinavia: 'Scandinavia',
    filter_has_ai: '🤖 AI Analyzed',
    filter_official: 'Official',
    filter_media: 'Media',
    filter_lawfirm: 'Law Firm',
    filter_lane: 'Reading Lane',
    filter_lane_core: 'Core',
    filter_lane_watch: 'Watch',
    filter_lane_calendar: 'Calendar',
    search_placeholder: 'Search IP news...',
    btn_refresh: 'Full Refresh',
    btn_refreshing: 'Refreshing...',
    btn_read_more: 'Read more',
    btn_close: 'Close',
    btn_save: 'Save',
    stat_total: 'Total Items',
    stat_today: "Today's New",
    stat_sources: 'Sources',
    stat_next: 'Next Update',
    no_news: 'No news yet',
    no_news_desc: 'No visible signals yet. Run a full refresh to repopulate the current view.',
    loading: 'Loading...',
    sources_title: 'Data Sources',
    sources_desc: 'The following authoritative European IP sources are monitored',
    col_source: 'Source',
    col_type: 'Type',
    col_category: 'IP Fields',
    col_country: 'Country',
    col_scope: 'Scope',
    col_status: 'Status',
    col_window_items: 'In Window',
    col_relevant_items: 'Relevant',
    col_rich_items: 'Rich Body',
    col_latest_seen: 'Latest',
    status_active: 'Active',
    sources_window_title: 'Source Coverage Snapshot',
    sources_window_desc: 'Highlight the sources that are truly active in the current monitoring window and how much rich-body coverage they provide.',
    sources_summary_active: 'Active Sources',
    sources_summary_relevant_ratio: 'Relevant Ratio',
    sources_summary_rich_ratio: 'Rich-Body Ratio',
    sources_summary_window: 'Collection Window',
    source_quality_full: 'Body-first',
    source_quality_partial: 'Mixed body',
    source_quality_summary: 'Summary-first',
    source_tier_core: 'Core',
    source_tier_stable: 'Stable',
    source_tier_watch: 'Watch',
    source_tier_summary: 'Source Mix',
    source_signal_strong: 'Stable relevance',
    source_signal_mixed: 'Mixed relevance',
    source_signal_watch: 'Watch',
    stats_title: 'Operations Board',
    stats_overview_title: 'System Overview',
    stats_overview_desc: 'Inspect the current window, automation status, scraping, quality passes, and AI analysis in one place.',
    stats_by_type: 'Distribution by IP Type',
    stats_by_source: 'Top Sources (by Volume)',
    stats_trend: '7-Day Collection Trend',
    stats_runtime_title: 'Current Status',
    stats_runtime_window: 'Collection Window',
    stats_runtime_scheduler: 'Scheduler',
    stats_runtime_model: 'AI Model',
    stats_runtime_latest_scrape: 'Latest Scrape',
    stats_runtime_latest_ai: 'Latest Analysis',
    stats_runtime_latest_quality: 'Latest Quality Pass',
    stats_runtime_relevant: 'Relevant Items',
    stats_runtime_structured: 'Structured Items',
    stats_runtime_pending: 'Pending',
    stats_runtime_duplicates: 'Duplicate Candidates',
    stats_runtime_event_clusters: 'Event Clusters',
    stats_runtime_cross_source: 'Cross-source Events',
    stats_runtime_source_tiers: 'Source Tiers',
    stats_runtime_active_sources: 'Active Sources',
    stats_runtime_health_24h: '24h Runtime Health',
    stats_runtime_scrape_success: 'Scrape Success',
    stats_runtime_ai_success: 'AI Success',
    stats_runtime_quality_success: 'Quality Success',
    stats_runtime_scrape_volume: 'Scrape Volume',
    stats_runtime_ai_volume: 'AI Volume',
    stats_runtime_quality_volume: 'Quality Cleanup',
    stats_scrape_history: 'Scrape Log',
    stats_ai_history: 'Analysis Log',
    stats_quality_history: 'Quality Log',
    stats_event_clusters: 'Shared Events',
    stats_event_clusters_desc: 'Group multiple source items around the same event so it is easier to spot themes that are heating up.',
    stats_source_alerts: 'Source Alerts',
    stats_source_alerts_desc: 'Highlight sources that recently failed, returned no results repeatedly, or have gone quiet so the daily run can be checked quickly.',
    stats_alerts_scrape: 'Scrape Issues',
    stats_alerts_quiet: 'Quiet Sources',
    stats_alerts_scrape_desc: 'Sources with recent scrape problems, repeated zero-found runs, or no usable items in the current window.',
    stats_alerts_quiet_desc: 'Sources that keep producing no new items, weak relevance, or noticeably stale coverage.',
    stats_alerts_empty_scrape: 'No obvious scrape issue sources at the moment.',
    stats_alerts_empty_quiet: 'No quiet sources need extra attention right now.',
    stats_alert_total: 'Alerted Sources',
    stats_alert_error: 'Error',
    stats_alert_warn: 'Attention',
    stats_alert_watch: 'Watch',
    stats_alert_none: 'No source needs urgent attention right now; the daily workflow looks steady.',
    stats_alert_reason_error: 'The latest scrape failed. Check the source reachability or scraping rule.',
    stats_alert_reason_unstable: 'Multiple recent scrape runs failed. Keep an eye on source stability.',
    stats_alert_reason_no_signal: 'Several recent runs found zero items. The entry page may have changed or the source may currently expose no readable items.',
    stats_alert_reason_no_window_items: 'This source currently has no valid items in the observation window. Confirm whether it should stay in the daily set.',
    stats_alert_reason_stale: 'The source has produced no new items for several runs and its latest captured signal is getting old.',
    stats_alert_reason_low_relevance: 'The source has produced no new items for several runs and yields little relevant coverage in the current window.',
    stats_alert_reason_quality_watch: 'This source is currently in the watch tier because its relevance or body quality is weaker. Treat it as supplementary signal only.',
    stats_alert_last_run: 'Last Run',
    stats_alert_found: 'Found',
    stats_alert_new: 'New',
    stats_alert_window_items: 'Window',
    stats_alert_relevant: 'Relevant',
    stats_alert_latest_content: 'Latest Capture',
    stats_alert_action: 'Recommended Action',
    stats_alert_action_check_source_rule: 'Check scrape rule',
    stats_alert_action_downgrade_source: 'Lower source priority',
    stats_alert_action_watch_source: 'Keep watching',
    stats_cluster_items: 'items',
    stats_cluster_sources: 'sources',
    stats_cluster_latest: 'Latest signal',
    stats_col_source: 'Source',
    stats_col_started: 'Started',
    stats_col_finished: 'Finished',
    stats_col_found: 'Found',
    stats_col_new: 'New',
    stats_col_attempted: 'Attempted',
    stats_col_success: 'Success',
    stats_col_failed: 'Failed',
    stats_col_stage: 'Stage',
    stats_col_matched: 'Matched',
    stats_col_deleted: 'Deleted',
    stats_col_model: 'Model',
    stats_col_status: 'Status',
    settings_title: 'Settings',
    settings_interval: 'Daily Scrape Hour',
    settings_interval_desc: 'Hour of day for automatic scraping (Shanghai time, 0–23)',
    settings_interval_unit: 'h',
    settings_ai_title: 'AI Analysis Settings',
    settings_ai_model: 'AI Model',
    settings_ai_model_desc: 'Qwen model name (e.g. qwen-plus, qwen-turbo)',
    settings_ai_key_status: 'API Key Status',
    settings_ai_key_set: '✅ Configured',
    settings_ai_key_unset: '❌ Not set (set QWEN_API_KEY env var)',
    settings_ai_auto: 'Auto-analyze after scrape',
    settings_ai_auto_desc: 'Automatically run AI analysis after each scrape',
    settings_theme: 'Theme',
    settings_theme_desc: 'Switch between light and dark interface themes',
    settings_theme_dark: 'Dark mode',
    btn_analyze: 'AI Analyze',
    btn_analyze_now: 'Analyze Now',
    btn_analyze_hint: 'Run AI interpretation on items still pending in the database without starting a new scrape',
    btn_analyzing: 'Analyzing...',
    btn_pipeline: 'Scrape + Analyze',
    topbar_ai_powered: 'AI-driven',
    topbar_ai_powered_en: 'Powered by AI',
    topbar_ai_badge_hint: 'This intelligence view is powered by automated collection, cleaning, and AI interpretation',
    topbar_auto_live: 'Auto-running',
    topbar_status_hint: 'The home view updates automatically as new collection and AI analysis results arrive',
    analyze_started: 'AI analysis job started',
    analyze_error: 'Failed to start AI analysis. Check API key.',
    ai_title_zh: 'Chinese Title',
    ai_title_en: 'Original Title',
    ai_summary: 'Core Summary',
    ai_insight: 'Business Insight',
    ai_pending: 'Pending',
    ai_done: 'Analyzed',
    ai_failed: 'Failed',
    scrape_started: 'Scrape job started. Refresh in a moment to see new results.',
    scrape_error: 'Failed to start scrape. Check server status.',
    total_items: 'items',
    page_of: 'of',
    page_page: 'pages',
    detail_source: 'Source',
    detail_published: 'Published',
    label_published_short: 'Published',
    label_captured_short: 'Captured',
    detail_type: 'IP Type',
    detail_analysis_depth: 'Analysis Depth',
    detail_link: 'Original Link',
    detail_btn: 'Read Original →',
    detail_btn_short: 'Original',
    detail_view_btn: 'View Details',
    hero_kicker: 'Overview',
    sidebar_section_label: 'Topic Navigation',
    hero_title: 'See the full European IP theater at a glance',
    hero_desc: 'Prioritize institutional, judicial, media and law-firm signals with a single-screen briefing built for fast executive awareness.',
    hero_scope: 'Jurisdiction',
    hero_focus: 'Focus',
    hero_mode: 'Mode',
    hero_mode_ai: 'AI Briefed',
    hero_mode_live: 'Live Signals',
    hero_top_source: 'Most Active Source',
    hero_top_type: 'Hottest IP Type',
    hero_source_mix: 'Main-board Source Mix',
    hero_source_policy: 'The homepage prioritizes core and stable sources. Watch-tier sources stay supplementary.',
    hero_ai_density: 'AI Coverage',
    hero_watch: 'Watch Items',
    hero_editorial_note: 'Track four high-signal source classes together: institutions, courts, specialist media, and leading firms.',
    hero_refresh: 'Last refresh',
    hero_authority: 'Authority Belt',
    hero_authority_desc: 'Compress institutions, courts and specialist media into one fast-scan signal strip.',
    hero_focus_note: 'Review institutions and courts first, then media and firms; the homepage prioritizes credibility and recency.',
    hero_overview_sources: 'Sources covered',
    hero_overview_samples: 'Items synthesized',
    priority_cover_note: 'Cover Note',
    priority_signal: 'Key Signal',
    priority_policy_note: 'The lead board prioritizes core and stable sources, with watch sources only supplementing edge signals.',
    news_card_brief: 'Quick Brief',
    block_bilingual_title: 'Title',
    block_core_points: 'Core Points',
    block_insight: 'Insight',
    block_original_link: 'Original Link',
    block_overview_summary: 'Situation Summary',
    block_overview_signals: 'Top Signals',
    block_overview_cross: 'Cross-currents',
    block_overview_implications: 'Business Implications',
    block_overview_watchlist: 'Watchlist',
    block_overview_basis: 'Generated From',
    block_representative_signal: 'Representative Item',
    block_key_moves: 'Core Moves',
    block_business_actions: 'Action Points',
    block_topic_points: 'Core Signals',
    block_topic_actions: 'Action Focus',
    overview_pending: 'Overview pending',
    section_priority: 'Briefing Lead',
    section_reports: 'Current Reports',
    section_reports_desc_home: 'The homepage starts with the current daily and weekly briefs in a folded view. The full set of 20 traceable items, recent runs, and archive history lives in Reports Center.',
    section_reports_desc_page: 'Start with the two current briefs in this window and their 20 traceable items, then move into the recent run of reports below.',
    section_today_published: 'Published Today',
    section_today_published_desc: 'Show only items whose original publish date falls today, so the real new arrivals are easy to scan first.',
    section_today_published_desc_fallback: 'No source items are dated today yet, so this panel falls back to high-value items captured today and already analyzed.',
    section_today_published_empty: 'No newly published items yet today.',
    section_today_published_count: 'published today',
    section_today_published_expand: 'Show more today',
    section_today_published_collapse: 'Collapse today list',
    section_europe_heat: 'Europe Heat Map',
    section_europe_heat_desc: 'Shows the 7-day pulse of European countries and regions mentioned in the current stream so it is easier to spot where activity is heating up.',
    section_europe_heat_recent: '7-day pulse',
    section_europe_heat_wide: 'Europe-wide',
    section_europe_heat_hotspots: 'Top hotspots',
    section_europe_heat_empty: 'No clear geographic hotspot is visible under the current filters yet.',
    section_europe_heat_click_hint: 'Click a country on the map or a hotspot on the right to open the related feed.',
    section_europe_heat_hover_count: 'items',
    section_europe_heat_country_feed: 'Country / Region Feed',
    section_europe_heat_country_desc: 'Recent items for this country or region under the current stream filters.',
    section_europe_heat_country_empty: 'There are no display-ready items for this country or region under the current filters yet.',
    section_europe_heat_member_eu: 'EU member',
    section_europe_heat_non_member_eu: 'Not in EU',
    section_europe_heat_member_epc: 'EPC member',
    section_europe_heat_non_member_epc: 'Not in EPC',
    section_europe_heat_member_upc: 'UPC member',
    section_europe_heat_non_member_upc: 'Not in UPC',
    section_europe_heat_primary_feed: 'Primary forum feed',
    section_europe_heat_related_feed: 'Related mentions',
    section_europe_heat_upc_overall: 'UPC-wide',
    section_europe_heat_upc_overall_desc: 'System-level UPC items such as rules, appointments, and statistics are grouped here instead of being forced into one country.',
    label_today_scraped: 'Captured today',
    today_published_state_captured: 'Captured today',
    section_latest_dynamics: 'Latest Signal Readout',
    section_latest_dynamics_desc: 'Scan the most actionable changes from the last 48 hours before moving into the full stream.',
    section_latest_dynamics_empty: 'No high-signal updates in the last 48 hours.',
    latest_dynamics_filter_all: 'All',
    latest_dynamics_filter_official: 'Official',
    latest_dynamics_filter_court: 'Court',
    latest_dynamics_filter_sep: 'SEP',
    latest_dynamics_filter_business: 'Business',
    section_reports_summary_briefs: 'current briefs',
    section_reports_summary_items: 'traceable items',
    section_reports_summary_split: 'Daily / Weekly',
    reports_open_center: 'Open Reports Center for full briefs',
    reports_open_center_short: 'Open full brief',
    reports_center_title: 'Reports Center',
    reports_center_desc: 'Organize the two current briefs, 20 traceable items, recent runs, and archive history into one continuous reporting flow.',
    reports_center_window: 'Current Window',
    reports_center_daily_mix: 'Daily Source Mix',
    reports_center_weekly_mix: 'Weekly Source Mix',
    reports_center_recent_count: 'Recent Runs',
    reports_center_archive_count: 'Archive Runs',
    reports_center_pending: 'Pending Analysis',
    reports_center_export_daily_pdf: 'Download daily PDF',
    reports_center_export_weekly_pdf: 'Download weekly PDF',
    reports_center_action_read: 'Read now',
    reports_center_action_export: 'Quick export',
    reports_center_open_daily: 'Open daily brief',
    reports_center_open_weekly: 'Open weekly brief',
    reports_center_daily_desc: 'Weighted toward same-day changes, institutional moves, and court signals.',
    reports_center_weekly_desc: 'Weighted toward weekly structure, policy shifts, and cross-source consensus.',
    reports_center_daily_compare: 'Daily Window Delta',
    reports_center_weekly_compare: 'Weekly Window Delta',
    report_compare_items: 'items',
    report_compare_sources: 'sources',
    report_compare_flat: 'Broadly flat versus the prior window',
    report_items_title: 'Report Items',
    report_items_desc: 'Up to 10 directly traceable source items behind the current brief.',
    report_items_count: 'key items',
    report_items_expand: 'Show remaining',
    report_items_collapse: 'Collapse extra items',
    report_items_hint: 'The first 5 items stay open for quick scanning.',
    report_items_preview_title: 'Representative Signals',
    report_items_preview_more: 'Open Reports Center for all 10 items',
    report_export_pdf_short: 'Download PDF',
    report_items_preview_title_daily: 'Daily Signals',
    report_items_preview_title_weekly: 'Weekly Signals',
    report_scope_items: 'items',
    report_scope_sources: 'sources',
    report_home_fold_open: 'Expand brief',
    report_home_fold_close: 'Collapse brief',
    report_home_fold_desc: 'Detail blocks stay collapsed on the homepage to keep the stream cleaner.',
    report_block_moves_daily: 'Today\'s Moves',
    report_block_moves_weekly: 'Weekly Structure',
    report_block_watch_daily: 'Next Watchpoints',
    report_block_watch_weekly: 'Next-Week Watchpoints',
    report_points_expand: 'Show all points',
    report_points_collapse: 'Collapse points',
    reports_nav_current: 'Current Briefs',
    reports_nav_recent: 'Recent Runs',
    reports_nav_archive: 'Archive Layer',
    reports_role_current: 'Lead Layer',
    reports_role_recent: 'Rolling View',
    reports_role_archive: 'Reference Layer',
    report_signal_strengthening: 'Signals strengthening',
    report_signal_easing: 'Signals easing',
    report_signal_steady: 'Broadly steady',
    reports_archive_title: 'Archive Layer',
    reports_archive_desc: 'Keep exported daily and weekly files as a reusable archive layer for review and forwarding.',
    reports_archive_empty: 'No exported report files yet.',
    reports_archive_daily: 'Daily Archive',
    reports_archive_weekly: 'Weekly Archive',
    reports_archive_size: 'File Size',
    reports_archive_open: 'Open',
    reports_archive_download: 'Download',
    reports_archive_open_brief: 'Open brief',
    reports_archive_download_file: 'Download file',
    reports_timeline_title: 'Recent Runs',
    reports_timeline_desc: 'Line up the latest daily and weekly exports so the recent cadence is easy to compare.',
    reports_timeline_empty: 'No recent reports available yet.',
    report_label_daily: 'Daily',
    report_label_weekly: 'Weekly',
    section_topics: 'Topic Briefs',
    section_actions: 'Action Layer',
    section_pulse: 'Pulse',
    section_watchlist: 'Source Watchlist',
    section_theaters: 'Topic Map',
    section_stream: 'Intel Stream',
    section_latest: 'Latest Moves',
    lane_core_kicker: 'Primary Signals',
    lane_core_title: 'Core Stream',
    lane_core_desc: 'Prioritize judgments, policy moves, official updates, and high-signal analysis.',
    lane_watch_kicker: 'Trend Watch',
    lane_watch_title: 'Watch Stream',
    lane_watch_desc: 'Keep worthwhile commentary in view without letting it dominate the main stream.',
    lane_calendar_kicker: 'Calendar',
    lane_calendar_title: 'Events & Notices',
    lane_calendar_desc: 'Meetings, events, and notices live here instead of crowding the main stream.',
    focus_mode_kicker: 'Focused View',
    focus_mode_title: 'Filtered stream first',
    focus_mode_desc: 'When you filter by patent, trademark, GI, source or keyword, the page now prioritizes the relevant intel stream first; global overview, reports and topic blocks stay collapsed until needed.',
    focus_mode_global_title: 'Global Support Modules',
    focus_mode_global_desc: 'Expand these only when you need the broader Europe-wide picture, reports, or topic briefs.',
    focus_mode_expand: 'Show Global Modules',
    focus_mode_collapse: 'Hide Global Modules',
    focus_mode_reset: 'Back to Overview',
    focus_mode_filters: 'Active Filters',
    focus_mode_results: 'Matches',
    focus_mode_sources: 'Sources',
    focus_mode_ai: 'AI Ready',
    focus_mode_ai_only: 'AI only',
    stream_must_read: 'Must Read',
    stream_must_read_desc: 'High-value items to review first',
    stream_scan: 'Rapid Scan',
    stream_scan_desc: 'Important but second-order updates',
    stream_background: 'Background Watch',
    stream_background_desc: 'Lower-urgency context and monitoring',
    stream_sort_note: 'Newest first',
    stream_group_today: 'Today',
    stream_group_yesterday: 'Yesterday',
    stream_group_this_week: 'Earlier This Week',
    stream_group_this_month: 'Earlier This Month',
    stream_group_undated: 'Undated',
    stream_group_items: 'items',
    stream_group_expand: 'Show remaining',
    stream_group_collapse: 'Collapse group',
    stream_group_browser_hint: 'Swipe to browse this archive lane',
    stream_group_open_modal: 'Open full group',
    chronology_modal_timeline_label: 'Timeline',
    chronology_modal_summary_range: 'Coverage',
    chronology_modal_summary_dates: 'Dates',
    chronology_modal_summary_items: 'Items',
    card_priority: 'Priority Read',
    card_latest: 'Latest Signals',
    card_sources: 'Heat Sources',
    card_main_sources: 'Main-board Sources',
    card_mix: 'Type Mix',
    card_empty: 'No signals available yet',
    report_daily: 'Daily Watch',
    report_weekly: 'Weekly Watch',
    topbar_sub_news: 'Start with the overview, published-today list, current briefs, and topic coverage before moving into the intel stream.',
    topbar_sub_reports: 'Start with the two current briefs and 20 traceable items, then move through recent runs and archive history.',
    topbar_sub_sources: 'Inspect which sources are truly active in the current window, and how strong their relevance and body coverage are.',
    topbar_sub_stats: 'Monitor scraping, quality passes, AI runs, and source alerts in one place.',
    topbar_sub_about: 'See the sentinel mission, source coverage, processing flow, and AI precision model.',
    topbar_sub_settings: 'Adjust scrape timing, AI model settings, and runtime controls.',
    topic_btn: 'Related News',
    topic_open: 'Open Topic',
    topic_back: 'Back to Intelligence',
    topic_related: 'Related Intel',
    topic_timeline: 'Topic Timeline',
    topic_timeline_desc: 'Recent topic signals ranked by strength',
    topic_latest_signal: 'Latest signal',
    topic_sep_actors: 'Key Actors',
    topic_sep_actors_desc: 'The companies, platforms, and institutions appearing most often in this long-window topic.',
    topic_sep_case_line: 'Case Line',
    topic_sep_case_line_desc: 'Sampled milestones across the standard-essential patents window since 2025.',
    topic_sep_signal_mix: 'Signal Mix',
    topic_sep_signal_mix_desc: 'Break the long-window topic into cases, policy moves, and licensing actions.',
    topic_sep_china_impact: 'China Impact',
    topic_sep_china_impact_desc: 'Translate the long-window topic into operating and compliance moves for Chinese companies in Europe.',
    topic_sep_china_focus: 'Priority Companies',
    topic_sep_china_related: 'China-linked',
    topic_sep_company_map: 'Company Linkage',
    topic_sep_company_map_desc: 'Connect priority companies, related nodes, and next actions so the China impact is easier to read.',
    topic_sep_company_risks: 'Main Risks',
    topic_sep_company_trend: 'Trend',
    topic_sep_company_conclusion: 'Conclusion',
    topic_sep_company_recent: 'Recent Node Shift',
    topic_sep_company_sources: 'Representative Sources',
    topic_sep_company_latest: 'Latest Update',
    topic_sep_company_source_quality: 'Source Trust',
    topic_sep_company_freshness: 'Signal Freshness',
    topic_sep_company_latest_signal: 'Latest Key Move',
    topic_sep_company_action_link: 'Linked Action',
    topic_sep_company_nodes: 'Related Nodes',
    topic_sep_company_node_groups: 'Node Groups',
    topic_sep_company_snapshot: 'Company Snapshot',
    topic_sep_company_timeline: 'Recent Timeline',
    topic_sep_company_latest_badge: 'Latest',
    topic_sep_company_recent_window: 'Recent',
    topic_sep_company_previous_window: 'Earlier',
    topic_sep_ai_analysis: 'SEP Standard-Essential Patents AI Analysis',
    topic_sep_ai_analysis_desc: 'Break the long-window sample down by time, signal type, leading forums, and evidence depth to surface the real direction of travel.',
    topic_sep_ai_monthly: 'Monthly Trend',
    topic_sep_ai_monthly_desc: 'A month-by-month view of standard-essential patent signal volume.',
    topic_sep_ai_mix: 'Signal Mix',
    topic_sep_ai_mix_desc: 'Compare the recent 120 days with the prior 120 days to see which line is heating up.',
    topic_sep_ai_forum: 'Leading Forums',
    topic_sep_ai_forum_desc: 'The most active litigation and policy arenas in the recent 120-day window.',
    topic_sep_ai_depth: 'Evidence Depth',
    topic_sep_ai_depth_desc: 'How much of this topic rests on full text, public preview, or summary-level inputs.',
    topic_sep_ai_insight_cards: 'AI Insight Cards',
    topic_sep_ai_insight_cards_desc: 'Compress structure, forum shift, China exposure, and evidence depth into directly readable judgment cards.',
    topic_sep_ai_judgments: 'AI Trend Judgments',
    topic_sep_ai_recent_total: 'Signals in 120d',
    topic_sep_ai_china_related: 'China-related',
    topic_sep_ai_dominant_signal: 'Leading Signal',
    topic_sep_ai_dominant_scope: 'Leading Forum',
    topic_sep_ai_recent_window: 'Recent 120d',
    topic_sep_ai_previous_window: 'Previous 120d',
    topic_sep_ai_share: 'Share',
    topic_sep_ai_card_insight: 'Insight',
    topic_sep_ai_card_action: 'Action',
    topic_sep_ai_card_evidence: 'Evidence',
    focus_mode_sep_ai_title: 'SEP AI Analysis is on the topic page',
    focus_mode_sep_ai_desc: 'You are in the standard-essential patents focused news stream. The charts, AI insight cards, and trend judgments live inside the SEP topic detail page.',
    focus_mode_sep_ai_open: 'Open SEP Topic AI Analysis',
    topic_sep_open_ai: 'Open Topic AI Analysis',
    topic_sep_ai_hint: 'Find the charts and insight cards right below the coverage block.',
    topic_sep_ai_preview_cards: 'Insight Cards',
    topic_sep_ai_preview_months: 'Trend Months',
    topic_sep_ai_preview_judgments: 'Judgments',
    topic_sep_coverage: 'Coverage Progress',
    topic_sep_coverage_desc: 'Show how far this long-window topic has already been backfilled and analyzed.',
    topic_sep_coverage_window: 'Window Start',
    topic_sep_coverage_total: 'Long-window Signals',
    topic_sep_coverage_iam: 'IAM Backfilled To',
    topic_sep_coverage_done: 'Analyzed',
    topic_expand_related_nodes: 'Show more nodes',
    topic_collapse_related_nodes: 'Collapse nodes',
    topic_open_source: 'Open source',
    topic_page_kicker: 'Topic Brief',
    topic_metric_sources: 'Sources',
    topic_metric_items: 'Signal set',
    topic_metric_window: 'Window',
    topic_long_window: 'Long-Window Topic',
    topic_long_window_hint: 'Tracked from 2025-01-01 with daily backfill',
    export_html: 'Export HTML',
    export_md: 'Export Markdown',
    export_pdf: 'Export PDF',
    export_done: 'Exported',
    export_failed: 'Export failed',
    risk_label: 'Risk',
    impact_label: 'Impact',
    urgency_label: 'Urgency',
    level_high: 'High',
    level_medium: 'Medium',
    level_low: 'Low',
    level_immediate: 'Immediate',
    level_soon: 'Soon',
    level_watch: 'Watch',
    label_showing: 'Showing',
    label_scope_all: 'All theaters',
    label_ai_ready: 'AI briefed',
    label_manual_refresh: 'Full Refresh',
    label_brief_summary: 'Situation Summary',
    label_brief_insight: 'Action Note',
    label_original_title: 'Original Title',
    label_translated_title: 'Chinese Title',
    label_latest_update: 'Latest update',
    label_next_window: 'Next window',
    label_article_count: 'Total signals',
    about_title: 'About This Intelligence View',
    about_subtitle: 'How the sentinel works: purpose, sources, processing flow, and output discipline.',
    about_purpose_kicker: 'Purpose',
    about_purpose_title: 'What this sentinel is built to solve',
    about_purpose_desc: 'This is not just a news aggregator. It is a continuous intelligence view for the European IP landscape, built to track high-signal updates from institutions, courts, specialist media, and law firms, then turn them into cleaner and more actionable intelligence.',
    about_status_kicker: 'Current Status',
    about_status_title: 'All items in the current window have been rerun through the new workflow',
    about_status_desc: 'Items in the active collection window have completed the upgraded path: collection, cleaning, AI editorial labeling, and four-block interpretation. Daily automation will keep using the same flow.',
    about_status_total: 'Items in window',
    about_status_structured: 'Editorial labels done',
    about_status_relevant: 'AI marked relevant',
    about_status_irrelevant: 'AI marked out-of-scope',
    about_workflow_kicker: 'Workflow',
    about_workflow_title: 'How the sentinel collects, processes, and presents intelligence',
    about_workflow_step1: '1. Collect',
    about_workflow_step1_desc: 'Pull titles, summaries, bodies, attachments, and original links from official, media, and law-firm sources within the active monitoring window.',
    about_workflow_step2: '2. Clean',
    about_workflow_step2_desc: 'Remove navigation pages, event notices, podcasts, roundup digests, and low-value items unrelated to European IP.',
    about_workflow_step3: '3. AI Editorial Labeling',
    about_workflow_step3_desc: 'AI first acts like an editor: relevance, jurisdiction, countries/regions, topic, document type, institutions, and confidence.',
    about_workflow_step4: '4. Four-Block Interpretation',
    about_workflow_step4_desc: 'Retained items are turned into a title, core points, insight, and the original link.',
    about_workflow_step5: '5. Classification & Display',
    about_workflow_step5_desc: 'Those structured results then feed the homepage, focused browsing, topic pages, and daily/weekly briefings.',
    about_sources_kicker: 'Sources',
    about_sources_title: 'What the sentinel monitors',
    about_sources_desc: 'Sources are grouped into official institutions, specialist media, and law firms. The list below highlights sources that produced items in the current window.',
    about_source_official: 'Official',
    about_source_media: 'Media',
    about_source_lawfirm: 'Law Firms',
    about_source_window: 'In window',
    about_source_relevant: 'Relevant',
    about_source_rich: 'Rich body',
    about_source_latest: 'Latest',
    about_method_kicker: 'AI Precision',
    about_method_title: 'How the AI layer stays as precise and stable as possible',
    about_method_intro: 'This intelligence view does not simply hand articles to AI for free-form summarization. It uses a chain of rule-based screening, AI editorial labeling, backend normalization, and quality guard checks to reduce drift and false positives.',
    about_method_note: 'AI is not the only judge. Source rules, date repair, topic write-back, quality guard runs, and source regression checks all participate in correction.',
    about_method_metric_ai_success: '24h AI success',
    about_method_metric_ai_success_desc: 'Completion success rate across AI batches in the last 24 hours',
    about_method_metric_quality_deleted: '24h quality cleanup',
    about_method_metric_quality_deleted_desc: 'Low-value items removed by the quality guard in the last 24 hours',
    about_method_metric_last_quality: 'Last quality run',
    about_method_metric_last_quality_desc: 'Most recent automatic quality-guard completion time',
    about_method_precision_title: 'Precision controls',
    about_method_precision_1: 'AI labels relevance, jurisdiction, topic, document type, and institutions before it writes any summary or insight.',
    about_method_precision_2: 'The analysis input prioritizes title, summary, body text, original link, and source-level hints, rather than guessing from headlines alone.',
    about_method_precision_3: 'Topics, scopes, and document types all use closed enums; when rule-based typing disagrees, the AI primary topic writes back the final classification.',
    about_method_precision_4: 'Source-level Europe filters, date repair, deduplication, and low-value blocking all reduce bad inputs before they reach the final display.',
    about_method_stability_title: 'Stability controls',
    about_method_stability_1: 'Every automated run follows the same standard path: collect, clean, repair dates, label, interpret, quality-check, then generate outputs.',
    about_method_stability_2: 'The backend normalizes AI output again, correcting illegal enums, empty lists, malformed payloads, and inconsistent fields before storage.',
    about_method_stability_3: 'When source content changes, body text is backfilled, or rules are updated, old AI results are reset and rerun so interpretation stays aligned.',
    about_method_stability_4: 'Quality guard runs and source regression checks continuously watch for noise, source drift, and weakly relevant items so old problems do not quietly return.',
    about_outputs_kicker: 'Standard Output',
    about_outputs_title: 'What each item ultimately produces',
    about_output_title: 'Title',
    about_output_core: 'Core points',
    about_output_insight: 'Insight',
    about_output_link: 'Original link',
    about_output_meta: 'Editorial labels',
    about_output_meta_desc: 'Relevance, jurisdiction, countries/regions, topic, document type, institutions, confidence',
    about_cta_sources: 'Open Sources',
    about_cta_back: 'Back to News',
  },
};

const t = (key) => (i18n[state.lang][key] || key);

function applyTheme(theme = state.theme) {
  const resolved = 'dark';
  state.theme = resolved;
  localStorage.setItem('pontnova_theme', resolved);
  document.documentElement.setAttribute('data-theme', resolved);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute('content', '#0b0b0b');
}

// ──────────────────────────────────────────────
// DOM Helpers
// ──────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

// ──────────────────────────────────────────────
// Toast Notifications
// ──────────────────────────────────────────────

function showToast(msg, type = 'default', duration = 3500) {
  const container = document.getElementById('toast-container');
  const toast = el('div', `toast ${type}`, `${getToastIcon(type)} ${msg}`);
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = '.25s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
function getToastIcon(type) {
  return { success: '✅', error: '❌', warning: '⚠️', default: 'ℹ️' }[type] || 'ℹ️';
}

function renderSourceHealthPill(source) {
  const itemCount = Number(source?.item_count || 0);
  const richCount = Number(source?.rich_count || 0);
  if (!itemCount) return '';
  const ratio = richCount / Math.max(itemCount, 1);
  const tone = ratio >= 0.8 ? 'good' : ratio >= 0.3 ? 'mixed' : 'soft';
  const label = ratio >= 0.8 ? t('source_quality_full') : ratio >= 0.3 ? t('source_quality_partial') : t('source_quality_summary');
  return `<span class="source-health-pill ${tone}">${escapeHtml(label)}</span>`;
}

function renderSourceRelevancePill(source) {
  const itemCount = Number(source?.item_count || 0);
  const relevantCount = Number(source?.relevant_count || 0);
  if (!itemCount) return '';
  const ratio = relevantCount / Math.max(itemCount, 1);
  const tone = ratio >= 0.8 ? 'good' : ratio >= 0.45 ? 'mixed' : 'soft';
  const label = ratio >= 0.8 ? t('source_signal_strong') : ratio >= 0.45 ? t('source_signal_mixed') : t('source_signal_watch');
  return `<span class="source-health-pill ${tone}">${escapeHtml(label)}</span>`;
}

function getSourceById(sourceId) {
  if (!sourceId || !Array.isArray(state.sources)) return null;
  return state.sources.find((source) => source.id === sourceId) || null;
}

function getSourceQualityTier(source) {
  if (!source) return 'stable';
  if (source.quality_tier) return source.quality_tier;
  const itemCount = Number(source?.item_count || 0);
  const relevantCount = Number(source?.relevant_count || 0);
  const richCount = Number(source?.rich_count || 0);
  const category = source?.category || '';
  const relevantRatio = itemCount ? relevantCount / itemCount : 0;
  const richRatio = itemCount ? richCount / itemCount : 0;

  if (category === 'official') return 'core';
  if (itemCount >= 4 && relevantRatio >= 0.75 && richRatio >= 0.25) return 'core';
  if (itemCount >= 2 && relevantRatio >= 0.55 && richRatio >= 0.08) return 'stable';
  if (itemCount === 1 && relevantRatio >= 1 && richRatio >= 0.5) return 'stable';
  return 'watch';
}

function getSourceTierRank(source) {
  const tier = getSourceQualityTier(source);
  return { core: 0, stable: 1, watch: 2 }[tier] ?? 1;
}

function renderSourceTierPill(source) {
  const tier = getSourceQualityTier(source);
  const tone = tier === 'core' ? 'good' : tier === 'stable' ? 'mixed' : 'soft';
  const labelMap = {
    core: t('source_tier_core'),
    stable: t('source_tier_stable'),
    watch: t('source_tier_watch'),
  };
  return `<span class="source-health-pill ${tone}">${escapeHtml(labelMap[tier] || labelMap.stable)}</span>`;
}

function renderSourceTierSummary(data) {
  const core = Number(data?.source_tier_core || 0);
  const stable = Number(data?.source_tier_stable || 0);
  const watch = Number(data?.source_tier_watch || 0);
  return `
    <span class="source-tier-inline good">${t('source_tier_core')} ${core}</span>
    <span class="source-tier-inline mixed">${t('source_tier_stable')} ${stable}</span>
    <span class="source-tier-inline soft">${t('source_tier_watch')} ${watch}</span>
  `;
}

function formatSignedDelta(value) {
  const number = Number(value || 0);
  if (!number) return '0';
  return number > 0 ? `+${number}` : `${number}`;
}

function formatTierTriplet(core, stable, watch) {
  return `${Number(core || 0)} / ${Number(stable || 0)} / ${Number(watch || 0)}`;
}

function getTierTripletCaption() {
  return state.lang === 'zh' ? '核心 / 稳定 / 观察' : 'Core / Stable / Watch';
}

function renderReportComparison(report, reportType, compact = false) {
  if (!report) return '';
  const label = report.comparison_label_zh || (reportType === 'daily' ? t('reports_center_daily_compare') : t('reports_center_weekly_compare'));
  const itemDelta = Number(report.comparison_item_delta || 0);
  const sourceDelta = Number(report.comparison_source_delta || 0);
  if (!itemDelta && !sourceDelta) {
    return compact
      ? `<span class="report-compare-chip neutral">${escapeHtml(label)} · ${escapeHtml(t('report_compare_flat'))}</span>`
      : `<div class="briefing-report-compare neutral"><span class="briefing-report-compare-label">${escapeHtml(label)}</span><strong>${escapeHtml(t('report_compare_flat'))}</strong></div>`;
  }
  const details = `${formatSignedDelta(itemDelta)} ${t('report_compare_items')} · ${formatSignedDelta(sourceDelta)} ${t('report_compare_sources')}`;
  const tone = itemDelta >= 0 ? 'positive' : 'negative';
  return compact
    ? `<span class="report-compare-chip ${tone}">${escapeHtml(label)} · ${escapeHtml(details)}</span>`
    : `<div class="briefing-report-compare ${tone}"><span class="briefing-report-compare-label">${escapeHtml(label)}</span><strong>${escapeHtml(details)}</strong></div>`;
}

function renderReportSignalPill(report) {
  if (!report) return '';
  const signal = (state.lang === 'zh' ? report.comparison_signal_zh : report.comparison_signal_en) || '';
  const itemDelta = Number(report.comparison_item_delta || 0);
  const sourceDelta = Number(report.comparison_source_delta || 0);
  const tone = itemDelta >= 5 || sourceDelta >= 2 ? 'positive' : (itemDelta <= -5 || sourceDelta <= -2 ? 'negative' : 'neutral');
  if (!signal) return '';
  return `<span class="report-signal-pill ${tone}">${escapeHtml(signal)}</span>`;
}

function renderReportDetailItems(report) {
  const items = Array.isArray(report?.report_items) ? report.report_items.slice(0, 10) : [];
  if (!items.length) return '';
  const primaryItems = items.slice(0, 5);
  const secondaryItems = items.slice(5);
  const renderItem = (item, index) => {
    const title = (state.lang === 'zh' && item.title_zh) ? item.title_zh : (item.title || item.title_zh || '—');
    const titleEn = item.title && item.title !== title ? item.title : '';
          const corePoints = resolvePointList(item.core_points_zh, item.summary_zh || '', 4, 126);
          const insightPoints = resolvePointList(item.insight_points_zh, item.insight_zh || '', 3, 118);
    return `
      <article class="report-detail-item">
        <div class="report-detail-topline">
          <div class="report-detail-index">${String(index + 1).padStart(2, '0')}</div>
          <div class="report-detail-meta">
            <span class="source-badge ${(item.category || '') === 'official' ? 'official' : ((item.category || '') === 'media' ? 'media' : 'lawfirm')}">${escapeHtml(compactSourceName(item.source_name || '') || '—')}</span>
            <span class="ip-badge ${item.ip_type || 'general'}">${getIpTypeLabel(item.ip_type || 'general')}</span>
            ${renderGeoBadges(item, true)}
            ${renderAnalysisDepthBadge(item, true)}
            <span class="news-card-date">${escapeHtml(buildPrimaryDateLabel(item))}</span>
          </div>
          <a href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener" class="btn btn-secondary report-detail-link">${t('detail_btn')}</a>
        </div>
        <h4 class="report-detail-title">${escapeHtml(title)}</h4>
        ${titleEn ? `<div class="report-detail-subtitle">${escapeHtml(titleEn)}</div>` : ''}
          <div class="report-detail-grid">
            <div class="intel-block compact">
              <div class="intel-block-label">${t('block_core_points')}</div>
              ${renderExpandablePointList(corePoints, 'intel-points compact', 3)}
            </div>
            <div class="intel-block compact insight">
              <div class="intel-block-label">${t('block_insight')}</div>
              ${renderExpandablePointList(insightPoints, 'intel-points compact', 2)}
            </div>
          </div>
        </article>
      `;
  };
  return `
    <div class="briefing-report-detail-shell">
      <div class="section-heading-row report-detail-heading">
        <div>
          <div class="section-kicker">${t('report_items_title')}</div>
          <h3 class="section-title">${t('report_items_title')}</h3>
        </div>
        <div class="section-meta section-meta-column">
          <span>${t('report_items_desc')}</span>
          <span>${items.length} ${t('report_items_count')}</span>
          ${secondaryItems.length ? `<span class="report-detail-hint">${t('report_items_hint')}</span>` : ''}
        </div>
      </div>
      <div class="report-detail-list">
        ${primaryItems.map(renderItem).join('')}
        ${secondaryItems.length ? `
          <details class="report-detail-more">
            <summary class="report-detail-summary">
              <span class="report-detail-summary-closed">${t('report_items_expand')} ${secondaryItems.length} ${t('report_items_count')}</span>
              <span class="report-detail-summary-open">${t('report_items_collapse')}</span>
            </summary>
            <div class="report-detail-list report-detail-list-extra">
              ${secondaryItems.map((item, index) => renderItem(item, index + primaryItems.length)).join('')}
            </div>
          </details>
        ` : ''}
      </div>
    </div>
  `;
}

function getReportCardLabels(reportType) {
  if (reportType === 'weekly') {
    return {
      previewTitle: t('report_items_preview_title_weekly'),
      keyMoves: t('report_block_moves_weekly'),
      watchlist: t('report_block_watch_weekly'),
      previewLimit: 3,
    };
  }
  return {
    previewTitle: t('report_items_preview_title_daily'),
    keyMoves: t('report_block_moves_daily'),
    watchlist: t('report_block_watch_daily'),
    previewLimit: 2,
  };
}

function buildReportPreviewSummary(report, visibleCount) {
  const total = Math.max(
    0,
    Number(
      report?.report_item_count
      || (Array.isArray(report?.report_items) ? report.report_items.length : 0)
      || 0
    )
  );
  if (!total) return '';
  const shown = Math.max(1, Math.min(Number(visibleCount || 0), total));
  if (state.lang === 'zh') {
    if (total <= shown) return `本期共 ${total} 条明细。`;
    return `本期共 ${total} 条明细，首页先看 ${shown} 条。`;
  }
  if (total <= shown) return `${total} items in this brief.`;
  return `${total} items in this brief; ${shown} shown here first.`;
}

function renderReportScope(report) {
  if (!report) return '';
  const itemCount = Math.max(
    0,
    Number(
      report.report_item_count
      || report.item_count
      || (Array.isArray(report.report_items) ? report.report_items.length : 0)
      || 0
    )
  );
  const sourceCount = Math.max(0, Number(report.source_count || 0));
  return `
    <div class="briefing-report-scope">
      <span class="briefing-report-scope-chip">${itemCount} ${t('report_scope_items')}</span>
      <span class="briefing-report-scope-chip">${sourceCount} ${t('report_scope_sources')}</span>
      <span class="briefing-report-scope-tier" title="${escapeHtml(t('source_tier_summary'))}">${renderSourceTierSummary(report)}</span>
    </div>
  `;
}

function renderReportPreviewItems(report, reportType, limit = 2) {
  const items = Array.isArray(report?.report_items) ? report.report_items.slice(0, limit) : [];
  if (!items.length) return '';
  const labels = getReportCardLabels(reportType);
  const previewSummary = buildReportPreviewSummary(report, items.length);
  return `
    <div class="briefing-report-preview-shell">
      <div class="intel-block-label">${labels.previewTitle}</div>
      <div class="briefing-report-preview-list">
        ${items.map((item) => {
          const title = (state.lang === 'zh' && item.title_zh) ? item.title_zh : (item.title || item.title_zh || '—');
          return `
            <a class="briefing-report-preview-item" href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener">
              <span class="briefing-report-preview-topline">
                <span class="source-badge ${(item.category || '') === 'official' ? 'official' : ((item.category || '') === 'media' ? 'media' : 'lawfirm')}">${escapeHtml(compactSourceName(item.source_name || '') || '—')}</span>
                <span class="ip-badge ${item.ip_type || 'general'}">${getIpTypeLabel(item.ip_type || 'general')}</span>
                ${renderGeoBadges(item, true, 1)}
                ${renderAnalysisDepthBadge(item, true)}
              </span>
              <strong class="briefing-report-preview-title">${escapeHtml(truncateText(title, 72))}</strong>
              <span class="briefing-report-preview-meta">${escapeHtml(buildPrimaryDateLabel(item))}</span>
            </a>
          `;
        }).join('')}
      </div>
      <div class="briefing-report-preview-foot">
        ${previewSummary ? `<span class="briefing-report-preview-summary">${escapeHtml(previewSummary)}</span>` : ''}
      </div>
    </div>
  `;
}

function isTodayPublishedItem(item) {
  const raw = item?.published_at || item?.scraped_at || '';
  if (!raw) return false;
  const datePart = String(raw).slice(0, 10);
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return datePart === `${yyyy}-${mm}-${dd}`;
}

function isTodayScrapedItem(item) {
  const raw = item?.scraped_at || '';
  if (!raw) return false;
  const datePart = String(raw).slice(0, 10);
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return datePart === `${yyyy}-${mm}-${dd}`;
}

function isFreshTodayCapture(item, maxAgeDays = 7) {
  const raw = item?.published_at || item?.scraped_at || '';
  if (!raw) return true;
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return true;
  const ageMs = Date.now() - parsed;
  return ageMs <= maxAgeDays * 24 * 60 * 60 * 1000;
}

function sortTodayPublishedItems(items) {
  return [...(items || [])].sort((a, b) => {
    const aTime = Date.parse(a?.published_at || a?.scraped_at || '') || 0;
    const bTime = Date.parse(b?.published_at || b?.scraped_at || '') || 0;
    if (bTime !== aTime) return bTime - aTime;
    return getIntelPriorityScore(b) - getIntelPriorityScore(a);
  });
}

function isHighValueFreshItem(item) {
  if (!item) return false;
  if (item.ai_is_relevant !== 1) return false;
  const title = `${item.title_zh || ''} ${item.title || ''}`.toLowerCase();
  const summary = `${item.ai_summary_zh || ''} ${item.ai_insight_zh || ''} ${item.summary || ''}`.toLowerCase();
  const docType = String(item.ai_document_type || '').toLowerCase();
  const editorialLane = getEditorialLane(item);
  const topic = String(item.ai_topic_primary || '').toLowerCase();
  const category = String(item.category || '').toLowerCase();

  if (/\\b(about|contact|terms|privacy|cookies|accessibility|editorial board|submit|advertise)\\b/i.test(title)) return false;
  if (/(conference|forum|webinar|podcast|event|rescheduled|weekly|miscellany)/i.test(title)) return false;
  if (/(tarifs?|fees?|formalit|praises? .* team|record london year)/i.test(title)) return false;
  if (editorialLane === 'calendar' || docType === 'event_notice') return false;
  if (docType === 'market_commentary' && !['patent', 'sep', 'trademark', 'copyright'].includes(topic)) return false;
  if (topic === 'general' && category !== 'official' && !['judgment', 'policy_update', 'enforcement_action'].includes(docType)) return false;
  if (category === 'official' && /(employment|inclusive|forum|tarifs?|formalit)/i.test(`${title} ${summary}`)) return false;

  return true;
}

function isHighValueTodayPublishedItem(item) {
  return isTodayPublishedItem(item) && isHighValueFreshItem(item);
}

function isHighValueTodayCapturedItem(item) {
  return isTodayScrapedItem(item) && isHighValueFreshItem(item) && isFreshTodayCapture(item);
}

function renderTodayPublishedSection(items, statsData = null) {
  const todayPublishedItems = sortTodayPublishedItems((items || []).filter(isHighValueTodayPublishedItem));
  const todayCapturedItems = sortTodayPublishedItems(
    (items || []).filter((item) => isHighValueTodayCapturedItem(item) && !isTodayPublishedItem(item))
  );
  const displayMode = todayPublishedItems.length ? 'published' : (todayCapturedItems.length ? 'captured' : 'empty');
  const activeItems = displayMode === 'published' ? todayPublishedItems : todayCapturedItems;
  const visibleItems = activeItems.slice(0, 6);
  const overflowItems = activeItems.slice(6);
  const scrapedCount = Number(statsData?.today_items || 0) || sortTodayPublishedItems((items || []).filter(isTodayScrapedItem)).length;
  const section = el('section', 'today-published-section');
  section.innerHTML = `
    <div class="section-heading-row">
      <div>
        <div class="section-kicker">${t('section_today_published')}</div>
        <h2 class="section-title">${t('section_today_published')}</h2>
      </div>
      <div class="section-meta section-meta-column">
        <span>${displayMode === 'captured' ? t('section_today_published_desc_fallback') : t('section_today_published_desc')}</span>
        <div class="today-published-meta-pills">
          <span class="section-search-pill">${t('section_today_published')} ${todayPublishedItems.length}</span>
          <span class="section-search-pill">${t('label_today_scraped')} ${scrapedCount}</span>
        </div>
      </div>
    </div>
	    ${activeItems.length ? `
	      <div class="today-published-list">
	        ${visibleItems.map((item) => renderTodayPublishedCard(item, displayMode)).join('')}
	        ${overflowItems.length ? `
	          <details class="today-published-more">
	            <summary class="report-detail-summary">
	              <span class="report-detail-summary-closed">${displayMode === 'captured' ? `${t('label_today_scraped')} +${overflowItems.length}` : `${t('section_today_published_expand')} ${overflowItems.length} ${t('section_today_published_count')}`}</span>
	              <span class="report-detail-summary-open">${t('section_today_published_collapse')}</span>
	            </summary>
	            <div class="today-published-list today-published-list-extra">
	              ${overflowItems.map((item) => renderTodayPublishedCard(item, displayMode)).join('')}
	            </div>
	          </details>
	        ` : ''}
	      </div>
	    ` : `<div class="mini-empty">${t('section_today_published_empty')}</div>`}
	  `;
  return section;
}

function renderTodayPublishedCard(item, mode = 'published') {
  const title = (state.lang === 'zh' && item.title_zh) ? item.title_zh : (item.title || item.title_zh || '—');
  const subtitle = item.title && item.title !== title ? item.title : '';
  const summary = (state.lang === 'zh' ? item.ai_summary_zh : '') || item.summary || item.summary_zh || '';
  const insight = item.ai_insight_zh || '';
  const fallbackSummary = buildFallbackBrief(item, 'summary');
  const fallbackInsight = buildFallbackBrief(item, 'signal');
  const corePoints = resolvePointList(item.ai_core_points_zh, summary || fallbackSummary, 2, 92);
  const insightPoints = resolvePointList(item.ai_insight_points_zh, insight || fallbackInsight, 2, 86);
  return `
    <a class="today-published-item" href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener">
      <div class="today-published-topline">
        <span class="source-badge ${(item.category || '') === 'official' ? 'official' : ((item.category || '') === 'media' ? 'media' : 'lawfirm')}">${escapeHtml(compactSourceName(item.source_name || '') || '—')}</span>
        <span class="ip-badge ${item.ip_type || 'general'}">${getIpTypeLabel(item.ip_type || 'general')}</span>
        ${renderGeoBadges(item, true, 1)}
        ${renderAnalysisDepthBadge(item, true)}
        ${mode === 'captured' ? `<span class="today-published-state">${t('today_published_state_captured')}</span>` : ''}
        <span class="today-published-date">${escapeHtml(buildPrimaryDateLabel(item))}</span>
      </div>
      <strong class="today-published-title">${escapeHtml(truncateText(title, 92))}</strong>
      ${subtitle ? `<div class="today-published-subtitle">${escapeHtml(truncateText(subtitle, 92))}</div>` : ''}
      <div class="intel-block compact today-published-block">
        <div class="intel-block-label">${t('block_core_points')}</div>
        ${renderPointList(corePoints, 'intel-points compact')}
      </div>
      <div class="intel-block compact insight today-published-block">
        <div class="intel-block-label">${t('block_insight')}</div>
        ${renderPointList(insightPoints, 'intel-points compact')}
      </div>
    </a>
  `;
}

// ──────────────────────────────────────────────
// API Calls
// ──────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  if (STATIC_MODE) {
    return staticApiFetch(path, options);
  }
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

function getStatsRefreshToken(stats) {
  if (!stats) return '';
  return [
    stats.last_scrape_time || '',
    stats.last_analyze_time || '',
    stats.last_quality_guard_time || '',
    stats.total_items || 0,
    stats.ai_analyzed || 0,
  ].join('|');
}

function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function downloadBase64File(filename, base64Content, mimeType = 'application/octet-stream') {
  const binary = atob(base64Content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

// ──────────────────────────────────────────────
// Language (currently fixed to zh)
// ──────────────────────────────────────────────

function setLang(lang) {
  state.lang = DEFAULT_LANG;
  localStorage.setItem('pontnova_lang', DEFAULT_LANG);
  $$('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === DEFAULT_LANG));
  renderApp();
}

// ──────────────────────────────────────────────
// Navigation
// ──────────────────────────────────────────────

function navigate(page, ipType = null) {
  state.currentPage = page;
  state.pagination.page = 1;
  if (page === 'news') state.focusViewExpanded = false;
  if (page !== 'topic') state.pendingTopicScrollId = '';
  if (ipType) {
    state.filters.ip_type = ipType;
  }
  if (page !== 'topic') {
    state.currentTopicId = '';
    state.currentTopicBrief = null;
    state.currentTopicItems = [];
  }
  $$('.sidebar-nav-item').forEach(item => {
    item.classList.toggle('active',
      item.dataset.page === page &&
      (!item.dataset.iptype || item.dataset.iptype === state.filters.ip_type)
    );
  });
  renderApp();
}

function navigateToTopic(topicId, scrollTarget = '') {
  state.currentPage = 'topic';
  state.currentTopicId = topicId;
  state.currentTopicBrief = null;
  state.currentTopicItems = [];
  state.pendingTopicScrollId = scrollTarget || '';
  renderApp();
}

function scrollWithinContent(target, offset = 18) {
  if (!target) return;
  const scroller = document.querySelector('.content-area');
  if (!scroller) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const targetTop = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - offset;
  scroller.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
}

function scrollToReportsSection(anchor) {
  updateReportsNavState(anchor);
  const sectionMap = {
    current: 'reports-current-section',
    recent: 'reports-recent-section',
    archive: 'reports-archive-section',
  };
  const target = document.getElementById(sectionMap[anchor] || '');
  if (!target) return;
  scrollWithinContent(target, 18);
}

function scrollToReportCard(reportType) {
  updateReportsNavState('current');
  const targetId = reportType === 'weekly'
    ? 'report-card-weekly'
    : reportType === 'audio'
      ? 'report-card-audio'
      : 'report-card-daily';
  const target = document.getElementById(targetId);
  if (!target) {
    scrollToReportsSection('current');
    return;
  }
  scrollWithinContent(target, 24);
  target.classList.add('briefing-report-card-highlight');
  window.setTimeout(() => target.classList.remove('briefing-report-card-highlight'), 1600);
}

function updateReportsNavState(anchor = 'current') {
  document.querySelectorAll('.reports-nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.reportAnchor === anchor);
  });
}

function syncReportsNavByScroll() {
  if (state.currentPage !== 'reports') return;
  const scroller = document.querySelector('.content-area');
  if (!scroller) return;
  const anchors = [
    ['current', 'reports-current-section'],
    ['recent', 'reports-recent-section'],
    ['archive', 'reports-archive-section'],
  ];
  const scrollerTop = scroller.getBoundingClientRect().top;
  let activeAnchor = 'current';
  let smallestOffset = Number.POSITIVE_INFINITY;
  anchors.forEach(([anchor, id]) => {
    const section = document.getElementById(id);
    if (!section) return;
    const offset = Math.abs(section.getBoundingClientRect().top - scrollerTop - 24);
    if (section.getBoundingClientRect().top - scrollerTop <= 96 && offset < smallestOffset) {
      smallestOffset = offset;
      activeAnchor = anchor;
    }
  });
  updateReportsNavState(activeAnchor);
}

// ──────────────────────────────────────────────
// Render App Shell
// ──────────────────────────────────────────────

function renderApp() {
  applyTheme(state.theme);
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(renderLayout());
  attachEvents();
  syncContentFrameGeometry();
  renderMainContent();
}

function renderLayout() {
  const layout = el('div', 'app-layout');
  layout.appendChild(renderSidebar());
  const main = el('div', 'main-content');
  main.appendChild(renderTopbar());
  main.appendChild(renderFilterBar());
  const content = el('div', 'content-area', '<div id="page-content"></div>');
  main.appendChild(content);
  main.appendChild(renderStatusBar());
  layout.appendChild(main);
  layout.insertAdjacentHTML('beforeend', '<div class="toast-container" id="toast-container"></div>');
  layout.insertAdjacentHTML('beforeend', '<div id="modal-root"></div>');
  return layout;
}

function renderSidebar() {
  const sidebar = el('div', 'sidebar', `
    <div class="sidebar-logo">
      <div class="logo-mark">
        <div class="logo-copy">
          <div class="logo-text-sub">${t('brand_sub')}</div>
          <div class="logo-text-main">${t('brand_title')}</div>
          <div class="logo-text-rule"></div>
          <div class="logo-text-tagline">${t('tagline')}</div>
        </div>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">${t('sidebar_section_label')}</div>
      <div class="ip-type-nav">
        ${renderNavItem('news', 'ALL', t('nav_news'), 'all')}
        ${renderNavItem('news', 'P', t('nav_patent'), 'patent')}
        ${renderNavItem('news', 'TM', t('nav_trademark'), 'trademark')}
        ${renderNavItem('news', 'D', t('nav_design'), 'design')}
        ${renderNavItem('news', 'C', t('nav_copyright'), 'copyright')}
        ${renderNavItem('news', 'DP', t('nav_data'), 'data')}
        ${renderNavItem('news', 'SEP', t('nav_sep'), 'sep')}
        ${renderNavItem('news', 'GI', t('nav_gi'), 'gi')}
        ${renderNavItem('news', 'IP', t('nav_general'), 'general')}
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <div class="sidebar-section">
      <div class="ip-type-nav">
        ${renderNavItem('reports', 'REP', t('nav_reports'))}
        ${renderNavItem('sources', 'SRC', t('nav_sources'))}
        ${renderNavItem('about', 'INFO', t('nav_about'))}
      </div>
    </div>
  `);
  return sidebar;
}

function renderNavItem(page, icon, label, ipType = null) {
  const isActive = state.currentPage === page &&
    (!ipType || state.filters.ip_type === ipType) &&
    (ipType !== null || state.currentPage === page);
  const activeClass = isActive ? ' active' : '';
  const dataIpType = ipType ? ` data-iptype="${ipType}"` : '';
  return `
    <button class="sidebar-nav-item${activeClass}" data-page="${page}"${dataIpType}>
      <span class="nav-icon">${icon}</span>
      ${label}
    </button>
  `;
}

function renderTopbar() {
  const topicLabel = state.currentPage === 'topic'
    ? (state.currentTopicBrief?.topic_name_zh || state.currentTopicBrief?.headline_zh || t('section_topics'))
    : '';
  const topicSub = state.currentPage === 'topic'
    ? truncateText(state.currentTopicBrief?.summary_zh || t('hero_desc'), 68)
    : '';
  const pageSubtitleRaw = state.currentPage === 'news'
    ? t('topbar_sub_news')
    : state.currentPage === 'reports'
      ? t('topbar_sub_reports')
    : state.currentPage === 'sources'
      ? t('topbar_sub_sources')
      : state.currentPage === 'stats'
        ? t('topbar_sub_stats')
        : state.currentPage === 'about'
          ? t('topbar_sub_about')
          : state.currentPage === 'settings'
            ? t('topbar_sub_settings')
            : t('hero_desc');
  const pageSubtitle = truncateText(pageSubtitleRaw, 68);
  const lastRefresh = formatDateTimeLabel(state.stats?.last_analyze_time || state.stats?.last_scrape_time || '');
  const nextWindowRaw = state.stats?.next_scrape || '—';
  const nextWindow = nextWindowRaw === '—' ? '—' : nextWindowRaw.split(' ').slice(1).join(' ');
  return el('div', 'topbar', `
    <div class="topbar-title">
      ${state.currentPage === 'news' ? t('hero_kicker') : ''}
      ${state.currentPage === 'reports' ? t('nav_reports') : ''}
      ${state.currentPage === 'sources' ? t('nav_sources') : ''}
      ${state.currentPage === 'about' ? t('about_title') : ''}
      ${state.currentPage === 'topic' ? topicLabel : ''}
      <span>${state.currentPage === 'topic' ? topicSub : pageSubtitle}</span>
    </div>
    <div class="search-wrapper" id="search-wrapper"
         style="${state.currentPage !== 'news' ? 'display:none' : ''}">
      <div class="topbar-search-shell">
        <span class="search-icon">⌕</span>
        <input type="text" class="search-input" id="search-input"
               placeholder="${t('search_placeholder')}"
               value="${state.filters.q}">
      </div>
    </div>
    <div class="topbar-actions">
      <div class="topbar-status-group" title="${t('topbar_status_hint')}" aria-label="${t('topbar_status_hint')}">
        <span class="topbar-status-chip topbar-status-live">
          <span class="topbar-status-dot"></span>
          <span>${t('topbar_auto_live')}</span>
        </span>
        <span class="topbar-status-chip">
          <strong>${t('hero_refresh')}</strong>
          <span>${lastRefresh}</span>
        </span>
        <span class="topbar-status-chip">
          <strong>${t('label_next_window')}</strong>
          <span>${nextWindow}</span>
        </span>
      </div>
      <span class="topbar-ai-badge" title="${t('topbar_ai_badge_hint')}" aria-label="${t('topbar_ai_badge_hint')}">
        <span class="topbar-ai-label">${t('topbar_ai_powered')}</span>
        <span class="topbar-ai-sub">${t('topbar_ai_powered_en')}</span>
      </span>
    </div>
  `);
}

function renderFilterBar() {
  if (state.currentPage !== 'news') {
    return el('div', 'filter-bar hidden');
  }

  const ipTypes = [
    ['all', t('filter_all')],
    ['patent', t('filter_patent')],
    ['trademark', t('filter_trademark')],
    ['design', t('filter_design')],
    ['copyright', t('filter_copyright')],
    ['data', t('filter_data')],
    ['sep', t('filter_sep')],
    ['gi', t('filter_gi')],
    ['general', t('filter_general')],
  ];

  const catTypes = [
    ['all', t('filter_all')],
    ['official', t('filter_official')],
    ['media', t('filter_media')],
    ['lawfirm', t('filter_lawfirm')],
  ];

  const laneTypes = [
    ['all', t('filter_all')],
    ['core', t('filter_lane_core')],
    ['watch', t('filter_lane_watch')],
    ['calendar', t('filter_lane_calendar')],
  ];

  const scopeTypes = [
    ['eu', t('filter_scope_eu')],
    ['intl', t('filter_scope_intl')],
    ['uk', t('filter_scope_uk')],
    ['de', t('filter_scope_de')],
    ['fr', t('filter_scope_fr')],
    ['benelux', t('filter_scope_benelux')],
    ['scandinavia', t('filter_scope_scandinavia')],
    ['all', t('filter_all')],
  ];

  const typeChips = ipTypes.map(([val, label]) =>
    `<button class="filter-chip ${val} ${state.filters.ip_type === val ? 'active' : ''}"
             data-filter="ip_type" data-value="${val}">${label}</button>`
  ).join('');

  const catChips = catTypes.map(([val, label]) =>
    `<button class="filter-chip ${state.filters.category === val ? 'active' : ''}"
             data-filter="category" data-value="${val}">${label}</button>`
  ).join('');

  const laneChips = laneTypes.map(([val, label]) =>
    `<button class="filter-chip ${state.filters.editorial_lane === val ? 'active' : ''}"
             data-filter="editorial_lane" data-value="${val}">${label}</button>`
  ).join('');

  const aiChip = `<button class="filter-chip ai-chip ${state.filters.has_ai ? 'active' : ''}"
    data-filter="has_ai" data-value="toggle">${t('filter_has_ai')}</button>`;

  return el('div', 'filter-bar', `
    <div class="filter-group">
      <span class="filter-label">IP</span>
      ${typeChips}
    </div>
    <div class="filter-group">
      <span class="filter-label">${state.lang === 'zh' ? '来源' : 'From'}</span>
      ${catChips}
    </div>
    <div class="filter-group">
      <span class="filter-label">${t('filter_lane')}</span>
      ${laneChips}
    </div>
    <div class="filter-group">
      <span class="filter-label">${t('filter_scope')}</span>
      ${scopeTypes.map(([val, label]) => `
        <button class="filter-chip scope-chip ${state.filters.scope === val ? 'active' : ''}"
                data-filter="scope" data-value="${val}">${label}</button>
      `).join('')}
    </div>
    <div class="filter-group filter-group-end">
      ${aiChip}
    </div>
  `);
}

function renderStatusBar() {
  const stats = state.stats;
  return el('div', 'statusbar', `
    <div class="statusbar-item">
      <div class="status-dot ${state.scraping ? 'syncing' : 'active'}"></div>
      ${state.scraping ? (state.lang === 'zh' ? '全源刷新执行中' : 'Full refresh running') : (state.lang === 'zh' ? '系统在线' : 'System online')}
    </div>
    ${stats ? `
      <div class="statusbar-item">
        ${t('label_article_count')}: ${stats.total_items.toLocaleString()}
      </div>
      <div class="statusbar-item">
        ${t('label_next_window')}: ${stats.next_scrape || '—'}
      </div>
    ` : ''}
    <div class="statusbar-item" style="margin-left:auto">
      © Pontnova
    </div>
  `);
}

// ──────────────────────────────────────────────
// Page Renderers
// ──────────────────────────────────────────────

async function renderMainContent() {
  const container = document.getElementById('page-content');
  if (!container) return;
  syncContentFrameGeometry();

  // Update filter bar visibility
  const filterBar = document.querySelector('.filter-bar');
  if (filterBar) {
    filterBar.classList.toggle('hidden', state.currentPage !== 'news');
  }

  switch (state.currentPage) {
    case 'news':    await renderNewsPage(container); break;
    case 'reports': await renderReportsPage(container); break;
    case 'topic':   await renderTopicPage(container); break;
    case 'sources': await renderSourcesPage(container); break;
    case 'about':   await renderAboutPage(container); break;
    default:        await renderNewsPage(container); break;
  }
  syncContentFrameGeometry();
}

// ── News Page ──────────────────────────────────

async function renderNewsPage(container) {
  container.innerHTML = renderSkeletons(6);

  try {
    const sepTimelineMode = isSepTimelineMode();
    const sepTimelineLimit = 48;
    const sepTimelineWindowLimit = 72;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStart = `${yyyy}-${mm}-${dd} 00:00:00`;
    const todayEnd = `${yyyy}-${mm}-${dd} 23:59:59`;
    // Build query params
    const params = new URLSearchParams({
      page: sepTimelineMode ? 1 : state.pagination.page,
      limit: sepTimelineMode ? sepTimelineLimit : state.pagination.limit,
    });
    params.set('relevant_only', 'true');
    if (state.filters.ip_type && state.filters.ip_type !== 'all') params.set('ip_type', state.filters.ip_type);
    if (state.filters.editorial_lane && state.filters.editorial_lane !== 'all') params.set('editorial_lane', state.filters.editorial_lane);
    if (state.filters.category && state.filters.category !== 'all') params.set('category', state.filters.category);
    if (state.filters.scope && state.filters.scope !== 'all') params.set('scope', state.filters.scope);
    if (state.filters.q) params.set('q', state.filters.q);
    if (state.filters.source) params.set('source', state.filters.source);
    if (state.filters.has_ai) params.set('has_ai', 'true');
    const todayParams = new URLSearchParams({ page: 1, limit: 60 });
    todayParams.set('relevant_only', 'true');
    if (state.filters.editorial_lane && state.filters.editorial_lane !== 'all') todayParams.set('editorial_lane', state.filters.editorial_lane);
    todayParams.set('date_from', todayStart);
    todayParams.set('date_to', todayEnd);

    const [data, statsData, overviewData, dailyReport, weeklyReport, dailyAudioBrief, topicBriefs, sourcesData, todayPublishedData] = await Promise.all([
      apiFetch(`/news?${params}`),
      apiFetch('/stats'),
      apiFetch('/intel-overview').catch(() => null),
      apiFetch('/reports/daily').catch(() => null),
      apiFetch('/reports/weekly').catch(() => null),
      apiFetch('/reports/daily/audio/latest').catch(() => null),
      apiFetch('/topic-briefs').catch(() => ({ topics: [] })),
      apiFetch('/sources').catch(() => ({ sources: [] })),
      apiFetch(`/news?${todayParams}`).catch(() => ({ items: [], total: 0 })),
    ]);

    state.stats = statsData;
    state.lastStatsToken = getStatsRefreshToken(statsData);
    state.intelOverview = overviewData;
    state.dailyReport = dailyReport;
    state.weeklyReport = weeklyReport;
    state.dailyAudioBrief = dailyAudioBrief;
    state.dailyAudioHistory = [];
    state.topicBriefs = topicBriefs?.topics || [];
    state.sources = sourcesData?.sources || [];
    state.pagination.total = data.total;
    state.pagination.pages = sepTimelineMode ? 1 : data.pages;
    if (sepTimelineMode) state.pagination.page = 1;

    let mergedItems = [...(data.items || [])];
    if (sepTimelineMode && data.pages > 1) {
      let probePage = 2;
      while (probePage <= Math.min(data.pages, 12)) {
        const relevantItems = mergedItems.filter(isRelevantDisplayItem);
        const streamCandidates = relevantItems.filter(isStreamItem);
        const sepTimelineItems = sortByChronology(streamCandidates.length ? streamCandidates : relevantItems);
        const chronologyGroups = countChronologyGroups(sepTimelineItems);
        if (sepTimelineItems.length >= sepTimelineWindowLimit || chronologyGroups >= 6) break;
        const probeParams = new URLSearchParams(params);
        probeParams.set('page', String(probePage));
        try {
          const extra = await apiFetch(`/news?${probeParams}`);
          mergedItems = mergedItems.concat(extra.items || []);
        } catch (error) {
          console.warn('SEP timeline probe stopped early', probePage, error);
          break;
        }
        probePage += 1;
      }
    }
    if (!sepTimelineMode && state.pagination.page === 1 && data.pages > 1) {
      let probePage = 2;
      while (probePage <= Math.min(data.pages, 10)) {
        const featuredCount = mergedItems.filter(isPresentationItem).length;
        const streamCount = mergedItems.filter(isStreamItem).length;
        const chronologyGroups = countChronologyGroups(mergedItems.filter(isRelevantDisplayItem));
        if (featuredCount >= 5 && streamCount >= state.pagination.limit && chronologyGroups >= 4) break;
        const probeParams = new URLSearchParams(params);
        probeParams.set('page', String(probePage));
        try {
          const extra = await apiFetch(`/news?${probeParams}`);
          mergedItems = mergedItems.concat(extra.items || []);
        } catch (error) {
          console.warn('Chronology probe stopped early', probePage, error);
          break;
        }
        probePage += 1;
      }
    }

    mergedItems = mergedItems.filter(isRelevantDisplayItem);
    const displayTotal = data.total;
    const featuredItems = sortBySignalPriority(mergedItems.filter(isPresentationItem), 'brief');
    const streamItems = mergedItems.filter(isStreamItem);
    const visibleItems = sepTimelineMode
      ? selectChronologyWindow(streamItems.length ? streamItems : mergedItems, sepTimelineWindowLimit, 1)
      : selectChronologyWindow(streamItems.length ? streamItems : mergedItems, state.pagination.limit, state.pagination.page);
    const boardItems = featuredItems.length ? featuredItems : visibleItems;
    const focusedMode = isFocusedNewsMode();

    container.innerHTML = '';
    if (focusedMode) {
      container.appendChild(renderFocusedNewsIntro(statsData, displayTotal, mergedItems, data, topicBriefs?.topics || []));
    } else {
      await appendGlobalDashboardSections(
        container,
        statsData,
        overviewData,
        displayTotal,
        boardItems,
        todayPublishedData?.items || [],
        dailyReport,
        weeklyReport,
        topicBriefs?.topics || [],
        streamItems.length ? streamItems : mergedItems
      );
    }
    container.appendChild(renderStreamHeader(displayTotal, streamItems.length ? streamItems : mergedItems));

    if (sepTimelineMode) {
      container.appendChild(renderFocusedSepTimeline(visibleItems, displayTotal));
    } else {
      container.appendChild(renderIntelStreamSections(visibleItems));
    }

    // Pagination
    if (data.pages > 1 && isFocusedNewsMode() && !sepTimelineMode) {
      container.appendChild(renderPagination(data.page, data.pages, data.total));
    }

    if (focusedMode && state.focusViewExpanded) {
      container.appendChild(renderExpandedOverviewHeader());
      await appendGlobalDashboardSections(
        container,
        statsData,
        overviewData,
        displayTotal,
        boardItems,
        todayPublishedData?.items || [],
        dailyReport,
        weeklyReport,
        topicBriefs?.topics || [],
        streamItems.length ? streamItems : mergedItems
      );
    }

    // Update statusbar
    document.querySelector('.statusbar')?.replaceWith(renderStatusBar());
    syncContentFrameGeometry();

  } catch (err) {
    container.innerHTML = renderErrorState(err.message);
    syncContentFrameGeometry();
  }
}

async function renderReportsPage(container) {
  container.innerHTML = renderSkeletons(4);
  try {
    const [statsData, dailyReport, weeklyReport, dailyAudioBrief, topicBriefs, archiveData] = await Promise.all([
      apiFetch('/stats'),
      apiFetch('/reports/daily').catch(() => null),
      apiFetch('/reports/weekly').catch(() => null),
      apiFetch('/reports/daily/audio/latest').catch(() => null),
      apiFetch('/topic-briefs').catch(() => ({ topics: [] })),
      apiFetch('/reports/archive').catch(() => ({ groups: { daily: [], weekly: [] } })),
    ]);
    state.stats = statsData;
    state.lastStatsToken = getStatsRefreshToken(statsData);
    state.dailyReport = dailyReport;
    state.weeklyReport = weeklyReport;
    state.dailyAudioBrief = dailyAudioBrief;
    state.dailyAudioHistory = [];
    state.topicBriefs = topicBriefs?.topics || [];

    container.innerHTML = '';
    container.appendChild(renderReportsCenterHero(dailyReport, weeklyReport, dailyAudioBrief, topicBriefs?.topics || [], statsData, archiveData));
    container.appendChild(renderCommanderReports(dailyReport, weeklyReport, dailyAudioBrief, []));
    container.appendChild(renderRecentReportsTimeline(archiveData));
    container.appendChild(renderActionAndTopics(dailyReport, weeklyReport, topicBriefs?.topics || []));
    container.appendChild(renderReportsArchive(archiveData));
    document.querySelector('.statusbar')?.replaceWith(renderStatusBar());
    syncContentFrameGeometry();
  } catch (err) {
    container.innerHTML = renderErrorState(err.message);
    syncContentFrameGeometry();
  }
}

async function renderTopicPage(container) {
  if (!state.currentTopicId) {
    navigate('news');
    return;
  }

  container.innerHTML = renderSkeletons(4);
  try {
    const topicItemLimit = state.currentTopicId === 'sep_frand' ? 36 : 18;
    const [brief, itemsData] = await Promise.all([
      apiFetch(`/topic-briefs/${state.currentTopicId}`),
      apiFetch(`/topic-briefs/${state.currentTopicId}/items?limit=${topicItemLimit}`),
    ]);
    const sortedItems = sortBySignalPriority((itemsData.items || []).filter(isRelevantDisplayItem), 'stream');
    const latestSignalDate = buildPrimaryDateLabel(sortedItems[0] || {});
    const relatedSourceCount = brief.source_count || new Set(sortedItems.map((item) => item.source_id || item.source_name || item.url)).size;
    state.currentTopicBrief = brief;
    state.currentTopicItems = sortedItems;
    document.querySelector('.topbar')?.replaceWith(renderTopbar());
    document.getElementById('scrape-btn')?.addEventListener('click', triggerScrape);

    container.innerHTML = '';
    const shell = el('section', 'topic-page-shell');
    const actions = resolvePointList(brief.actions, '', 3, 110);
    const watchlist = resolvePointList(brief.watchlist, '', 3, 110);
    const points = resolvePointList(brief.key_points, '', 4, 110);
    const topicStrategy = getTopicStrategyMeta(brief);
    const sepAiAnalysis = state.currentTopicId === 'sep_frand' ? (brief?.sep_ai_analysis || {}) : null;
    const sepAiInsightCount = Array.isArray(sepAiAnalysis?.insight_cards) ? sepAiAnalysis.insight_cards.length : 0;
    const sepAiMonthCount = Array.isArray(sepAiAnalysis?.monthly_series) ? sepAiAnalysis.monthly_series.length : 0;
    const sepAiJudgmentCount = Array.isArray(sepAiAnalysis?.trend_judgments) ? sepAiAnalysis.trend_judgments.length : 0;
    const sepAiEntry = state.currentTopicId === 'sep_frand' ? `
      <div class="topic-page-quick-link">
        <span class="topic-page-quick-meta">${t('topic_sep_ai_hint')}</span>
        <button class="btn btn-secondary topic-ai-btn">${t('topic_sep_open_ai')}</button>
        ${(sepAiInsightCount || sepAiMonthCount || sepAiJudgmentCount) ? `
          <div class="topic-page-quick-stats">
            ${sepAiInsightCount ? `<span class="topic-page-quick-pill">${sepAiInsightCount} ${t('topic_sep_ai_preview_cards')}</span>` : ''}
            ${sepAiMonthCount ? `<span class="topic-page-quick-pill">${sepAiMonthCount} ${t('topic_sep_ai_preview_months')}</span>` : ''}
            ${sepAiJudgmentCount ? `<span class="topic-page-quick-pill">${sepAiJudgmentCount} ${t('topic_sep_ai_preview_judgments')}</span>` : ''}
          </div>
        ` : ''}
      </div>
    ` : '';

    shell.innerHTML = `
      <div class="topic-page-head">
        <button class="btn btn-secondary topic-back-btn">${t('topic_back')}</button>
        <div class="topic-page-head-copy">
          <div class="section-kicker">${t('topic_page_kicker')}</div>
          <span class="topic-page-window">${escapeHtml(brief.topic_name_zh || '')} · ${formatCollectionWindow(brief)}</span>
        </div>
      </div>
      <div class="topic-page-hero">
        <div class="topic-page-copy">
          <div class="topic-page-topline">
            <span class="source-badge official">${escapeHtml(brief.topic_name_zh || '')}</span>
            <span class="ip-badge general">${brief.item_count || 0}</span>
            ${topicStrategy ? `<span class="topic-window-pill">${escapeHtml(topicStrategy.label)}</span>` : ''}
          </div>
          <h1 class="topic-page-title">${escapeHtml(brief.headline_zh || brief.topic_name_zh || '')}</h1>
          ${brief.headline_en ? `<div class="topic-page-subtitle">${escapeHtml(brief.headline_en)}</div>` : ''}
          <p class="topic-page-summary">${escapeHtml(brief.summary_zh || '')}</p>
          ${sepAiEntry}
          <div class="topic-page-metric-grid">
            <div class="topic-page-metric">
              <span>${t('topic_metric_sources')}</span>
              <strong>${relatedSourceCount}</strong>
            </div>
            <div class="topic-page-metric">
              <span>${t('topic_metric_items')}</span>
              <strong>${brief.item_count || sortedItems.length}</strong>
            </div>
            <div class="topic-page-metric">
              <span>${t('topic_latest_signal')}</span>
              <strong>${latestSignalDate || '—'}</strong>
            </div>
            <div class="topic-page-metric">
              <span>${t('topic_metric_window')}</span>
              <strong>${formatCollectionWindow(brief)}</strong>
            </div>
          </div>
        </div>
        <div class="topic-page-aside">
          <div class="intel-block compact insight">
            <div class="intel-block-label">${t('block_topic_actions')}</div>
            ${renderPointList(actions, 'intel-points compact')}
          </div>
          <div class="intel-block compact">
            <div class="intel-block-label">${t('block_overview_watchlist')}</div>
            ${renderPointList(watchlist, 'intel-points compact')}
          </div>
        </div>
      </div>
      <div class="briefing-report-grid topic-summary-grid">
        <div class="intel-block">
          <div class="intel-block-label">${t('block_topic_points')}</div>
          ${renderPointList(points)}
        </div>
        <div class="intel-block insight">
          <div class="intel-block-label">${t('topic_related')}</div>
          <div class="topic-related-meta">${brief.item_count || 0} ${t('total_items')} / ${brief.source_count || 0} ${t('stat_sources')}</div>
          <button class="btn btn-secondary topic-filter-btn">${t('topic_btn')}</button>
        </div>
      </div>
    `;

    shell.querySelector('.topic-back-btn')?.addEventListener('click', () => navigate('news'));
    shell.querySelector('.topic-filter-btn')?.addEventListener('click', () => applyTopicPreset(state.currentTopicId));
    shell.querySelector('.topic-ai-btn')?.addEventListener('click', () => {
      document.getElementById('sep-ai-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    container.appendChild(shell);
    if (state.currentTopicId === 'sep_frand') {
      container.appendChild(renderSepTopicFocus(brief));
    }
    container.appendChild(renderTopicTimeline(sortedItems));
    container.appendChild(renderStreamHeader(itemsData.total || sortedItems.length));
    const grid = el('div', 'news-grid intelligence-stream topic-detail-grid');
    sortedItems.forEach((item) => grid.appendChild(renderNewsCard(item, 'must-read')));
    container.appendChild(grid);
    if (state.pendingTopicScrollId) {
      const targetId = state.pendingTopicScrollId;
      state.pendingTopicScrollId = '';
      window.requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (!target) return;
        scrollWithinContent(target, 18);
        target.classList.add('sep-ai-analysis-highlight');
        window.setTimeout(() => target.classList.remove('sep-ai-analysis-highlight'), 1800);
      });
    }
  } catch (err) {
    container.innerHTML = renderErrorState(err.message);
  }
}

function renderSepTopicFocus(brief) {
  const coverage = brief?.coverage_progress || {};
  const aiAnalysis = brief?.sep_ai_analysis || {};
  const actors = resolvePointList(brief?.key_actors, '', 6, 72);
  const actorGroups = Array.isArray(brief?.key_actor_groups) ? brief.key_actor_groups : [];
  const signalBreakdown = Array.isArray(brief?.signal_breakdown) ? brief.signal_breakdown : [];
  const chinaImpactSummary = (brief?.china_impact_summary_zh || '').trim();
  const chinaActionPoints = resolvePointList(brief?.china_action_points, '', 4, 88);
  const chinaFocusCompanies = resolvePointList(brief?.china_focus_companies, '', 6, 40);
  const chinaCompanyMap = Array.isArray(brief?.china_company_map) ? brief.china_company_map.slice(0, 4) : [];
  const timeline = Array.isArray(brief?.timeline_highlights) ? brief.timeline_highlights.slice(0, 8) : [];
  const section = el('section', 'sep-topic-focus-shell');
  section.innerHTML = `
    <div class="intel-block sep-coverage-block">
      <div class="intel-block-label">${t('topic_sep_coverage')}</div>
      <div class="topic-related-meta">${t('topic_sep_coverage_desc')}</div>
      <div class="sep-coverage-grid">
        <div class="sep-coverage-card">
          <span>${t('topic_sep_coverage_window')}</span>
          <strong>${escapeHtml(formatDate(coverage.window_start || brief?.date_from || ''))}</strong>
        </div>
        <div class="sep-coverage-card">
          <span>${t('topic_sep_coverage_total')}</span>
          <strong>${Number(coverage.total_signals || brief?.item_count || 0).toLocaleString()}</strong>
        </div>
        <div class="sep-coverage-card">
          <span>${t('topic_sep_coverage_iam')}</span>
          <strong>${escapeHtml(formatDate(coverage.iam_earliest || ''))}</strong>
        </div>
        <div class="sep-coverage-card">
          <span>${t('topic_sep_coverage_done')}</span>
          <strong>${Number(coverage.analyzed_count || 0).toLocaleString()}</strong>
        </div>
      </div>
    </div>
    ${renderSepAiAnalysis(aiAnalysis)}
    <div class="briefing-report-grid sep-topic-focus-grid">
      <div class="intel-block">
        <div class="intel-block-label">${t('topic_sep_actors')}</div>
        <div class="topic-related-meta">${t('topic_sep_actors_desc')}</div>
        ${actorGroups.length ? `
          <div class="sep-actor-groups">
            ${actorGroups.map((group) => `
              <div class="sep-actor-group">
                <div class="sep-actor-group-title">${escapeHtml((state.lang === 'zh' ? group.title_zh : group.title_en) || group.title_zh || '')}</div>
                ${renderPointList(group.items || [], 'intel-points compact')}
              </div>
            `).join('')}
          </div>
        ` : renderPointList(actors)}
      </div>
      <div class="intel-block insight">
        <div class="intel-block-label">${t('topic_sep_case_line')}</div>
        <div class="topic-related-meta">${t('topic_sep_case_line_desc')}</div>
        ${signalBreakdown.length ? `
          <div class="sep-signal-breakdown">
            ${signalBreakdown.map((entry) => `
              <div class="sep-signal-pill">
                <strong>${Number(entry.count || 0).toLocaleString()}</strong>
                <span>${escapeHtml((state.lang === 'zh' ? entry.label_zh : entry.label_en) || entry.label_zh || '')}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="sep-case-line-list">
          ${timeline.length ? timeline.map((item) => `
            <div class="sep-case-line-item">
              <div class="sep-case-line-meta">
                <span class="news-card-date">${escapeHtml(formatDate(item.date || ''))}</span>
                <span class="source-badge media">${escapeHtml(compactSourceName(item.source_name || ''))}</span>
                ${(item.signal_label_zh || item.signal_label_en) ? `<span class="topic-window-pill">${escapeHtml(state.lang === 'zh' ? (item.signal_label_zh || '') : (item.signal_label_en || item.signal_label_zh || ''))}</span>` : ''}
                ${item.china_relevant ? `<span class="sep-china-indicator">${t('topic_sep_china_related')}</span>` : ''}
                ${item.scope ? `<span class="ip-badge general">${escapeHtml(resolveScopeLabel(item.scope))}</span>` : ''}
              </div>
              <div class="sep-case-line-title">${escapeHtml((state.lang === 'zh' && item.title_zh) ? item.title_zh : (item.title_zh || item.title || ''))}</div>
              ${Array.isArray(item.china_labels) && item.china_labels.length ? `<div class="sep-focus-company-list compact">${item.china_labels.map((label) => `<span class="sep-focus-company-pill">${escapeHtml(label)}</span>`).join('')}</div>` : ''}
              ${item.url ? `<a class="sep-case-line-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${t('topic_open_source')}</a>` : ''}
            </div>
          `).join('') : `<div class="mini-empty">${t('card_empty')}</div>`}
        </div>
      </div>
    </div>
    <div class="intel-block insight sep-topic-impact-block">
      <div class="intel-block-label">${t('topic_sep_china_impact')}</div>
      <div class="topic-related-meta">${t('topic_sep_china_impact_desc')}</div>
      ${chinaImpactSummary ? `<p class="sep-impact-summary">${escapeHtml(chinaImpactSummary)}</p>` : ''}
      ${chinaFocusCompanies.length ? `
        <div class="sep-impact-subtitle">${t('topic_sep_china_focus')}</div>
        <div class="sep-focus-company-list">
          ${chinaFocusCompanies.map((label) => `<span class="sep-focus-company-pill">${escapeHtml(label)}</span>`).join('')}
        </div>
      ` : ''}
      ${renderPointList(chinaActionPoints)}
      ${chinaCompanyMap.length ? `
        <div class="sep-impact-subtitle">${t('topic_sep_company_map')}</div>
        <div class="topic-related-meta sep-company-map-desc">${t('topic_sep_company_map_desc')}</div>
        <div class="sep-company-map-grid">
          ${chinaCompanyMap.map((entry) => `
            <div class="sep-company-card">
              <div class="sep-company-card-top">
                <div class="sep-company-name">${escapeHtml(entry.company || '')}</div>
                <div class="sep-company-count">${Number(entry.signal_total || 0).toLocaleString()} ${state.lang === 'zh' ? '条节点' : 'signals'}</div>
              </div>
              <div class="sep-company-snapshot">
                <div class="sep-company-snapshot-head">${t('topic_sep_company_snapshot')}</div>
                <div class="sep-company-snapshot-grid">
                  ${entry.risk_tags?.[0] ? `
                    <div class="sep-company-snapshot-card">
                      <span class="sep-company-snapshot-label">${t('topic_sep_company_risks')}</span>
                      <strong>${escapeHtml(state.lang === 'zh' ? (entry.risk_tags[0].label_zh || '') : (entry.risk_tags[0].label_en || entry.risk_tags[0].label_zh || ''))}</strong>
                    </div>
                  ` : ''}
                  ${entry.trend_signal ? `
                    <div class="sep-company-snapshot-card">
                      <span class="sep-company-snapshot-label">${t('topic_sep_company_trend')}</span>
                      <strong>${escapeHtml(state.lang === 'zh' ? (entry.trend_signal.label_zh || '') : (entry.trend_signal.label_en || entry.trend_signal.label_zh || ''))}</strong>
                      <div class="sep-company-snapshot-trend">
                        <div class="sep-company-snapshot-trend-bars">
                          <span class="recent" style="width:${computeSepTrendBarWidth(entry.trend_signal.recent_count, entry.trend_signal.recent_count, entry.trend_signal.previous_count)};"></span>
                          <span class="previous" style="width:${computeSepTrendBarWidth(entry.trend_signal.previous_count, entry.trend_signal.recent_count, entry.trend_signal.previous_count)};"></span>
                        </div>
                        <div class="sep-company-snapshot-trend-meta">
                          <span>${t('topic_sep_company_recent_window')} ${Number(entry.trend_signal.recent_count || 0).toLocaleString()}</span>
                          <span>${t('topic_sep_company_previous_window')} ${Number(entry.trend_signal.previous_count || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ` : ''}
                  ${entry.source_quality ? `
                    <div class="sep-company-snapshot-card">
                      <span class="sep-company-snapshot-label">${t('topic_sep_company_source_quality')}</span>
                      <strong>${escapeHtml(state.lang === 'zh' ? (entry.source_quality.label_zh || '') : (entry.source_quality.label_en || entry.source_quality.label_zh || ''))}</strong>
                    </div>
                  ` : ''}
                  ${entry.freshness ? `
                    <div class="sep-company-snapshot-card">
                      <span class="sep-company-snapshot-label">${t('topic_sep_company_freshness')}</span>
                      <strong>${escapeHtml(state.lang === 'zh' ? (entry.freshness.label_zh || '') : (entry.freshness.label_en || entry.freshness.label_zh || ''))}</strong>
                    </div>
                  ` : ''}
                </div>
              </div>
              ${(Array.isArray(entry.risk_tags) && entry.risk_tags.length) ? `
                <div class="sep-company-risk-row">
                  <span class="sep-company-risk-label">${t('topic_sep_company_risks')}</span>
                  <div class="sep-company-risk-tags">
                    ${entry.risk_tags.map((item) => `
                      <span class="sep-company-risk-pill risk-${escapeHtml(item.key || '')}">
                        ${escapeHtml(state.lang === 'zh' ? (item.label_zh || '') : (item.label_en || item.label_zh || ''))}
                      </span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${entry.trend_signal ? `
                <div class="sep-company-trend-row">
                  <span class="sep-company-risk-label">${t('topic_sep_company_trend')}</span>
                  <span class="sep-company-trend-pill trend-${escapeHtml(entry.trend_signal.key || 'steady')}">
                    ${escapeHtml(state.lang === 'zh' ? (entry.trend_signal.label_zh || '') : (entry.trend_signal.label_en || entry.trend_signal.label_zh || ''))}
                  </span>
                  <span class="sep-company-trend-meta">
                    ${escapeHtml(state.lang === 'zh' ? (entry.trend_signal.window_label_zh || '') : (entry.trend_signal.window_label_en || entry.trend_signal.window_label_zh || ''))}
                    · ${Number(entry.trend_signal.recent_count || 0).toLocaleString()} / ${Number(entry.trend_signal.previous_count || 0).toLocaleString()}
                  </span>
                </div>
              ` : ''}
              ${((Array.isArray(entry.representative_sources) && entry.representative_sources.length) || entry.latest_update) ? `
                <div class="sep-company-meta-row">
                  ${Array.isArray(entry.representative_sources) && entry.representative_sources.length ? `
                    <span class="sep-company-meta-chip">
                      <strong>${t('topic_sep_company_sources')}</strong>
                      <span>${escapeHtml(entry.representative_sources.join(' / '))}</span>
                    </span>
                  ` : ''}
                  ${entry.latest_update ? `
                    <span class="sep-company-meta-chip">
                      <strong>${t('topic_sep_company_latest')}</strong>
                      <span>${escapeHtml(formatDate(entry.latest_update))}</span>
                    </span>
                  ` : ''}
                </div>
              ` : ''}
              ${(entry.source_quality || entry.freshness) ? `
                <div class="sep-company-meta-row">
                  ${entry.source_quality ? `
                    <span class="sep-company-meta-chip tier-${escapeHtml(entry.source_quality.key || 'stable_mix')}">
                      <strong>${t('topic_sep_company_source_quality')}</strong>
                      <span>${escapeHtml(state.lang === 'zh' ? (entry.source_quality.label_zh || '') : (entry.source_quality.label_en || entry.source_quality.label_zh || ''))}</span>
                      ${(state.lang === 'zh' ? entry.source_quality.detail_zh : (entry.source_quality.detail_en || entry.source_quality.detail_zh || '')) ? `<em>${escapeHtml(state.lang === 'zh' ? entry.source_quality.detail_zh : (entry.source_quality.detail_en || entry.source_quality.detail_zh || ''))}</em>` : ''}
                    </span>
                  ` : ''}
                  ${entry.freshness ? `
                    <span class="sep-company-meta-chip freshness-${escapeHtml(entry.freshness.key || 'unknown')}">
                      <strong>${t('topic_sep_company_freshness')}</strong>
                      <span>${escapeHtml(state.lang === 'zh' ? (entry.freshness.label_zh || '') : (entry.freshness.label_en || entry.freshness.label_zh || ''))}</span>
                    </span>
                  ` : ''}
                </div>
              ` : ''}
              ${entry.latest_highlight ? `
                <div class="sep-company-latest-row">
                  <span class="sep-company-risk-label">${t('topic_sep_company_latest_signal')}</span>
                  <div class="sep-company-latest-card">
                    <div class="sep-company-latest-meta">
                      ${entry.latest_highlight.date ? `<span class="news-card-date">${escapeHtml(formatDate(entry.latest_highlight.date))}</span>` : ''}
                      ${entry.latest_highlight.source_name ? `<span class="source-badge media">${escapeHtml(compactSourceName(entry.latest_highlight.source_name))}</span>` : ''}
                      ${(entry.latest_highlight.signal_label_zh || entry.latest_highlight.signal_label_en) ? `<span class="topic-window-pill">${escapeHtml(state.lang === 'zh' ? (entry.latest_highlight.signal_label_zh || '') : (entry.latest_highlight.signal_label_en || entry.latest_highlight.signal_label_zh || ''))}</span>` : ''}
                    </div>
                    <div class="sep-company-latest-title">${escapeHtml((state.lang === 'zh' && entry.latest_highlight.title_zh) ? entry.latest_highlight.title_zh : (entry.latest_highlight.title_zh || entry.latest_highlight.title || ''))}</div>
                    ${entry.latest_highlight.url ? `<a class="sep-case-line-link" href="${escapeHtml(entry.latest_highlight.url)}" target="_blank" rel="noopener noreferrer">${t('topic_open_source')}</a>` : ''}
                  </div>
                </div>
              ` : ''}
              ${entry.action_link_zh ? `
                <div class="sep-company-conclusion-row">
                  <span class="sep-company-risk-label">${t('topic_sep_company_action_link')}</span>
                  <p class="sep-company-conclusion">${escapeHtml(entry.action_link_zh)}</p>
                </div>
              ` : ''}
              ${entry.conclusion_zh ? `
                <div class="sep-company-conclusion-row">
                  <span class="sep-company-risk-label">${t('topic_sep_company_conclusion')}</span>
                  <p class="sep-company-conclusion">${escapeHtml(entry.conclusion_zh)}</p>
                </div>
              ` : ''}
              ${entry.recent_summary_zh ? `
                <div class="sep-company-conclusion-row">
                  <span class="sep-company-risk-label">${t('topic_sep_company_recent')}</span>
                  <p class="sep-company-conclusion">${escapeHtml(entry.recent_summary_zh)}</p>
                </div>
              ` : ''}
              ${renderSepCompanyTimeline(entry)}
              <div class="sep-company-breakdown">
                ${(Array.isArray(entry.signal_breakdown) ? entry.signal_breakdown : []).filter((item) => Number(item.count || 0) > 0).map((item) => `
                  <span class="sep-company-breakdown-pill">${Number(item.count || 0).toLocaleString()} ${escapeHtml(state.lang === 'zh' ? (item.label_zh || '') : (item.label_en || item.label_zh || ''))}</span>
                `).join('')}
              </div>
              ${entry.action_hint_zh ? `<p class="sep-company-action">${escapeHtml(entry.action_hint_zh)}</p>` : ''}
              ${(Array.isArray(entry.related_node_groups) && entry.related_node_groups.length) ? `
                <div class="sep-company-conclusion-row">
                  <span class="sep-company-risk-label">${t('topic_sep_company_nodes')}</span>
                  <div class="sep-company-node-groups">
                    ${entry.related_node_groups.map((group) => `
                      <div class="sep-company-node-group">
                        <div class="sep-company-node-group-head">
                          <span class="sep-company-node-group-title">${escapeHtml(state.lang === 'zh' ? (group.label_zh || '') : (group.label_en || group.label_zh || ''))}</span>
                          <span class="sep-company-node-group-count">${Number(group.count || 0).toLocaleString()}</span>
                        </div>
                        <div class="sep-company-nodes">
                          ${(Array.isArray(group.items) ? group.items.slice(0, 1) : []).map((node) => `
                            <div class="sep-company-node">
                              <div class="sep-company-node-meta">
                                <span class="news-card-date">${escapeHtml(formatDate(node.date || ''))}</span>
                                <span class="topic-window-pill">${escapeHtml(state.lang === 'zh' ? (node.signal_label_zh || '') : (node.signal_label_en || node.signal_label_zh || ''))}</span>
                              </div>
                              <div class="sep-company-node-title">${escapeHtml((state.lang === 'zh' && node.title_zh) ? node.title_zh : (node.title_zh || node.title || ''))}</div>
                              ${node.url ? `<a class="sep-case-line-link" href="${escapeHtml(node.url)}" target="_blank" rel="noopener noreferrer">${t('topic_open_source')}</a>` : ''}
                            </div>
                          `).join('')}
                          ${Array.isArray(group.items) && group.items.length > 1 ? `
                            <details class="sep-company-node-details">
                              <summary>${t('topic_expand_related_nodes')} ${group.items.length - 1} ${state.lang === 'zh' ? '条' : ''}</summary>
                              <div class="sep-company-node-extra">
                                ${group.items.slice(1).map((node) => `
                                  <div class="sep-company-node">
                                    <div class="sep-company-node-meta">
                                      <span class="news-card-date">${escapeHtml(formatDate(node.date || ''))}</span>
                                      <span class="topic-window-pill">${escapeHtml(state.lang === 'zh' ? (node.signal_label_zh || '') : (node.signal_label_en || node.signal_label_zh || ''))}</span>
                                    </div>
                                    <div class="sep-company-node-title">${escapeHtml((state.lang === 'zh' && node.title_zh) ? node.title_zh : (node.title_zh || node.title || ''))}</div>
                                    ${node.url ? `<a class="sep-case-line-link" href="${escapeHtml(node.url)}" target="_blank" rel="noopener noreferrer">${t('topic_open_source')}</a>` : ''}
                                  </div>
                                `).join('')}
                              </div>
                            </details>
                          ` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  return section;
}

function renderSepAiAnalysis(aiAnalysis) {
  if (!aiAnalysis || (!Array.isArray(aiAnalysis.snapshot) && !Array.isArray(aiAnalysis.monthly_series))) {
    return '';
  }
  const snapshot = Array.isArray(aiAnalysis.snapshot) ? aiAnalysis.snapshot.slice(0, 4) : [];
  const monthlySeries = Array.isArray(aiAnalysis.monthly_series) ? aiAnalysis.monthly_series : [];
  const signalMix = Array.isArray(aiAnalysis.signal_mix) ? aiAnalysis.signal_mix : [];
  const scopeMix = Array.isArray(aiAnalysis.scope_mix) ? aiAnalysis.scope_mix : [];
  const depthMix = Array.isArray(aiAnalysis.depth_mix) ? aiAnalysis.depth_mix : [];
  const insightCards = Array.isArray(aiAnalysis.insight_cards) ? aiAnalysis.insight_cards.slice(0, 4) : [];
  const summaryText = state.lang === 'zh'
    ? (aiAnalysis.summary_zh || '')
    : (aiAnalysis.summary_en || aiAnalysis.summary_zh || '');
  const judgments = state.lang === 'zh'
    ? resolvePointList(aiAnalysis.trend_judgments, aiAnalysis.summary_zh || '', 4, 110)
    : resolvePointList(aiAnalysis.trend_judgments_en, aiAnalysis.summary_en || aiAnalysis.summary_zh || '', 4, 110);
  const monthlyPeak = Math.max(...monthlySeries.map((entry) => Number(entry.count || 0)), Number(aiAnalysis.monthly_peak || 0), 1);
  const scopePeak = Math.max(...scopeMix.map((entry) => Number(entry.count || 0)), 1);
  const depthPeak = Math.max(...depthMix.map((entry) => Number(entry.count || 0)), 1);

  return `
    <div class="intel-block sep-ai-analysis-block" id="sep-ai-analysis">
      <div class="intel-block-label">${t('topic_sep_ai_analysis')}</div>
      <div class="topic-related-meta">${t('topic_sep_ai_analysis_desc')}</div>
      ${summaryText ? `<p class="sep-ai-summary">${escapeHtml(summaryText)}</p>` : ''}
      ${insightCards.length ? `
        <div class="intel-block sep-ai-insight-shell">
          <div class="intel-block-label">${t('topic_sep_ai_insight_cards')}</div>
          <div class="topic-related-meta">${t('topic_sep_ai_insight_cards_desc')}</div>
          <div class="sep-ai-insight-grid">
            ${insightCards.map((entry) => `
              <div class="sep-ai-insight-card">
                <div class="sep-ai-insight-top">
                  <span>${escapeHtml(state.lang === 'zh' ? (entry.title_zh || '') : (entry.title_en || entry.title_zh || ''))}</span>
                  <strong>${escapeHtml(state.lang === 'zh' ? (entry.state_zh || '') : (entry.state_en || entry.state_zh || ''))}</strong>
                </div>
                ${(state.lang === 'zh' ? entry.insight_zh : (entry.insight_en || entry.insight_zh || '')) ? `
                  <div class="sep-ai-insight-copy">
                    <span>${t('topic_sep_ai_card_insight')}</span>
                    <p>${escapeHtml(state.lang === 'zh' ? (entry.insight_zh || '') : (entry.insight_en || entry.insight_zh || ''))}</p>
                  </div>
                ` : ''}
                ${(state.lang === 'zh' ? entry.action_zh : (entry.action_en || entry.action_zh || '')) ? `
                  <div class="sep-ai-insight-copy">
                    <span>${t('topic_sep_ai_card_action')}</span>
                    <p>${escapeHtml(state.lang === 'zh' ? (entry.action_zh || '') : (entry.action_en || entry.action_zh || ''))}</p>
                  </div>
                ` : ''}
                ${(state.lang === 'zh' ? entry.evidence_zh : (entry.evidence_en || entry.evidence_zh || '')) ? `
                  <div class="sep-ai-insight-copy muted">
                    <span>${t('topic_sep_ai_card_evidence')}</span>
                    <p>${escapeHtml(state.lang === 'zh' ? (entry.evidence_zh || '') : (entry.evidence_en || entry.evidence_zh || ''))}</p>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${snapshot.length ? `
        <div class="sep-ai-snapshot-grid">
          ${snapshot.map((entry) => {
            const value = state.lang === 'zh'
              ? (entry.value_zh ?? entry.value ?? '—')
              : (entry.value_en ?? entry.value ?? entry.value_zh ?? '—');
            const meta = state.lang === 'zh'
              ? (entry.meta_zh || '')
              : (entry.meta_en || entry.meta_zh || '');
            const label = state.lang === 'zh'
              ? (entry.label_zh || '')
              : (entry.label_en || entry.label_zh || '');
            return `
              <div class="sep-ai-snapshot-card">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(String(value))}</strong>
                ${meta ? `<em>${escapeHtml(meta)}</em>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      <div class="sep-ai-grid">
        <div class="intel-block">
          <div class="intel-block-label">${t('topic_sep_ai_monthly')}</div>
          <div class="topic-related-meta">${t('topic_sep_ai_monthly_desc')}</div>
          <div class="sep-ai-monthly-chart">
            ${monthlySeries.map((entry) => `
              <div class="sep-ai-month">
                <div class="sep-ai-month-rail">
                  <span style="height:${computeSepChartBarSize(entry.count, monthlyPeak, 26)}"></span>
                </div>
                <strong>${Number(entry.count || 0).toLocaleString()}</strong>
                <span>${escapeHtml(state.lang === 'zh' ? (entry.label_zh || '') : (entry.label_en || entry.label_zh || ''))}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="intel-block insight">
          <div class="intel-block-label">${t('topic_sep_ai_mix')}</div>
          <div class="topic-related-meta">${t('topic_sep_ai_mix_desc')}</div>
          <div class="sep-ai-mix-list">
            ${signalMix.map((entry) => `
              <div class="sep-ai-mix-card">
                <div class="sep-ai-mix-head">
                  <span>${escapeHtml(state.lang === 'zh' ? (entry.label_zh || '') : (entry.label_en || entry.label_zh || ''))}</span>
                  <strong>${Number(entry.count || 0).toLocaleString()}</strong>
                </div>
                <div class="sep-ai-mix-trend">
                  <span class="sep-ai-trend-pill ${escapeHtml(entry.trend_key || 'flat')}">${escapeHtml(state.lang === 'zh' ? (entry.trend_label_zh || '') : (entry.trend_label_en || entry.trend_label_zh || ''))}</span>
                  <span class="sep-ai-trend-meta">${t('topic_sep_ai_recent_window')} ${Number(entry.recent_count || 0).toLocaleString()} · ${t('topic_sep_ai_previous_window')} ${Number(entry.previous_count || 0).toLocaleString()}</span>
                </div>
                <div class="sep-ai-compare-bars">
                  <span class="recent" style="width:${computeSepChartWidth(entry.recent_count, entry.recent_count, entry.previous_count)};"></span>
                  <span class="previous" style="width:${computeSepChartWidth(entry.previous_count, entry.recent_count, entry.previous_count)};"></span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="briefing-report-grid sep-ai-detail-grid">
        <div class="intel-block">
          <div class="intel-block-label">${t('topic_sep_ai_forum')}</div>
          <div class="topic-related-meta">${t('topic_sep_ai_forum_desc')}</div>
          <div class="sep-ai-rank-list">
            ${scopeMix.map((entry) => `
              <div class="sep-ai-rank-item">
                <div class="sep-ai-rank-meta">
                  <span>${escapeHtml(state.lang === 'zh' ? (entry.label_zh || '') : (entry.label_en || entry.label_zh || ''))}</span>
                  <strong>${Number(entry.count || 0).toLocaleString()}</strong>
                </div>
                <div class="sep-ai-rank-bar"><span style="width:${computeSepChartWidth(entry.count, scopePeak)};"></span></div>
                <em>${t('topic_sep_ai_share')} ${Number(entry.share || 0).toLocaleString()}%</em>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="intel-block">
          <div class="intel-block-label">${t('topic_sep_ai_depth')}</div>
          <div class="topic-related-meta">${t('topic_sep_ai_depth_desc')}</div>
          <div class="sep-ai-rank-list">
            ${depthMix.map((entry) => `
              <div class="sep-ai-rank-item">
                <div class="sep-ai-rank-meta">
                  <span>${escapeHtml(state.lang === 'zh' ? (entry.label_zh || '') : (entry.label_en || entry.label_zh || ''))}</span>
                  <strong>${Number(entry.count || 0).toLocaleString()}</strong>
                </div>
                <div class="sep-ai-rank-bar depth-${escapeHtml(entry.key || 'summary_only')}"><span style="width:${computeSepChartWidth(entry.count, depthPeak)};"></span></div>
                <em>${t('topic_sep_ai_share')} ${Number(entry.share || 0).toLocaleString()}%</em>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      ${judgments.length ? `
        <div class="intel-block insight sep-ai-judgment-block">
          <div class="intel-block-label">${t('topic_sep_ai_judgments')}</div>
          ${renderPointList(judgments, 'intel-points compact')}
        </div>
      ` : ''}
    </div>
  `;
}

function computeSepTrendBarWidth(value, recent, previous) {
  const maxValue = Math.max(Number(recent || 0), Number(previous || 0), 1);
  const ratio = Number(value || 0) / maxValue;
  return `${Math.max(18, Math.min(100, ratio * 100))}%`;
}

function computeSepChartWidth(value, maxValue, fallback = 0) {
  const denominator = Math.max(Number(maxValue || 0), Number(fallback || 0), 1);
  const ratio = Number(value || 0) / denominator;
  return `${Math.max(16, Math.min(100, ratio * 100))}%`;
}

function computeSepChartBarSize(value, maxValue, minPercent = 24) {
  const denominator = Math.max(Number(maxValue || 0), 1);
  const ratio = Number(value || 0) / denominator;
  return `${Math.max(minPercent, Math.min(100, ratio * 100))}%`;
}

function renderSepCompanyTimeline(entry) {
  const rawItems = [];
  if (entry?.latest_highlight) {
    rawItems.push({ ...entry.latest_highlight, is_latest: true });
  }
  if (Array.isArray(entry?.related_nodes)) {
    entry.related_nodes.forEach((node) => rawItems.push({ ...node, is_latest: false }));
  }
  const seen = new Set();
  const items = rawItems
    .filter((node) => {
      const key = [node.url || '', node.title_zh || node.title || '', node.date || ''].join('|');
      if (!key.trim() || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.date || 0).getTime() || 0;
      const bTime = new Date(b.date || 0).getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 3);
  if (!items.length) return '';
  return `
    <div class="sep-company-conclusion-row">
      <span class="sep-company-risk-label">${t('topic_sep_company_timeline')}</span>
      <div class="sep-company-mini-timeline">
        ${items.map((node) => `
          <div class="sep-company-mini-timeline-item">
            <div class="sep-company-mini-timeline-meta">
              <span class="news-card-date">${escapeHtml(formatDate(node.date || ''))}</span>
              ${(node.signal_label_zh || node.signal_label_en) ? `<span class="topic-window-pill">${escapeHtml(state.lang === 'zh' ? (node.signal_label_zh || '') : (node.signal_label_en || node.signal_label_zh || ''))}</span>` : ''}
              ${node.is_latest ? `<span class="sep-company-mini-latest">${t('topic_sep_company_latest_badge')}</span>` : ''}
            </div>
            <div class="sep-company-mini-timeline-title">${escapeHtml((state.lang === 'zh' && node.title_zh) ? node.title_zh : (node.title_zh || node.title || ''))}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderTopicTimeline(items) {
  const timelineItems = sortBySignalPriority(items || [], 'stream').slice(0, 6);
  const section = el('section', 'topic-timeline-panel');
  section.innerHTML = `
    <div class="section-heading-row">
      <div>
        <div class="section-kicker">${t('topic_timeline')}</div>
        <h2 class="section-title">${t('topic_timeline')}</h2>
      </div>
      <div class="section-meta">${t('topic_timeline_desc')}</div>
    </div>
    <div class="topic-timeline-list">
      ${timelineItems.length ? timelineItems.map((item, index) => `
        <button class="topic-timeline-item" data-topic-item-index="${index}">
          <span class="topic-timeline-rail">
            <span class="topic-timeline-dot">${String(index + 1).padStart(2, '0')}</span>
          </span>
          <span class="topic-timeline-copy">
            <span class="topic-timeline-meta">
              <span class="topic-timeline-meta-left">
                <span class="source-badge ${item.category || 'media'}">${escapeHtml(compactSourceName(item.source_name || ''))}</span>
                <span class="ip-badge ${item.ip_type || 'general'}">${getIpTypeLabel(item.ip_type || 'general')}</span>
                ${renderGeoBadges(item)}
                ${renderSignalTagPills(item, true)}
              </span>
              <span class="news-card-date">${escapeHtml(buildPrimaryDateLabel(item))}</span>
            </span>
            <strong class="topic-timeline-title">${escapeHtml((state.lang === 'zh' && item.title_zh) ? item.title_zh : item.title)}</strong>
            <span class="topic-timeline-summary">${escapeHtml(resolvePointList(item.ai_core_points_zh, item.ai_summary_zh || item.summary || '', 1, 120)[0] || '')}</span>
          </span>
        </button>
      `).join('') : `<div class="mini-empty">${t('card_empty')}</div>`}
    </div>
  `;
  section.querySelectorAll('[data-topic-item-index]').forEach((btn) => {
    btn.addEventListener('click', () => showNewsDetail(timelineItems[Number(btn.dataset.topicItemIndex)]));
  });
  return section;
}

function renderFocusedSepTimeline(items, total = 0) {
  if (!items.length) {
    const wrap = el('div', 'intel-stream-shell');
    wrap.appendChild(renderEmptyState());
    return wrap;
  }

  const timelineItems = [];
  const orderedItems = sortByChronology(items || []);
  const grouped = [];
  const groupMap = new Map();
  orderedItems.forEach((item) => {
    const meta = getChronologyGroupMeta(item);
    if (!groupMap.has(meta.key)) {
      const payload = { ...meta, items: [] };
      groupMap.set(meta.key, payload);
      grouped.push(payload);
    }
    groupMap.get(meta.key).items.push(item);
  });

  const section = el('section', 'focus-timeline-panel');
  const accents = ['gold', 'teal', 'slate'];
  const desc = state.lang === 'zh'
    ? `当前共 ${Number(total || items.length).toLocaleString()} 条 SEP 相关资讯；这里把最近 ${Number(orderedItems.length || 0).toLocaleString()} 条按时间轴一次展开，减少翻页切换。`
    : `There are ${Number(total || items.length).toLocaleString()} SEP-related signals in total. This view expands the latest ${Number(orderedItems.length || 0).toLocaleString()} in one scrollable timeline.`;
  const groupsMarkup = grouped.length ? grouped.map((group, groupIndex) => {
    const list = group.items || [];
    const newestLabel = buildPrimaryDateLabel(list[0]);
    const oldestLabel = buildPrimaryDateLabel(list[list.length - 1]);
    const rangeLabel = newestLabel && oldestLabel && newestLabel !== oldestLabel
      ? `${newestLabel} → ${oldestLabel}`
      : (newestLabel || group.label);
    return `
    <section class="intel-stream-section chronology-group focus-timeline-group ${group.key}">
      <div class="focus-timeline-group-head">
        <div class="focus-timeline-group-copy">
          <div class="intel-stream-kicker ${accents[groupIndex % accents.length]}">${escapeHtml(group.label)}</div>
          <div class="focus-timeline-group-meta">${escapeHtml(rangeLabel)}</div>
        </div>
        <div class="intel-stream-count">${String(list.length).padStart(2, '0')} ${t('stream_group_items')}</div>
      </div>
      <div class="topic-timeline-list focus-timeline-list">
        ${list.map((item) => {
          const index = timelineItems.push(item) - 1;
          const titleText = (state.lang === 'zh' && item.title_zh) ? item.title_zh : item.title;
          const summaryText = resolvePointList(item.ai_core_points_zh, item.ai_summary_zh || item.summary || '', 1, 120)[0]
            || truncateText(item.ai_summary_zh || item.summary || '', 120)
            || '—';
          return `
            <button class="topic-timeline-item focus-timeline-item" data-focus-timeline-index="${index}">
              <span class="topic-timeline-rail">
                <span class="topic-timeline-dot">${String(index + 1).padStart(2, '0')}</span>
              </span>
              <span class="topic-timeline-copy">
                <span class="topic-timeline-meta">
                  <span class="topic-timeline-meta-left">
                    <span class="source-badge ${item.category || 'media'}">${escapeHtml(compactSourceName(item.source_name || ''))}</span>
                    <span class="ip-badge ${item.ip_type || 'general'}">${getIpTypeLabel(item.ip_type || 'general')}</span>
                    ${renderGeoBadges(item)}
                    ${renderSignalTagPills(item, true)}
                  </span>
                  <span class="news-card-date">${escapeHtml(buildPrimaryDateLabel(item))}</span>
                </span>
                <strong class="topic-timeline-title">${escapeHtml(titleText || '—')}</strong>
                <span class="topic-timeline-summary">${escapeHtml(summaryText)}</span>
                <span class="focus-timeline-item-footer">${escapeHtml(buildOriginalLinkDateMeta(item))}</span>
              </span>
            </button>
          `;
        }).join('')}
      </div>
    </section>
  `;
  }).join('') : `<div class="mini-empty">${t('card_empty')}</div>`;

  section.innerHTML = `
    <div class="focus-timeline-shell">
      <div class="section-meta focus-timeline-meta">${escapeHtml(desc)} ${buildChronologySummary(orderedItems)}</div>
      ${groupsMarkup}
    </div>
  `;
  section.querySelectorAll('[data-focus-timeline-index]').forEach((btn) => {
    btn.addEventListener('click', () => showNewsDetail(timelineItems[Number(btn.dataset.focusTimelineIndex)]));
  });
  return section;
}

function renderWarRoomHero(stats, overview, total) {
  const aiDone = stats.ai_analyzed ?? 0;
  const aiRatio = stats.total_items ? Math.round((aiDone / stats.total_items) * 100) : 0;
  const lastRefresh = formatDateTimeLabel(stats.last_scrape_time || stats.last_analyze_time || '');
  const overviewTitle = overview?.headline_zh || t('hero_title');
  const overviewSubtitle = overview?.headline_en || '';
  const overviewSummary = overview?.summary_zh || t('hero_desc');
  const watchPoints = (overview?.watchlist || overview?.top_signals || []).slice(0, 2);
  const overviewWindow = formatCollectionWindow(overview || stats);
  const workflowVersion = stats.workflow_version || 'editorial_v2';
  const metrics = [
    { value: (stats.total_items || 0).toLocaleString(), label: t('stat_total'), sub: `${stats.today_items || 0} ${t('stat_today')}` },
    { value: String(overview?.item_count || 0), label: t('hero_overview_samples'), sub: t('label_brief_summary') },
    { value: `${aiRatio}%`, label: t('hero_ai_density'), sub: `${aiDone} ${t('label_ai_ready')}` },
    { value: stats.next_scrape ? (stats.next_scrape.split(' ')[1] || '—') : '—', label: t('stat_next'), sub: stats.total_sources ? `${stats.total_sources} ${t('stat_sources')}` : '' },
  ];

  const wrap = el('section', 'hero-shell hero-shell--overview-only');
  wrap.innerHTML = `
    <div class="hero-main">
      <div class="hero-topline">
        <div class="hero-kicker">${t('hero_kicker')}</div>
        <div class="hero-refresh">
          <span>${t('hero_refresh')}</span>
          <strong>${lastRefresh}</strong>
        </div>
      </div>
      <div class="hero-grid">
        <div class="hero-copy">
          <h1 class="hero-title">${escapeHtml(overviewTitle)}</h1>
          ${overviewSubtitle ? `<div class="hero-subtitle">${escapeHtml(overviewSubtitle)}</div>` : ''}
          <div class="hero-meta-line">
            <span>${overviewWindow || formatCollectionWindow(stats)}</span>
            <span>${workflowVersion}</span>
            <span>${String(overview?.source_count || stats.total_sources || 0)} ${t('stat_sources')}</span>
          </div>
          <p class="hero-desc">${escapeHtml(overviewSummary)}</p>
          <div class="hero-chip-row">
            <span class="hero-chip"><strong>${t('hero_scope')}</strong>${resolveScopeLabel(state.filters.scope)}</span>
            <span class="hero-chip"><strong>${t('hero_focus')}</strong>${getIpTypeLabel(state.filters.ip_type || 'all')}</span>
            <span class="hero-chip"><strong>${t('hero_mode')}</strong>${state.filters.has_ai ? t('hero_mode_ai') : t('hero_mode_live')}</span>
            <span class="hero-chip"><strong>${t('label_showing')}</strong>${total.toLocaleString()}</span>
          </div>
        </div>
        <div class="hero-note">
          <div class="hero-note-line"></div>
          <div class="hero-note-label">${t('hero_watch')}</div>
          <p class="hero-note-copy">${watchPoints[0] ? escapeHtml(watchPoints[0]) : t('hero_editorial_note')}</p>
          ${watchPoints.length > 1 ? renderPointList(watchPoints.slice(1), 'intel-points compact hero-note-points') : ''}
          <div class="hero-note-foot">${overviewWindow || t('hero_focus_note')}</div>
        </div>
      </div>
      <div class="stats-row command-metrics">
        ${metrics.map((card) => `
          <div class="stat-card command-stat-card">
            <div class="stat-card-value">${card.value}</div>
            <div class="stat-card-label">${card.label}</div>
            ${card.sub ? `<div class="stat-card-sub">${card.sub}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  return wrap;
}

function renderWarRoomSourceBelt(stats) {
  const sources = getAuthorityBeltEntries(stats, 7);
  const strip = el('section', 'authority-strip');
  strip.innerHTML = `
    <div class="authority-strip-intro">
      <div class="authority-strip-kicker">${t('hero_authority')}</div>
      <p class="authority-strip-desc">${t('hero_authority_desc')}</p>
    </div>
    <div class="authority-strip-list">
      ${sources.length ? sources.map((src) => `
        <button class="authority-chip" data-source-filter="${escapeHtml(src.id)}">
          <span>${escapeHtml(compactSourceName(src.name))}</span>
          <strong>${src.count}</strong>
        </button>
      `).join('') : `<div class="mini-empty">${t('card_empty')}</div>`}
    </div>
  `;
  strip.querySelectorAll('[data-source-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currentPage = 'news';
      state.focusViewExpanded = false;
      releaseDefaultEditorialLaneForFocusedNews();
      state.filters.source = btn.dataset.sourceFilter;
      state.pagination.page = 1;
      renderApp();
    });
  });
  return strip;
}

function renderWarRoomBoard(stats, overview, items) {
  const board = el('section', 'warroom-grid');
  board.appendChild(renderPriorityBrief(overview, items));
  board.appendChild(renderWarRoomSide(stats, items));
  return board;
}

function getAudioBriefCopy() {
  if (state.lang === 'zh') {
    return {
      title: '每日语音日报',
      kicker: '语音快报',
      current: '当日播报',
      history: '历史语音',
      historyDesc: '后台保留最近生成的语音日报，便于回听和校对。',
      latestDesc: '用 60-120 秒快速回顾过去 24 小时欧洲 IP 重点动态。',
      duration: '时长',
      voice: '人声',
      generatedAt: '生成时间',
      points: '重点动态',
      details: '展开今日要点',
      detailsClose: '收起今日要点',
      transcript: '完整口播稿',
      sourceLink: '原始链接',
      download: '下载音频',
      empty: '今日语音日报尚未生成',
      scriptOnly: '当前仅生成脚本版，等待音频合成。',
      ready: '可播放',
      latestOnly: '网站仅展示当日最新语音',
      historyEmpty: '暂无可回听的历史语音日报。',
      audioOpen: '收听语音',
    };
  }
  return {
    title: 'Daily Audio Brief',
    kicker: 'Audio Brief',
    current: 'Today',
    history: 'Audio History',
    historyDesc: 'The backend keeps recent daily audio briefs for replay and QA.',
    latestDesc: 'A 60-120 second spoken recap of the past 24 hours in European IP.',
    duration: 'Duration',
    voice: 'Voice',
    generatedAt: 'Generated',
    points: 'Highlights',
    details: 'Open Details',
    detailsClose: 'Hide Details',
    transcript: 'Full Script',
    sourceLink: 'Original Link',
    download: 'Download Audio',
    empty: 'No audio brief has been generated yet.',
    scriptOnly: 'Script is ready; audio synthesis is still pending.',
    ready: 'Playable',
    latestOnly: 'The public site only keeps the latest daily audio brief.',
    historyEmpty: 'No historical audio briefs available yet.',
    audioOpen: 'Listen',
  };
}

function formatAudioBriefDuration(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  if (state.lang === 'zh') {
    return minutes ? `${minutes}分${String(remainder).padStart(2, '0')}秒` : `${remainder}秒`;
  }
  return minutes ? `${minutes}m ${String(remainder).padStart(2, '0')}s` : `${remainder}s`;
}

function renderAudioBriefCard(brief) {
  const copy = getAudioBriefCopy();
  const card = el('article', 'briefing-report-card briefing-report-card--audio');
  if (state.currentPage !== 'reports') card.classList.add('briefing-report-card--home');
  if (state.currentPage === 'reports') card.id = 'report-card-audio';
  if (!brief) {
    card.innerHTML = `<div class="mini-empty">${copy.empty}</div>`;
    return card;
  }

  const segments = Array.isArray(brief.segments) ? brief.segments : [];
  const transcriptLines = Array.isArray(brief.transcript_lines_zh) ? brief.transcript_lines_zh : [];
  const isAudioReady = Boolean(brief.audio_available && brief.audio_url);
  const transcriptBody = transcriptLines.map((line) => `<p>${escapeHtml(line)}</p>`).join('');
  const segmentMarkup = segments.slice(0, 4).map((segment) => `
    <article class="audio-brief-segment-item">
      <div class="audio-brief-segment-rank">${escapeHtml(segment.sequence_label_zh || String(segment.rank || ''))}</div>
      <div class="audio-brief-segment-copy">
        <div class="audio-brief-segment-title">${escapeHtml(segment.title_zh || segment.title || '—')}</div>
        <div class="audio-brief-segment-line">${escapeHtml(segment.what_happened_zh || '—')}</div>
        <div class="audio-brief-segment-line audio-brief-segment-line--insight">${escapeHtml(segment.why_it_matters_zh || '—')}</div>
        ${segment.url ? `<div class="audio-brief-segment-actions"><a class="btn btn-secondary btn-sm audio-brief-segment-link" href="${escapeHtml(segment.url)}" target="_blank" rel="noopener">${copy.sourceLink}</a></div>` : ''}
      </div>
    </article>
  `).join('');

  card.innerHTML = `
    <h3 class="briefing-report-title">${copy.title}</h3>
    <div class="audio-brief-player-shell">
      ${isAudioReady
        ? `
          <audio class="audio-brief-player" controls preload="none" src="${escapeHtml(brief.audio_url)}"></audio>
        `
        : `<div class="audio-brief-status">${escapeHtml(brief.tts_reason || copy.scriptOnly)}</div>`
      }
    </div>
    ${(segmentMarkup || transcriptBody) ? `
      <details class="audio-brief-transcript">
        <summary class="audio-brief-transcript-summary">
          <span class="audio-brief-transcript-closed">${copy.details}</span>
          <span class="audio-brief-transcript-open">${copy.detailsClose}</span>
        </summary>
        <div class="audio-brief-meta-row">
          <span class="audio-brief-meta-pill">${copy.current}</span>
          <span class="audio-brief-meta-pill">${isAudioReady ? copy.ready : copy.scriptOnly}</span>
          <span class="audio-brief-meta-pill">${copy.duration}: ${escapeHtml(formatAudioBriefDuration(brief.estimated_duration_seconds || 0))}</span>
          ${brief.voice_name ? `<span class="audio-brief-meta-pill">${copy.voice}: ${escapeHtml(brief.voice_name)}</span>` : ''}
          <span class="audio-brief-meta-pill">${copy.points}: ${escapeHtml(String(segments.length || 0))}</span>
          <span class="audio-brief-meta-pill">${copy.generatedAt}: ${escapeHtml(formatDateTimeLabel(brief.generated_at || ''))}</span>
          ${isAudioReady ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(brief.audio_url)}" download>${copy.download}</a>` : ''}
        </div>
        ${segmentMarkup ? `<div class="audio-brief-segment-list">${segmentMarkup}</div>` : ''}
        ${transcriptBody ? `
          <div class="audio-brief-transcript-body-shell">
            <div class="audio-brief-transcript-label">${copy.transcript}</div>
            <div class="audio-brief-transcript-body">${transcriptBody}</div>
          </div>
        ` : ''}
      </details>
    ` : ''}
  `;
  return card;
}

function renderAudioBriefHistory(historyItems = []) {
  const copy = getAudioBriefCopy();
  const items = (historyItems || []).filter(Boolean).slice(1, 8);
  if (!items.length) return null;

  const section = el('section', 'reports-audio-history-shell');
  section.innerHTML = `
    <div class="section-heading-row">
      <div>
        <div class="section-kicker">${copy.kicker}</div>
        <h2 class="section-title">${copy.history}</h2>
      </div>
      <div class="section-meta">${copy.historyDesc}</div>
    </div>
    <div class="reports-audio-history-list">
      ${items.map((item) => `
        <article class="reports-audio-history-item">
          <div class="reports-audio-history-head">
            <div class="reports-audio-history-title">${escapeHtml(item.brief_date || '—')}</div>
            <div class="reports-audio-history-meta">
              <span>${escapeHtml(formatAudioBriefDuration(item.estimated_duration_seconds || item.duration_seconds || 0))}</span>
              ${item.voice_name ? `<span>${escapeHtml(item.voice_name)}</span>` : ''}
              <span>${escapeHtml(formatDateTimeLabel(item.generated_at || ''))}</span>
            </div>
          </div>
          ${item.audio_available && item.audio_url ? `
            <div class="reports-audio-history-actions">
              <audio class="audio-brief-player audio-brief-player--compact" controls preload="none" src="${escapeHtml(item.audio_url)}"></audio>
              <a class="btn btn-secondary btn-sm" href="${escapeHtml(item.audio_url)}" download>${copy.download}</a>
            </div>
          ` : `<div class="audio-brief-status">${escapeHtml(item.error_msg || item.tts_reason || copy.scriptOnly)}</div>`}
        </article>
      `).join('')}
    </div>
  `;
  return section;
}

function renderHomeAudioBriefSection(dailyAudioBrief) {
  if (!dailyAudioBrief) return null;
  const section = el('section', 'briefing-report-section briefing-report-section--audio-home');
  const grid = el('div', 'briefing-report-grid briefing-report-grid--single');
  grid.appendChild(renderAudioBriefCard(dailyAudioBrief));
  section.appendChild(grid);
  return section;
}

function renderCommanderReports(dailyReport, weeklyReport, dailyAudioBrief = null, dailyAudioHistory = [], includeAudio = true) {
  const section = el('section', 'briefing-report-section');
  const isReportsPage = state.currentPage === 'reports';
  const availableReports = [dailyReport, weeklyReport, includeAudio ? dailyAudioBrief : null].filter(Boolean);
  const totalReportItems = [dailyReport, weeklyReport].filter(Boolean).reduce((sum, report) => sum + Number(report?.report_item_count || report?.item_count || 0), 0);
  const dailyCount = Number(dailyReport?.report_item_count || dailyReport?.item_count || 0);
  const weeklyCount = Number(weeklyReport?.report_item_count || weeklyReport?.item_count || 0);
  const audioCount = Number(dailyAudioBrief?.segments?.length || 0);
  const dailySummaryLabel = state.lang === 'zh' ? `日报 ${dailyCount}` : `Daily ${dailyCount}`;
  const weeklySummaryLabel = state.lang === 'zh' ? `周报 ${weeklyCount}` : `Weekly ${weeklyCount}`;
  const audioSummaryLabel = state.lang === 'zh' ? `语音 ${audioCount}` : `Audio ${audioCount}`;
  if (isReportsPage) {
    section.id = 'reports-current-section';
    section.classList.add('reports-current-shell');
  }
  section.innerHTML = `
    <div class="section-heading-row">
      <div>
        <div class="section-kicker">${t('section_reports')}</div>
        <h2 class="section-title">${t('section_reports')}</h2>
        ${isReportsPage ? `<div class="reports-section-role">${t('reports_role_current')}</div>` : ''}
      </div>
      <div class="section-meta section-meta-column">
        <span>${isReportsPage ? t('section_reports_desc_page') : t('section_reports_desc_home')}</span>
        ${isReportsPage ? `<span>${formatCollectionWindow(dailyReport || weeklyReport || state.stats)}</span>` : `<button class="btn btn-secondary section-jump-btn" data-open-page="reports">${t('reports_open_center')}</button>`}
      </div>
    </div>
    <div class="briefing-report-section-summary">
      <span class="briefing-report-section-chip">${availableReports.length} ${t('section_reports_summary_briefs')}</span>
      <span class="briefing-report-section-chip">${totalReportItems} ${t('section_reports_summary_items')}</span>
      <span class="briefing-report-section-chip daily">${escapeHtml(dailySummaryLabel)}</span>
      <span class="briefing-report-section-chip weekly">${escapeHtml(weeklySummaryLabel)}</span>
      ${includeAudio && dailyAudioBrief ? `<span class="briefing-report-section-chip audio">${escapeHtml(audioSummaryLabel)}</span>` : ''}
    </div>
  `;
  const grid = el('div', 'briefing-report-grid');
  grid.appendChild(renderBriefingReportCard(dailyReport, 'daily'));
  grid.appendChild(renderBriefingReportCard(weeklyReport, 'weekly'));
  if (includeAudio && dailyAudioBrief) grid.appendChild(renderAudioBriefCard(dailyAudioBrief));
  section.appendChild(grid);
  if (isReportsPage) {
    const historySection = renderAudioBriefHistory(dailyAudioHistory);
    if (historySection) section.appendChild(historySection);
  }
  section.querySelector('[data-open-page="reports"]')?.addEventListener('click', () => navigate('reports'));
  return section;
}

function renderReportsCenterHero(dailyReport, weeklyReport, dailyAudioBrief, topics, stats, archive) {
  const primary = dailyReport || weeklyReport || {};
  const archiveRuns = buildArchiveRunGroups([...(archive?.groups?.daily || []), ...(archive?.groups?.weekly || [])]);
  const currentCount = [dailyReport, weeklyReport, dailyAudioBrief].filter(Boolean).length;
  const recentCount = Math.min(8, archiveRuns.length);
  const archiveCount = archiveRuns.length;
  const dailyCount = Number(dailyReport?.report_item_count || dailyReport?.item_count || 0);
  const weeklyCount = Number(weeklyReport?.report_item_count || weeklyReport?.item_count || 0);
  const audioCount = Number(dailyAudioBrief?.segments?.length || 0);
  const totalReportItems = dailyCount + weeklyCount;
  const dailySummaryLabel = state.lang === 'zh' ? `日报 ${dailyCount}` : `Daily ${dailyCount}`;
  const weeklySummaryLabel = state.lang === 'zh' ? `周报 ${weeklyCount}` : `Weekly ${weeklyCount}`;
  const audioSummaryLabel = state.lang === 'zh' ? `语音 ${audioCount}` : `Audio ${audioCount}`;
  const shell = el('section', 'reports-center-hero');
  shell.innerHTML = `
    <div class="section-heading-row">
      <div>
        <div class="section-kicker">${t('reports_center_title')}</div>
        <h2 class="section-title">${t('reports_center_title')}</h2>
      </div>
      <div class="section-meta">${t('reports_center_desc')}</div>
    </div>
    <div class="briefing-report-section-summary reports-center-summary">
      <span class="briefing-report-section-chip">${currentCount} ${t('section_reports_summary_briefs')}</span>
      <span class="briefing-report-section-chip">${totalReportItems} ${t('section_reports_summary_items')}</span>
      <span class="briefing-report-section-chip daily">${escapeHtml(dailySummaryLabel)}</span>
      <span class="briefing-report-section-chip weekly">${escapeHtml(weeklySummaryLabel)}</span>
      ${dailyAudioBrief ? `<span class="briefing-report-section-chip audio">${escapeHtml(audioSummaryLabel)}</span>` : ''}
    </div>
  `;
  const actionRow = el('div', 'reports-center-actions');
  actionRow.innerHTML = `
    <div class="reports-center-action-cluster">
      <div class="reports-center-action-label">${t('reports_center_action_read')}</div>
      <div class="reports-center-action-group">
        ${dailyReport ? `<button class="btn btn-secondary reports-center-action-btn" data-open-report-card="daily">${t('reports_center_open_daily')}<span class="reports-center-action-count">${dailyCount}</span></button>` : ''}
        ${weeklyReport ? `<button class="btn btn-secondary reports-center-action-btn" data-open-report-card="weekly">${t('reports_center_open_weekly')}<span class="reports-center-action-count">${weeklyCount}</span></button>` : ''}
        ${dailyAudioBrief ? `<button class="btn btn-secondary reports-center-action-btn" data-open-report-card="audio">${getAudioBriefCopy().audioOpen}<span class="reports-center-action-count">${audioCount}</span></button>` : ''}
      </div>
    </div>
  `;
  actionRow.querySelectorAll('[data-open-report-card]').forEach((btn) => {
    btn.addEventListener('click', () => scrollToReportCard(btn.dataset.openReportCard));
  });
  shell.appendChild(actionRow);
  const grid = el('div', 'stats-row command-metrics');
  const cards = [
    { value: formatCollectionWindow(primary || stats) || '—', label: t('reports_center_window') },
    {
      value: formatTierTriplet(dailyReport?.source_tier_core, dailyReport?.source_tier_stable, dailyReport?.source_tier_watch),
      label: t('reports_center_daily_mix'),
      sub: getTierTripletCaption(),
    },
    {
      value: formatTierTriplet(weeklyReport?.source_tier_core, weeklyReport?.source_tier_stable, weeklyReport?.source_tier_watch),
      label: t('reports_center_weekly_mix'),
      sub: getTierTripletCaption(),
    },
    {
      value: Number(recentCount || 0).toLocaleString(),
      label: t('reports_center_recent_count'),
      sub: `${Number(archiveCount || 0).toLocaleString()} ${t('reports_center_archive_count')} · ${Number(stats?.ai_pending || 0).toLocaleString()} ${t('reports_center_pending')}`,
    },
  ];
  grid.innerHTML = cards.map((card) => `
    <div class="command-stat-card">
      <div class="stat-card-value">${escapeHtml(String(card.value || '—'))}</div>
      <div class="stat-card-label">${escapeHtml(card.label || '')}</div>
      <div class="stat-card-sub">${escapeHtml(card.sub || '')}</div>
    </div>
  `).join('');
  shell.appendChild(grid);
  const compareRow = el('div', 'reports-center-compare-row');
  compareRow.innerHTML = `
    <div class="reports-center-compare-pack">${renderReportSignalPill(dailyReport)}${renderReportComparison(dailyReport, 'daily', true)}</div>
    <div class="reports-center-compare-pack">${renderReportSignalPill(weeklyReport)}${renderReportComparison(weeklyReport, 'weekly', true)}</div>
  `;
  shell.appendChild(compareRow);
  const navRow = el('div', 'reports-center-nav');
  navRow.innerHTML = `
    <button class="btn btn-secondary reports-nav-btn" data-report-anchor="current">${t('reports_nav_current')}<span class="reports-nav-count">${currentCount}</span></button>
    <button class="btn btn-secondary reports-nav-btn" data-report-anchor="recent">${t('reports_nav_recent')}<span class="reports-nav-count">${recentCount}</span></button>
    <button class="btn btn-secondary reports-nav-btn" data-report-anchor="archive">${t('reports_nav_archive')}<span class="reports-nav-count">${archiveCount}</span></button>
  `;
  navRow.querySelectorAll('[data-report-anchor]').forEach((btn) => {
    btn.addEventListener('click', () => scrollToReportsSection(btn.dataset.reportAnchor));
  });
  updateReportsNavState('current');
  shell.appendChild(navRow);
  return shell;
}

function buildArchiveRunGroups(items) {
  const grouped = new Map();
  (items || []).forEach((item) => {
    const generatedMinute = String(item.generated_at || '').slice(0, 16);
    const titleKey = item.headline_zh || item.headline_en || item.filename || '—';
    const key = `${item.report_type || 'report'}|${generatedMinute}|${titleKey}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        ...item,
        formats: [],
      });
    }
    grouped.get(key).formats.push({
      format: String(item.format || '').toLowerCase(),
      filename: item.filename || '',
    });
  });
  return Array.from(grouped.values()).map((group) => {
    group.formats.sort((a, b) => {
      const order = ['pdf', 'html', 'md', 'eml'];
      return order.indexOf(a.format) - order.indexOf(b.format);
    });
    return group;
  });
}

function preferredArchiveFormat(formats) {
  const order = ['pdf', 'html', 'md', 'eml'];
  return order.map((fmt) => (formats || []).find((item) => item.format === fmt)).find(Boolean) || (formats || [])[0] || null;
}

function formatLocalizedCount(value, zhUnit, enUnit) {
  const count = Number(value || 0);
  if (state.lang === 'zh') return `${count} ${zhUnit}`;
  return `${count} ${enUnit}`;
}

function renderReportsArchive(archive) {
  const groups = archive?.groups || {};

  const renderGroup = (items, title) => {
    const allRuns = buildArchiveRunGroups(items);
    const runs = allRuns.slice(0, 4);
    if (!runs.length) {
      return {
        markup: `<div class="ops-empty">${t('reports_archive_empty')}</div>`,
        count: 0,
      };
    }
    return {
      count: allRuns.length,
      markup: runs.map((item) => {
      const preferred = preferredArchiveFormat(item.formats || []);
      const displayTitle = (state.lang === 'zh' ? item.headline_zh : (item.headline_en || item.headline_zh)) || item.filename || '—';
      const formatLinks = (item.formats || []).map((fmt) => `
        <a class="report-archive-format-link" href="${API}/reports/archive/file?filename=${encodeURIComponent(fmt.filename || '')}" target="_blank" rel="noopener">${escapeHtml(String(fmt.format || '').toUpperCase())}</a>
      `).join('');
      return `
      <article class="report-archive-item">
        <div class="report-archive-head">
          <div class="report-archive-topline">
            <span class="source-badge ${(item.report_type || '') === 'daily' ? 'official' : 'media'}">${(item.report_type || '') === 'daily' ? t('report_label_daily') : t('report_label_weekly')}</span>
            ${item.report_role_zh ? `<span class="report-role-pill ${(item.report_type || '') === 'daily' ? 'daily' : 'weekly'}">${escapeHtml(state.lang === 'zh' ? item.report_role_zh : (item.report_role_en || item.report_role_zh))}</span>` : ''}
          </div>
          <div class="report-archive-name">${escapeHtml(displayTitle)}</div>
        </div>
        ${item.headline_en && state.lang === 'zh' ? `<div class="report-archive-subtitle">${escapeHtml(item.headline_en)}</div>` : ''}
        ${item.summary_zh && state.lang === 'zh' ? `<div class="report-archive-summary">${escapeHtml(item.summary_zh.length > 96 ? `${item.summary_zh.slice(0, 96).trim()}...` : item.summary_zh)}</div>` : ''}
        <div class="report-archive-meta">
          <span>${escapeHtml(formatDateTimeLabel(item.generated_at || ''))}</span>
          <span>${t('reports_archive_size')}: ${Math.max(1, Math.round(Number(item.size_bytes || 0) / 1024))} KB</span>
          <span>${(item.formats || []).length} ${state.lang === 'zh' ? '种格式' : 'formats'}</span>
        </div>
        <div class="report-archive-format-row">${formatLinks}</div>
        <div class="report-archive-actions">
          ${preferred ? `<a class="btn btn-secondary btn-sm report-archive-action-btn" href="${API}/reports/archive/file?filename=${encodeURIComponent(preferred.filename || '')}" target="_blank" rel="noopener">${t('reports_archive_open_brief')}<span class="reports-archive-action-pill">${escapeHtml(String(preferred.format || '').toUpperCase())}</span></a>` : ''}
          ${preferred ? `<a class="btn btn-secondary btn-sm report-archive-action-btn" href="${API}/reports/archive/file?filename=${encodeURIComponent(preferred.filename || '')}&download=true">${t('reports_archive_download_file')}<span class="reports-archive-action-pill">${escapeHtml(String(preferred.format || '').toUpperCase())}</span></a>` : ''}
        </div>
      </article>
    `;
      }).join(''),
    };
  };

  const dailyGroup = renderGroup(groups.daily, t('reports_archive_daily'));
  const weeklyGroup = renderGroup(groups.weekly, t('reports_archive_weekly'));
  const archiveSummary = state.lang === 'zh'
    ? `当前共 ${dailyGroup.count + weeklyGroup.count} 期历史战报卡。`
    : `${dailyGroup.count + weeklyGroup.count} archived report runs currently available.`;

  const archiveSummaryRow = state.lang === 'zh'
    ? `
      <div class="briefing-report-section-summary reports-section-summary">
        <span class="briefing-report-section-chip">${dailyGroup.count + weeklyGroup.count} 期历史战报卡</span>
        <span class="briefing-report-section-chip daily">${dailyGroup.count} 期日报</span>
        <span class="briefing-report-section-chip weekly">${weeklyGroup.count} 期周报</span>
      </div>
    `
    : `
      <div class="briefing-report-section-summary reports-section-summary">
        <span class="briefing-report-section-chip">${dailyGroup.count + weeklyGroup.count} archived brief cards</span>
        <span class="briefing-report-section-chip daily">${dailyGroup.count} daily runs</span>
        <span class="briefing-report-section-chip weekly">${weeklyGroup.count} weekly runs</span>
      </div>
    `;
  const section = el('section', 'reports-archive-shell');
  section.id = 'reports-archive-section';
  section.innerHTML = `
    <div class="section-heading-row">
      <div>
        <div class="section-kicker">${t('reports_archive_title')}</div>
        <h2 class="section-title">${t('reports_archive_title')}</h2>
        <div class="reports-section-role">${t('reports_role_archive')}</div>
      </div>
      <div class="section-meta">${t('reports_archive_desc')} ${archiveSummary}</div>
    </div>
    ${archiveSummaryRow}
    <div class="reports-archive-grid">
      <div class="chart-card reports-archive-card">
        <div class="chart-card-title">${t('reports_archive_daily')} <span class="report-card-count">${formatLocalizedCount(dailyGroup.count, '期', 'runs')}</span></div>
        <div class="reports-archive-list">${dailyGroup.markup}</div>
      </div>
      <div class="chart-card reports-archive-card">
        <div class="chart-card-title">${t('reports_archive_weekly')} <span class="report-card-count">${formatLocalizedCount(weeklyGroup.count, '期', 'runs')}</span></div>
        <div class="reports-archive-list">${weeklyGroup.markup}</div>
      </div>
    </div>
  `;
  return section;
}

function renderRecentReportsTimeline(archive) {
  const groups = archive?.groups || {};
  const allRuns = buildArchiveRunGroups([...(groups.daily || []), ...(groups.weekly || [])]);
  const items = allRuns
    .sort((a, b) => String(b.generated_at || '').localeCompare(String(a.generated_at || '')))
    .slice(0, 8);
  const totalFormats = items.reduce((sum, item) => sum + (item.formats || []).length, 0);
  const timelineSummary = state.lang === 'zh'
    ? `当前展示 ${items.length} 期，含 ${totalFormats} 个格式入口。`
    : `Showing ${items.length} runs with ${totalFormats} format links.`;

  const timelineSummaryRow = state.lang === 'zh'
    ? `
      <div class="briefing-report-section-summary reports-section-summary">
        <span class="briefing-report-section-chip">${items.length} 期最近回看</span>
        <span class="briefing-report-section-chip">${totalFormats} 个格式入口</span>
      </div>
    `
    : `
      <div class="briefing-report-section-summary reports-section-summary">
        <span class="briefing-report-section-chip">${items.length} recent runs</span>
        <span class="briefing-report-section-chip">${totalFormats} format links</span>
      </div>
    `;
  const section = el('section', 'reports-timeline-shell');
  section.id = 'reports-recent-section';
  section.innerHTML = `
    <div class="section-heading-row">
      <div>
        <div class="section-kicker">${t('reports_timeline_title')}</div>
        <h2 class="section-title">${t('reports_timeline_title')}</h2>
        <div class="reports-section-role">${t('reports_role_recent')}</div>
      </div>
      <div class="section-meta">${t('reports_timeline_desc')} ${timelineSummary}</div>
    </div>
    ${timelineSummaryRow}
    <div class="reports-timeline-list">
      ${items.length ? items.map((item, index) => {
        const preferred = preferredArchiveFormat(item.formats || []);
        return `
        <article class="reports-timeline-item">
          <div class="reports-timeline-rail">
            <span class="reports-timeline-dot">${String(index + 1).padStart(2, '0')}</span>
          </div>
          <div class="reports-timeline-copy">
            <div class="reports-timeline-topline">
              <span class="source-badge ${(item.report_type || '') === 'daily' ? 'official' : 'media'}">${(item.report_type || '') === 'daily' ? t('report_label_daily') : t('report_label_weekly')}</span>
              <span class="ip-badge general">${escapeHtml(String(item.format || '').toUpperCase())}</span>
              ${item.report_role_zh ? `<span class="report-role-pill ${(item.report_type || '') === 'daily' ? 'daily' : 'weekly'}">${escapeHtml(state.lang === 'zh' ? item.report_role_zh : (item.report_role_en || item.report_role_zh))}</span>` : ''}
              ${item.comparison_signal_zh ? `<span class="report-signal-pill ${(Number(item.comparison_item_delta || 0) >= 5 || Number(item.comparison_source_delta || 0) >= 2) ? 'positive' : ((Number(item.comparison_item_delta || 0) <= -5 || Number(item.comparison_source_delta || 0) <= -2) ? 'negative' : 'neutral')}">${escapeHtml(state.lang === 'zh' ? item.comparison_signal_zh : (item.comparison_signal_en || item.comparison_signal_zh))}</span>` : ''}
            </div>
            <div class="reports-timeline-title">${escapeHtml(item.headline_zh || item.filename || '—')}</div>
            ${item.headline_en ? `<div class="reports-timeline-subtitle">${escapeHtml(item.headline_en)}</div>` : ''}
            ${item.summary_zh ? `<div class="reports-timeline-summary">${escapeHtml(item.summary_zh.length > 118 ? `${item.summary_zh.slice(0, 118).trim()}...` : item.summary_zh)}</div>` : ''}
            <div class="reports-timeline-meta">
              <span>${escapeHtml(formatDateTimeLabel(item.generated_at || ''))}</span>
              <span>${(item.formats || []).length} ${state.lang === 'zh' ? '种格式' : 'formats'}</span>
            </div>
            <div class="report-archive-format-row">
              ${(item.formats || []).map((fmt) => `
                <a class="report-archive-format-link" href="${API}/reports/archive/file?filename=${encodeURIComponent(fmt.filename || '')}" target="_blank" rel="noopener">${escapeHtml(String(fmt.format || '').toUpperCase())}</a>
              `).join('')}
            </div>
            <div class="reports-timeline-actions">
              ${preferred ? `<a class="btn btn-secondary btn-sm report-archive-action-btn" href="${API}/reports/archive/file?filename=${encodeURIComponent(preferred.filename || '')}" target="_blank" rel="noopener">${t('reports_archive_open_brief')}<span class="reports-archive-action-pill">${escapeHtml(String(preferred.format || '').toUpperCase())}</span></a>` : ''}
              ${preferred ? `<a class="btn btn-secondary btn-sm report-archive-action-btn" href="${API}/reports/archive/file?filename=${encodeURIComponent(preferred.filename || '')}&download=true">${t('reports_archive_download_file')}<span class="reports-archive-action-pill">${escapeHtml(String(preferred.format || '').toUpperCase())}</span></a>` : ''}
            </div>
          </div>
        </article>
      `; }).join('') : `<div class="ops-empty">${t('reports_timeline_empty')}</div>`}
    </div>
  `;
  return section;
}

function renderBriefingReportCard(report, reportType) {
  const card = el('article', 'briefing-report-card');
  card.classList.add(`briefing-report-card--${reportType}`);
  if (state.currentPage !== 'reports') card.classList.add('briefing-report-card--home');
  if (state.currentPage === 'reports') card.id = reportType === 'weekly' ? 'report-card-weekly' : 'report-card-daily';
  if (!report) {
    card.innerHTML = `<div class="mini-empty">${t('card_empty')}</div>`;
    return card;
  }
  const keyMoves = resolvePointList(report.key_moves, '', 4, 108);
  const watchlist = resolvePointList(report.watchlist, '', 3, 106);
  const reportLabel = reportType === 'daily' ? t('report_daily') : t('report_weekly');
  const summary = (report.summary_zh || '').trim();
  const compactSummary = summary.length > 128 ? `${summary.slice(0, 128).trim()}...` : summary;
  const flavorText = (state.lang === 'zh' ? report.report_focus_zh : report.report_focus_en) || (reportType === 'daily' ? t('reports_center_daily_desc') : t('reports_center_weekly_desc'));
  const roleLabel = (state.lang === 'zh' ? report.report_role_zh : report.report_role_en) || reportLabel;
  const isReportsPage = state.currentPage === 'reports';
  const reportLabels = getReportCardLabels(reportType);
  const keyMoveVisibleCount = isReportsPage ? 3 : 2;
  const watchVisibleCount = isReportsPage ? 2 : 1;
  const foldedBody = `
    <div class="briefing-report-blocks">
      <div class="intel-block compact">
        <div class="intel-block-label">${reportLabels.keyMoves}</div>
        ${renderExpandablePointList(keyMoves, 'intel-points compact', keyMoveVisibleCount)}
      </div>
      <div class="intel-block compact insight">
        <div class="intel-block-label">${reportLabels.watchlist}</div>
        ${renderExpandablePointList(watchlist, 'intel-points compact', watchVisibleCount)}
      </div>
    </div>
    ${!isReportsPage ? renderReportPreviewItems(report, reportType, reportLabels.previewLimit) : ''}
  `;
  card.innerHTML = `
    <div class="intel-panel-head">
      <div class="intel-panel-kicker">${reportLabel}</div>
      <span class="intel-panel-count">${String(report.item_count || 0).padStart(2, '0')}</span>
    </div>
    <div class="briefing-report-topline">
      <span class="source-badge official">${escapeHtml(roleLabel)}</span>
      ${renderReportSignalPill(report)}
    </div>
    <h3 class="briefing-report-title">${escapeHtml(report.headline_zh || reportLabel)}</h3>
    ${report.headline_en ? `<div class="briefing-report-subtitle">${escapeHtml(report.headline_en)}</div>` : ''}
    <div class="briefing-report-flavor">${escapeHtml(flavorText)}</div>
    ${renderReportComparison(report, reportType)}
    ${renderReportScope(report)}
    <p class="briefing-report-summary">${escapeHtml(compactSummary)}</p>
    ${isReportsPage ? foldedBody : `
      <details class="briefing-report-fold">
        <summary class="briefing-report-fold-summary">
          <span class="briefing-report-fold-summary-closed">${t('report_home_fold_open')}</span>
          <span class="briefing-report-fold-summary-open">${t('report_home_fold_close')}</span>
          <span class="briefing-report-fold-hint">${t('report_home_fold_desc')}</span>
        </summary>
        <div class="briefing-report-fold-body">
          ${foldedBody}
        </div>
      </details>
    `}
    <div class="briefing-report-meta">
      <span>${formatCollectionWindow(report)}</span>
      <div class="briefing-report-actions">
        <span class="briefing-tier-summary" title="${escapeHtml(t('source_tier_summary'))}">${renderSourceTierSummary(report)}</span>
        ${isReportsPage
          ? `
            <button class="btn btn-secondary briefing-export-btn" data-report-type="${reportType}" data-export-format="html">${t('export_html')}</button>
            <button class="btn btn-secondary briefing-export-btn" data-report-type="${reportType}" data-export-format="md">${t('export_md')}</button>
            <button class="btn btn-secondary briefing-export-btn" data-report-type="${reportType}" data-export-format="pdf">${t('export_pdf')}</button>
          `
          : `
            <button class="btn btn-primary briefing-open-btn" data-open-page="reports">${t('reports_open_center_short')}</button>
            <button class="btn btn-secondary briefing-export-btn" data-report-type="${reportType}" data-export-format="pdf">${t('report_export_pdf_short')}</button>
          `}
      </div>
    </div>
    ${isReportsPage ? renderReportDetailItems(report) : ''}
  `;
  card.querySelectorAll('.briefing-export-btn').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      event.stopPropagation();
      await triggerReportExport(btn.dataset.reportType, btn.dataset.exportFormat);
    });
  });
  card.querySelector('[data-open-page="reports"]')?.addEventListener('click', () => navigate('reports'));
  return card;
}

function renderActionAndTopics(dailyReport, weeklyReport, topics) {
  const section = el('section', 'command-action-grid');
  section.appendChild(renderChinaActionPanel(dailyReport, weeklyReport));
  section.appendChild(renderTopicTheater(topics));
  return section;
}

function renderChinaActionPanel(dailyReport, weeklyReport) {
  const panel = el('section', 'intel-panel action-panel');
  const primary = dailyReport || weeklyReport;
  const actions = resolvePointList(primary?.business_actions, '', 4, 118);
  const watchlist = resolvePointList(primary?.watchlist, '', 3, 112);
  panel.innerHTML = `
    <div class="intel-panel-head">
      <div class="intel-panel-kicker">${t('section_actions')}</div>
      <span class="intel-panel-count">${String(actions.length || 0).padStart(2, '0')}</span>
    </div>
    <div class="action-panel-title">${t('section_actions')}</div>
    <div class="intel-block compact">
      <div class="intel-block-label">${t('block_business_actions')}</div>
      ${renderPointList(actions, 'intel-points compact')}
    </div>
    <div class="intel-block compact insight">
      <div class="intel-block-label">${t('block_overview_watchlist')}</div>
      ${renderPointList(watchlist, 'intel-points compact')}
    </div>
  `;
  return panel;
}

function renderTopicTheater(topics) {
  const section = el('section', 'topic-theater-panel');
  section.innerHTML = `
    <div class="intel-panel-head">
      <div class="intel-panel-kicker">${t('section_topics')}</div>
      <span class="intel-panel-count">${String((topics || []).length).padStart(2, '0')}</span>
    </div>
    <div class="topic-card-grid">
      ${(topics || []).length ? topics.map((topic) => renderTopicBriefCard(topic)).join('') : `<div class="mini-empty">${t('card_empty')}</div>`}
    </div>
  `;
  section.querySelectorAll('[data-topic-id]').forEach((btn) => {
    btn.addEventListener('click', () => navigateToTopic(btn.dataset.topicId));
  });
  return section;
}

function renderTopicBriefCard(topic) {
  const points = resolvePointList(topic.key_points, '', 2, 88);
  const actions = resolvePointList(topic.actions, '', 2, 88);
  const summary = (topic.summary_zh || '').trim();
  const compactSummary = summary.length > 110 ? `${summary.slice(0, 110).trim()}...` : summary;
  const topicStrategy = getTopicStrategyMeta(topic);
  return `
    <article class="topic-brief-card">
      <div class="topic-brief-topline">
        <span class="source-badge official">${escapeHtml(topic.topic_name_zh || '')}</span>
        <span class="ip-badge general">${topic.item_count || 0}</span>
        <span class="topic-brief-micro">${topic.source_count || 0} ${t('stat_sources')}</span>
        ${topicStrategy ? `<span class="topic-window-pill">${escapeHtml(topicStrategy.label)}</span>` : ''}
      </div>
      <h3 class="topic-brief-title">${escapeHtml(topic.headline_zh || topic.topic_name_zh || '')}</h3>
      ${topic.headline_en ? `<div class="topic-brief-subtitle">${escapeHtml(topic.headline_en)}</div>` : ''}
      ${topicStrategy ? `<div class="topic-brief-subtitle">${escapeHtml(topicStrategy.hint)}</div>` : ''}
      <p class="topic-brief-summary">${escapeHtml(compactSummary)}</p>
      <div class="topic-brief-block">
        <div class="intel-block-label">${t('block_topic_points')}</div>
        ${renderPointList(points, 'intel-points compact')}
      </div>
      <div class="topic-brief-block">
        <div class="intel-block-label">${t('block_topic_actions')}</div>
        ${renderPointList(actions, 'intel-points compact')}
      </div>
      <div class="topic-brief-tier">${renderSourceTierSummary(topic)}</div>
      <button class="btn btn-secondary topic-brief-btn" data-topic-id="${escapeHtml(topic.topic_id || '')}">${t('topic_open')}</button>
    </article>
  `;
}

function applyTopicPreset(topicId) {
  state.currentPage = 'news';
  state.pagination.page = 1;
  state.focusViewExpanded = false;
  state.filters.editorial_lane = 'all';
  state.filters.source = '';
  switch (topicId) {
    case 'upc':
      state.filters.q = 'UPC';
      state.filters.ip_type = 'patent';
      break;
    case 'sep_frand':
      state.filters.q = 'FRAND';
      state.filters.ip_type = 'sep';
      break;
    case 'euipo':
      state.filters.q = '';
      state.filters.source = 'euipo';
      state.filters.ip_type = 'all';
      break;
    case 'counterfeit':
      state.filters.q = 'counterfeit';
      state.filters.ip_type = 'trademark';
      break;
    default:
      state.filters.q = '';
      state.filters.ip_type = 'all';
      break;
  }
  renderApp();
}

function isFocusedNewsMode() {
  return state.currentPage === 'news' && (
    state.filters.ip_type !== 'all' ||
    state.filters.editorial_lane !== getDefaultEditorialLaneSelection() ||
    state.filters.category !== 'all' ||
    Boolean(state.filters.source) ||
    Boolean(state.filters.q) ||
    Boolean(state.filters.has_ai) ||
    state.filters.scope !== 'eu'
  );
}

function isSepTimelineMode() {
  return state.currentPage === 'news' && state.filters.ip_type === 'sep';
}

function clearNewsFocusFilters() {
  state.currentPage = 'news';
  state.pagination.page = 1;
  state.focusViewExpanded = false;
  state.filters.ip_type = 'all';
  state.filters.editorial_lane = getDefaultEditorialLaneSelection();
  state.filters.category = 'all';
  state.filters.source = '';
  state.filters.q = '';
  state.filters.has_ai = false;
  state.filters.scope = 'eu';
  localStorage.setItem('pontnova_editorial_lane', state.filters.editorial_lane);
  localStorage.setItem('pontnova_scope', 'eu');
  renderApp();
}

function getFilterSourceLabel(sourceId) {
  if (!sourceId) return '';
  const sourceInfo = state.stats?.by_source?.[sourceId];
  return compactSourceName(sourceInfo?.name || sourceId);
}

function getActiveFocusLabels() {
  const labels = [];
  if (state.filters.ip_type && state.filters.ip_type !== 'all') labels.push(getIpTypeLabel(state.filters.ip_type));
  if (state.filters.editorial_lane && state.filters.editorial_lane !== getDefaultEditorialLaneSelection()) labels.push(t(`filter_lane_${state.filters.editorial_lane}`));
  if (state.filters.category && state.filters.category !== 'all') labels.push(t(`filter_${state.filters.category}`));
  if (state.filters.scope && state.filters.scope !== 'eu') labels.push(resolveScopeLabel(state.filters.scope));
  if (state.filters.source) labels.push(getFilterSourceLabel(state.filters.source));
  if (state.filters.q) labels.push(`"${state.filters.q}"`);
  if (state.filters.has_ai) labels.push(t('focus_mode_ai_only'));
  return labels;
}

function getFocusedViewTitle() {
  const labels = getActiveFocusLabels();
  if (!labels.length) return t('focus_mode_title');
  if (state.lang === 'zh') {
    if (labels.length === 1) return `${labels[0]}聚焦浏览`;
    return `${labels.join(' · ')} 聚焦浏览`;
  }
  return `${labels.join(' · ')} Briefing View`;
}

function renderFocusedNewsIntro(stats, total, items, summary = {}, topics = []) {
  const activeLabels = getActiveFocusLabels();
  const sourceCount = Number(summary.source_count_total ?? new Set((items || []).map((item) => item.source_id || item.source_name).filter(Boolean)).size);
  const aiReady = Number(summary.ai_done_total ?? (items || []).filter((item) => item.ai_status === 'done').length);
  const lastRefresh = formatDateTimeLabel(stats?.last_scrape_time || stats?.last_analyze_time || '');
  const isSepFocus = state.filters.ip_type === 'sep';
  const sepTopic = isSepFocus ? (topics || []).find((topic) => topic.topic_id === 'sep_frand') : null;
  const sepAiAnalysis = sepTopic?.sep_ai_analysis || {};
  const sepInsightCount = Array.isArray(sepAiAnalysis.insight_cards) ? sepAiAnalysis.insight_cards.length : 0;
  const sepMonthCount = Array.isArray(sepAiAnalysis.monthly_series) ? sepAiAnalysis.monthly_series.length : 0;
  const sepJudgmentCount = Array.isArray(sepAiAnalysis.trend_judgments) ? sepAiAnalysis.trend_judgments.length : 0;
  const wrap = el('section', 'focus-mode-shell');
  wrap.innerHTML = `
    <div class="focus-mode-head">
      <div class="focus-mode-copy">
        <div class="section-kicker">${t('focus_mode_kicker')}</div>
        <h2 class="focus-mode-title">${escapeHtml(getFocusedViewTitle())}</h2>
        <p class="focus-mode-desc">${escapeHtml(t('focus_mode_desc'))}</p>
      </div>
      <div class="focus-mode-actions">
        <button class="btn btn-secondary" data-focus-toggle>${state.focusViewExpanded ? t('focus_mode_collapse') : t('focus_mode_expand')}</button>
        <button class="btn btn-secondary" data-focus-reset>${t('focus_mode_reset')}</button>
      </div>
    </div>
    <div class="focus-chip-row">
      ${activeLabels.length ? activeLabels.map((label) => `<span class="focus-chip">${escapeHtml(label)}</span>`).join('') : `<span class="focus-chip">${t('filter_scope_eu')}</span>`}
    </div>
    <div class="focus-mode-stats">
      <div class="focus-mode-stat">
        <span>${t('focus_mode_results')}</span>
        <strong>${total.toLocaleString()}</strong>
      </div>
      <div class="focus-mode-stat">
        <span>${t('focus_mode_sources')}</span>
        <strong>${sourceCount.toLocaleString()}</strong>
      </div>
      <div class="focus-mode-stat">
        <span>${t('focus_mode_ai')}</span>
        <strong>${aiReady.toLocaleString()}</strong>
      </div>
      <div class="focus-mode-stat">
        <span>${t('hero_refresh')}</span>
        <strong>${lastRefresh || '—'}</strong>
      </div>
    </div>
    ${sepTopic ? `
      <div class="focus-mode-ai-bridge">
        <div class="focus-mode-ai-bridge-copy">
          <div class="focus-mode-ai-bridge-title">${t('focus_mode_sep_ai_title')}</div>
          <p class="focus-mode-ai-bridge-desc">${t('focus_mode_sep_ai_desc')}</p>
          <div class="focus-mode-ai-bridge-pills">
            ${sepInsightCount ? `<span class="focus-mode-ai-pill">${sepInsightCount} ${t('topic_sep_ai_preview_cards')}</span>` : ''}
            ${sepMonthCount ? `<span class="focus-mode-ai-pill">${sepMonthCount} ${t('topic_sep_ai_preview_months')}</span>` : ''}
            ${sepJudgmentCount ? `<span class="focus-mode-ai-pill">${sepJudgmentCount} ${t('topic_sep_ai_preview_judgments')}</span>` : ''}
          </div>
        </div>
        <div class="focus-mode-ai-bridge-actions">
          <button class="btn btn-primary" data-focus-open-sep-ai>${t('focus_mode_sep_ai_open')}</button>
        </div>
      </div>
    ` : ''}
  `;
  wrap.querySelector('[data-focus-toggle]')?.addEventListener('click', () => {
    state.focusViewExpanded = !state.focusViewExpanded;
    renderMainContent();
  });
  wrap.querySelector('[data-focus-reset]')?.addEventListener('click', clearNewsFocusFilters);
  wrap.querySelector('[data-focus-open-sep-ai]')?.addEventListener('click', () => {
    navigateToTopic('sep_frand', 'sep-ai-analysis');
  });
  return wrap;
}

function renderExpandedOverviewHeader() {
  return el('div', 'section-heading-row focus-overview-heading', `
    <div>
      <div class="section-kicker">${t('focus_mode_global_title')}</div>
      <h2 class="section-title">${t('focus_mode_global_title')}</h2>
    </div>
    <div class="section-meta">${t('focus_mode_global_desc')}</div>
  `);
}

async function appendGlobalDashboardSections(container, statsData, overviewData, dataTotal, boardItems, todayPublishedItems, dailyReport, weeklyReport, topics, pulseItems = []) {
  container.appendChild(renderWarRoomHero(statsData, overviewData, dataTotal));
  const audioSection = renderHomeAudioBriefSection(state.dailyAudioBrief);
  if (audioSection) container.appendChild(audioSection);
  container.appendChild(await renderEuropeHeatSection(pulseItems));
  container.appendChild(renderTodayPublishedSection(todayPublishedItems, statsData));
  container.appendChild(renderCommanderReports(dailyReport, weeklyReport, state.dailyAudioBrief, state.dailyAudioHistory, false));
  container.appendChild(renderTopicTheater(topics || []));
}

function renderStreamHeader(total, items = []) {
  const chronologySummary = buildChronologySummary(items);
  return el('div', 'section-heading-row', `
    <div>
      <div class="section-kicker">${t('section_pulse')}</div>
      <h2 class="section-title">${t('section_stream')}</h2>
    </div>
    <div class="section-meta">
      ${t('label_showing')}: <strong>${total.toLocaleString()}</strong>
      <span class="section-search-pill">${t('stream_sort_note')}</span>
      ${chronologySummary}
      ${state.filters.q ? `<span class="section-search-pill">"${escapeHtml(state.filters.q)}"</span>` : ''}
    </div>
  `);
}

function renderLatestDynamicsSnapshot(items) {
  const now = Date.now();
  const twoDaysMs = 48 * 60 * 60 * 1000;
  const candidates = [...(items || [])]
    .filter(isRelevantDisplayItem)
    .filter((item) => {
      const ts = Date.parse(item?.published_at || item?.scraped_at || '') || 0;
      return ts && (now - ts) <= twoDaysMs;
    })
    .sort((a, b) => {
      const aTs = Date.parse(a?.published_at || a?.scraped_at || '') || 0;
      const bTs = Date.parse(b?.published_at || b?.scraped_at || '') || 0;
      const aScore = getIntelPriorityScore(a);
      const bScore = getIntelPriorityScore(b);
      if (bScore !== aScore) return bScore - aScore;
      return bTs - aTs;
    })
    .slice(0, 3);
  const classifyLane = (item) => {
    const text = [item?.title || '', item?.title_zh || '', item?.summary || '', item?.ai_summary_zh || '', item?.ai_insight_zh || '']
      .join(' ')
      .toLowerCase();
    const docType = String(item?.ai_document_type || '').toLowerCase();
    const institutions = JSON.stringify(item?.ai_institutions || '').toLowerCase();
    if ((item?.category || '') === 'official') return 'official';
    if (
      ['judgment', 'order', 'decision', 'appeal'].includes(docType) ||
      /court|appeal|tribunal|injunction|upc|cjeu|fcj|constitutional complaint/.test(text) ||
      /court|upc|cjeu|fcj/.test(institutions)
    ) return 'court';
    if ((item?.ip_type || '') === 'sep' || /sep|frand|licen[sc]ing|patent pool|avanci/.test(text)) return 'sep';
    if (/appoint|joins|launches|deal|licen[sc]e|partnership|pool|acquire|hires|expands/.test(text)) return 'business';
    return 'all';
  };
  const laneCounts = { all: candidates.length, official: 0, court: 0, sep: 0, business: 0 };
  candidates.forEach((item) => {
    const lane = classifyLane(item);
    if (laneCounts[lane] !== undefined) laneCounts[lane] += 1;
  });
  const filterDefs = [
    ['all', t('latest_dynamics_filter_all')],
    ['official', t('latest_dynamics_filter_official')],
    ['court', t('latest_dynamics_filter_court')],
    ['sep', t('latest_dynamics_filter_sep')],
    ['business', t('latest_dynamics_filter_business')],
  ].filter(([key]) => key === 'all' || laneCounts[key] > 0);

  const section = el('section', 'latest-dynamics-section');
  section.innerHTML = `
    <div class="section-heading-row">
      <div>
        <div class="section-kicker">${t('section_latest_dynamics')}</div>
        <h2 class="section-title">${t('section_latest_dynamics')}</h2>
      </div>
      <div class="section-meta section-meta-column">
        <span>${t('section_latest_dynamics_desc')}</span>
        <span>${candidates.length} / 48h</span>
      </div>
    </div>
    ${candidates.length ? `
      <div class="latest-dynamics-filters">
        ${filterDefs.map(([key, label], index) => `
          <button class="latest-dynamics-filter${index === 0 ? ' active' : ''}" type="button" data-latest-filter="${key}">
            <span>${escapeHtml(label)}</span>
            <strong>${laneCounts[key] || 0}</strong>
          </button>
        `).join('')}
      </div>
      <div class="latest-dynamics-list">
        ${candidates.map((item) => {
          const title = (state.lang === 'zh' && item.title_zh) ? item.title_zh : (item.title || item.title_zh || '—');
          const originalTitle = item.title && item.title !== title ? item.title : '';
          const insight = item.ai_insight_zh || item.ai_summary_zh || item.summary || '';
          const keyPoints = resolvePointList(item.ai_key_points_zh, item.ai_summary_zh || item.summary || '', 2, 54);
          const lane = classifyLane(item);
          return `
            <div class="latest-dynamics-item" data-latest-lane="${escapeHtml(lane)}" data-latest-index="${candidates.indexOf(item)}" role="button" tabindex="0">
              <div class="latest-dynamics-topline">
                <span class="source-badge ${(item.category || '') === 'official' ? 'official' : ((item.category || '') === 'media' ? 'media' : 'lawfirm')}">${escapeHtml(compactSourceName(item.source_name || '') || '—')}</span>
                <span class="ip-badge ${item.ip_type || 'general'}">${getIpTypeLabel(item.ip_type || 'general')}</span>
                ${renderGeoBadges(item, true, 1)}
                <span class="latest-dynamics-date">${escapeHtml(buildPrimaryDateLabel(item))}</span>
              </div>
              <strong class="latest-dynamics-title">${escapeHtml(truncateText(title, 92))}</strong>
              ${originalTitle ? `
                <div class="latest-dynamics-title-sub">
                  <span>${escapeHtml(truncateText(originalTitle, 104))}</span>
                </div>
              ` : ''}
              <div class="latest-dynamics-points">
                ${(keyPoints.length ? keyPoints : [truncateText(insight, 54) || '—']).map((point) => `
                  <span class="latest-dynamics-point">${escapeHtml(point)}</span>
                `).join('')}
              </div>
              <div class="latest-dynamics-insight">${escapeHtml(truncateText(insight, 120) || '—')}</div>
              <div class="latest-dynamics-footer">
                <span class="latest-dynamics-footer-meta">${escapeHtml(compactSourceName(item.source_name || '—'))}</span>
                <div class="latest-dynamics-actions">
                  <button type="button" class="btn btn-secondary latest-dynamics-detail">${t('detail_view_btn')}</button>
                  <a href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener" class="read-more-link latest-dynamics-original">${t('detail_btn')}</a>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : `<div class="mini-empty">${t('section_latest_dynamics_empty')}</div>`}
  `;
  section.querySelectorAll('[data-latest-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lane = btn.dataset.latestFilter || 'all';
      section.querySelectorAll('[data-latest-filter]').forEach((node) => node.classList.toggle('active', node === btn));
      section.querySelectorAll('.latest-dynamics-item').forEach((card) => {
        const cardLane = card.dataset.latestLane || 'all';
        card.classList.toggle('is-hidden', lane !== 'all' && cardLane !== lane);
      });
    });
  });
  section.querySelectorAll('.latest-dynamics-item').forEach((card) => {
    const item = candidates[Number(card.dataset.latestIndex)];
    if (!item) return;
    card.addEventListener('click', () => showNewsDetail(item));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showNewsDetail(item);
      }
    });
  });
  section.querySelectorAll('.latest-dynamics-detail').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const card = btn.closest('.latest-dynamics-item');
      const item = candidates[Number(card?.dataset.latestIndex)];
      if (item) showNewsDetail(item);
    });
  });
  section.querySelectorAll('.latest-dynamics-original').forEach((link) => {
    link.addEventListener('click', (event) => event.stopPropagation());
  });
  return section;
}

function renderPriorityBrief(overview, items) {
  if (overview && (overview.headline_zh || overview.summary_zh)) {
    const card = el('section', 'priority-brief-card');
    const representative = getPriorityBriefItem(items);
    const topSignals = resolvePointList(overview.top_signals, '', 4, 120);
    const crossCurrents = resolvePointList(overview.cross_currents, '', 3, 118);
    const implications = resolvePointList(overview.implications, '', 3, 118);
    const watchlist = resolvePointList(overview.watchlist, '', 3, 118);
    const windowLabel = formatCollectionWindow(overview);
    const representativeTitle = representative
      ? ((state.lang === 'zh' && representative.title_zh) ? representative.title_zh : representative.title)
      : '';
    const representativeSub = representative && representative.title_zh ? representative.title : '';

    card.innerHTML = `
      <div class="section-kicker">${t('section_priority')}</div>
      <div class="priority-policy-note">${t('priority_policy_note')}</div>
      <div class="priority-topline">
        <span class="source-badge official">${t('block_overview_summary')}</span>
        <span class="ip-badge general">${windowLabel || resolveScopeLabel(state.filters.scope)}</span>
        <span class="priority-date">${overview.generated_from_cache ? 'cache' : t('label_latest_update')}</span>
      </div>
      <div class="priority-flag">${t('card_priority')}</div>
      <div class="intel-block intel-block-title">
        <h2 class="priority-title">${escapeHtml(overview.headline_zh || t('overview_pending'))}</h2>
        ${overview.headline_en ? `<div class="priority-subtitle">${escapeHtml(overview.headline_en)}</div>` : ''}
      </div>
      <div class="intel-block overview-summary-block">
        <div class="intel-block-label">${t('block_overview_summary')}</div>
        <p class="intel-summary-copy">${escapeHtml(overview.summary_zh || '')}</p>
      </div>
      <div class="intel-block-grid priority-overview-grid">
        <div class="intel-block">
          <div class="intel-block-label">${t('block_overview_signals')}</div>
          ${renderPointList(topSignals)}
        </div>
        <div class="intel-block insight">
          <div class="intel-block-label">${t('block_overview_cross')}</div>
          ${renderPointList(crossCurrents)}
        </div>
        <div class="intel-block">
          <div class="intel-block-label">${t('block_overview_implications')}</div>
          ${renderPointList(implications)}
        </div>
        <div class="intel-block insight">
          <div class="intel-block-label">${t('block_overview_watchlist')}</div>
          ${renderPointList(watchlist)}
        </div>
      </div>
      <div class="intel-block intel-link-block overview-meta-block">
        <div class="intel-block-grid priority-meta-grid">
          <div class="overview-basis">
            <div class="intel-block-label">${t('block_overview_basis')}</div>
            <div class="overview-basis-copy">${escapeHtml(`${windowLabel || ''} · ${overview.item_count || 0} / ${overview.source_count || 0}`.replace(/^\s*·\s*/, ''))}</div>
          </div>
          ${representative ? `
            <div class="overview-representative">
              <div class="intel-block-label">${t('block_representative_signal')}</div>
              <div class="overview-representative-copy">
                <strong>${escapeHtml(representativeTitle)}</strong>
                ${representativeSub ? `<span>${escapeHtml(representativeSub)}</span>` : ''}
              </div>
            </div>
          ` : ''}
        </div>
        ${representative ? `
          <div class="intel-link-row">
            <div class="intel-link-meta">
              <strong>${escapeHtml(compactSourceName(representative.source_name || '—'))}</strong>
              <span>${escapeHtml(buildOriginalLinkDateMeta(representative))}</span>
            </div>
            <div class="priority-actions">
              <button class="btn btn-secondary priority-open-modal">${t('btn_read_more')}</button>
              <a href="${representative.url}" target="_blank" rel="noopener" class="btn btn-primary">${t('detail_btn')}</a>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    card.querySelector('.priority-open-modal')?.addEventListener('click', () => showNewsDetail(representative));
    return card;
  }

  const item = getPriorityBriefItem(items);
  const card = el('section', 'priority-brief-card');
  if (!item) {
    card.innerHTML = `<div class="mini-empty">${t('card_empty')}</div>`;
    return card;
  }

  const primaryTitle = state.lang === 'zh' && item.title_zh ? item.title_zh : item.title;
  const secondaryTitle = item.title && item.title !== primaryTitle ? item.title : '';
  const summary = item.ai_summary_zh || item.summary || '';
  const insight = item.ai_insight_zh || '';
  const date = formatDate(item.published_at || item.scraped_at);
  const linkDateMeta = buildOriginalLinkDateMeta(item);
  const titleVariant = getHeadlineVariantClass(primaryTitle);
  const fallbackSummary = buildFallbackBrief(item, 'summary');
  const fallbackSignal = buildFallbackBrief(item, 'signal');
  const summaryPoints = resolvePointList(item.ai_core_points_zh, summary || fallbackSummary, 3, 120);
  const insightPoints = resolvePointList(item.ai_insight_points_zh, insight || fallbackSignal, 2, 110);

  card.innerHTML = `
    <div class="section-kicker">${t('section_priority')}</div>
    <div class="priority-policy-note">${t('priority_policy_note')}</div>
    <div class="priority-topline">
      <span class="source-badge ${item.category || 'media'}">${escapeHtml(item.source_name || '')}</span>
      <span class="ip-badge ${item.ip_type || 'general'}">${getIpTypeLabel(item.ip_type || 'general')}</span>
      ${renderGeoBadges(item)}
      ${renderAnalysisDepthBadge(item, true)}
      ${renderSignalTagPills(item, true)}
      <span class="priority-date">${date}</span>
    </div>
    <div class="priority-flag">${t('card_priority')}</div>
    <div class="intel-block intel-block-title">
      <h2 class="priority-title ${titleVariant}">${escapeHtml(primaryTitle)}</h2>
      ${secondaryTitle ? `<div class="priority-subtitle">${escapeHtml(secondaryTitle)}</div>` : ''}
    </div>
    <div class="intel-block-grid priority-brief-grid">
      <div class="intel-block">
        <div class="intel-block-label">${t('block_core_points')}</div>
        ${renderPointList(summaryPoints)}
      </div>
      <div class="intel-block insight">
        <div class="intel-block-label">${t('block_insight')}</div>
        ${renderPointList(insightPoints)}
      </div>
    </div>
    <div class="intel-block intel-link-block">
      <div class="intel-block-label">${t('block_original_link')}</div>
      <div class="intel-link-row">
        <div class="intel-link-meta">
          <strong>${escapeHtml(compactSourceName(item.source_name || '—'))}</strong>
          <span>${escapeHtml(linkDateMeta)}</span>
        </div>
        <div class="priority-actions">
          <button class="btn btn-secondary priority-open-modal">${t('btn_read_more')}</button>
          <a href="${item.url}" target="_blank" rel="noopener" class="btn btn-primary">${t('detail_btn')}</a>
        </div>
      </div>
    </div>
  `;
  card.querySelector('.priority-open-modal')?.addEventListener('click', () => showNewsDetail(item));
  return card;
}

function renderWarRoomSide(stats, items) {
  const side = el('aside', 'warroom-side');
  const latestItems = sortBySignalPriority(items, 'stream').slice(0, 5);
  const topTypes = getTopTypeEntries(stats, 5);
  const topSources = getTopSourceEntries(stats, 6);

  const latest = el('section', 'intel-panel');
  latest.innerHTML = `
    <div class="intel-panel-head">
      <div class="intel-panel-kicker">${t('card_latest')}</div>
      <span class="intel-panel-count">${String(latestItems.length).padStart(2, '0')}</span>
    </div>
    <div class="signal-list">
      ${latestItems.length ? latestItems.map((item, index) => `
        <button class="signal-row timeline-row" data-signal-index="${index}">
          <span class="timeline-rail ${index === 0 ? 'is-start' : ''} ${index === latestItems.length - 1 ? 'is-end' : ''}">
            <span class="timeline-index">${String(index + 1).padStart(2, '0')}</span>
          </span>
          <span class="signal-copy">
            <span class="signal-meta">
              <span class="signal-meta-left">
                <span class="signal-source">${escapeHtml(item.source_name || '')}</span>
                <span class="signal-tag ${item.ip_type || 'general'}">${getIpTypeLabel(item.ip_type || 'general')}</span>
                ${renderGeoBadges(item, true)}
              </span>
              <em class="signal-stamp">${escapeHtml(buildPrimaryDateLabel(item))}</em>
            </span>
            <strong>${escapeHtml((state.lang === 'zh' && item.title_zh) ? item.title_zh : item.title)}</strong>
          </span>
        </button>
      `).join('') : `<div class="mini-empty">${t('card_empty')}</div>`}
    </div>
  `;

  const mix = el('section', 'intel-panel');
  mix.innerHTML = `
    <div class="intel-panel-head">
      <div class="intel-panel-kicker">${t('card_mix')}</div>
      <span class="intel-panel-count">${String(topTypes.length).padStart(2, '0')}</span>
    </div>
    <div class="mix-list">
      ${topTypes.length ? topTypes.map((entry) => `
        <div class="mix-row">
          <span>${getIpTypeLabel(entry.key)}</span>
          <div class="mix-bar"><div style="width:${entry.ratio}%"></div></div>
          <strong>${entry.count}</strong>
        </div>
      `).join('') : `<div class="mini-empty">${t('card_empty')}</div>`}
    </div>
  `;

  const sources = el('section', 'intel-panel');
  sources.innerHTML = `
    <div class="intel-panel-head">
      <div class="intel-panel-kicker">${t('card_main_sources')}</div>
      <span class="intel-panel-count">${String(topSources.length).padStart(2, '0')}</span>
    </div>
    <div class="source-panel-note">${t('hero_source_policy')}</div>
    <div class="source-list">
      ${topSources.length ? topSources.map((entry) => `
        <div class="source-list-row">
          <div class="source-list-row-top">
            <span class="source-list-name">${escapeHtml(entry.name)}</span>
            <strong>${entry.count}</strong>
          </div>
          <div class="source-list-row-meta">${renderSourceTierPill(entry)}</div>
        </div>
      `).join('') : `<div class="mini-empty">${t('card_empty')}</div>`}
    </div>
  `;

  latest.querySelectorAll('[data-signal-index]').forEach((btn) => {
    btn.addEventListener('click', () => showNewsDetail(latestItems[Number(btn.dataset.signalIndex)]));
  });

  side.appendChild(latest);
  side.appendChild(mix);
  side.appendChild(sources);
  return side;
}

function getTopSourceEntries(stats, limit = 5) {
  return Object.entries(stats.by_source || {})
    .map(([id, info]) => {
      const source = getSourceById(id) || {};
      return {
        id,
        name: info.name || id,
        count: info.count || 0,
        category: source.category || '',
        quality_tier: getSourceQualityTier(source),
      };
    })
    .sort((a, b) => (getSourceTierRank(a) - getSourceTierRank(b)) || (b.count - a.count))
    .slice(0, limit);
}

function getAuthorityBeltEntries(stats, limit = 7) {
  const preferred = ['epo', 'euipo', 'upc', 'cjeu', 'ukipo', 'iam', 'managingip', 'juve'];
  const all = Object.entries(stats.by_source || {})
    .map(([id, info]) => ({ id, name: info.name || id, count: info.count || 0 }))
    .sort((a, b) => b.count - a.count);
  const map = new Map(all.map((entry) => [entry.id, entry]));
  const picked = [];

  preferred.forEach((id) => {
    if (map.has(id)) picked.push(map.get(id));
  });
  all.forEach((entry) => {
    if (!picked.some((pickedEntry) => pickedEntry.id === entry.id)) picked.push(entry);
  });
  return picked.slice(0, limit);
}

function compactSourceName(name) {
  return (name || '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^The\s+/i, '')
    .trim();
}

function truncateText(text, maxLength = 160) {
  const value = (text || '').replace(/\s+/g, ' ').trim();
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function buildFallbackBrief(item, mode = 'summary') {
  const source = compactSourceName(item?.source_name || '') || '该来源';
  const ipLabel = getIpTypeLabel(item?.ip_type || 'general');
  const date = buildPrimaryDateLabel(item);
  if (state.lang === 'zh') {
    if (mode === 'signal') {
      return `${source} 的这条${ipLabel}动态已进入优先观察区，建议优先打开原文并结合后续 AI 解读判断影响。`;
    }
    return `这是一条来自 ${source} 的${ipLabel}最新动态，时间为 ${date}；当前可先结合原文快速判断制度变化、执法动向或市场影响。`;
  }
  if (mode === 'signal') {
    return `This ${ipLabel.toLowerCase()} signal from ${source} is now in the priority watch zone; review the source item first and pair it with the AI brief as it lands.`;
  }
  return `This is a fresh ${ipLabel.toLowerCase()} update from ${source}, dated ${date}; review the original item first to assess legal, enforcement or market impact.`;
}

function parseStructuredPointList(value, maxItems = 3, maxLength = 120) {
  if (!value) return [];
  let parts = [];
  if (Array.isArray(value)) {
    parts = value;
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) parts = parsed;
    } catch {
      parts = [];
    }
  }
  return parts
    .map((part) => truncateText(String(part || '').trim(), maxLength))
    .filter((part) => part.length > 1)
    .slice(0, maxItems);
}

function resolvePointList(structuredValue, fallbackText, maxItems = 3, maxLength = 120) {
  const structured = parseStructuredPointList(structuredValue, maxItems, maxLength);
  if (structured.length) return structured;
  return extractPointList(fallbackText, maxItems, maxLength);
}

function extractPointList(text, maxItems = 3, maxLength = 120) {
  const value = (text || '').replace(/\s+/g, ' ').trim();
  if (!value) return [];
  const normalized = value
    .replace(/[•▪●◦]/g, '\n')
    .replace(/；/g, '；\n')
    .replace(/;/g, ';\n')
    .replace(/。/g, '。\n')
    .replace(/\.\s+(?=[A-Z])/g, '.\n');
  const parts = normalized
    .split(/\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 6);
  const picked = (parts.length ? parts : [value])
    .slice(0, maxItems)
    .map((part) => truncateText(part.replace(/^[-–—]\s*/, ''), maxLength));
  return picked;
}

function renderPointList(points, className = 'intel-points') {
  if (!points.length) return '';
  return `
    <ul class="${className}">
      ${points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}
    </ul>
  `;
}

function renderExpandablePointList(points, className = 'intel-points', visibleCount = 3) {
  if (!points.length) return '';
  if (points.length <= visibleCount) return renderPointList(points, className);
  const visiblePoints = points.slice(0, visibleCount);
  const extraPoints = points.slice(visibleCount);
  return `
    <div class="report-points-shell">
      ${renderPointList(visiblePoints, className)}
      <details class="report-points-more">
        <summary class="report-points-summary">
          <span class="report-points-summary-closed">${t('report_points_expand')}</span>
          <span class="report-points-summary-open">${t('report_points_collapse')}</span>
        </summary>
        ${renderPointList(extraPoints, `${className} report-points-extra`)}
      </details>
    </div>
  `;
}

function getTopTypeEntries(stats, limit = 5) {
  const total = Object.values(stats.by_ip_type || {}).reduce((sum, count) => sum + count, 0) || 1;
  return Object.entries(stats.by_ip_type || {})
    .map(([key, count]) => ({ key, count, ratio: Math.max(10, Math.round((count / total) * 100)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getLeadingType(stats) {
  return getTopTypeEntries(stats, 1)[0]?.key || 'general';
}

function resolveScopeLabel(scope) {
  if (!scope || scope === 'all') return t('label_scope_all');
  const key = `filter_scope_${scope}`;
  return t(key) === key ? scope.toUpperCase() : t(key);
}

function getGeoLabel(item) {
  if (!item) return '';
  return state.lang === 'zh' ? (item.geo_label_zh || '') : (item.geo_label_en || '');
}

function getGeoLabels(item) {
  if (!item) return [];
  const labels = state.lang === 'zh'
    ? (item.geo_tag_labels_zh || [])
    : (item.geo_tag_labels_en || []);
  if (Array.isArray(labels) && labels.length) return labels.filter(Boolean);
  const primary = getGeoLabel(item);
  return primary ? [primary] : [];
}

function renderGeoBadges(item, compact = false, maxItems = 2) {
  const labels = getGeoLabels(item);
  if (!labels.length) return '';
  const primary = getGeoLabel(item);
  const ordered = [];
  if (primary) ordered.push(primary);
  labels.forEach((label) => {
    if (label && !ordered.includes(label)) ordered.push(label);
  });
  return `<span class="geo-badges">${ordered.slice(0, maxItems).map((label) => `<span class="geo-badge${compact ? ' compact' : ''}">${escapeHtml(label)}</span>`).join('')}</span>`;
}

function getEuropeHeatLabel(id) {
  const labels = {
    eu: { zh: '欧洲范围', en: 'Europe-wide' },
    uk: { zh: '英国', en: 'United Kingdom' },
    ie: { zh: '爱尔兰', en: 'Ireland' },
    pt: { zh: '葡萄牙', en: 'Portugal' },
    es: { zh: '西班牙', en: 'Spain' },
    fr: { zh: '法国', en: 'France' },
    benelux: { zh: '比荷卢', en: 'Benelux' },
    de: { zh: '德国', en: 'Germany' },
    ch: { zh: '瑞士', en: 'Switzerland' },
    it: { zh: '意大利', en: 'Italy' },
    dk: { zh: '丹麦', en: 'Denmark' },
    scandinavia: { zh: '北欧', en: 'Nordics' },
    pl: { zh: '波兰', en: 'Poland' },
    sk: { zh: '斯洛伐克', en: 'Slovakia' },
    hu: { zh: '匈牙利', en: 'Hungary' },
    si: { zh: '斯洛文尼亚', en: 'Slovenia' },
    bg: { zh: '保加利亚', en: 'Bulgaria' },
    gr: { zh: '希腊', en: 'Greece' },
    mt: { zh: '马耳他', en: 'Malta' },
    cy: { zh: '塞浦路斯', en: 'Cyprus' },
    lt: { zh: '立陶宛', en: 'Lithuania' },
    al: { zh: '阿尔巴尼亚', en: 'Albania' },
  };
  const entry = labels[id];
  if (!entry) {
    const regionName = getIntlRegionDisplayName(id);
    return regionName || (id ? id.toUpperCase() : '—');
  }
  return state.lang === 'zh' ? entry.zh : entry.en;
}

function getIntlRegionDisplayName(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (normalized.length !== 2) return '';
  try {
    const displayNames = state.lang === 'zh'
      ? (regionDisplayNamesZh ||= new Intl.DisplayNames(['zh-Hans'], { type: 'region' }))
      : (regionDisplayNamesEn ||= new Intl.DisplayNames(['en'], { type: 'region' }));
    return displayNames.of(normalized) || '';
  } catch {
    return '';
  }
}

function getEuropeHeatShortLabel(id) {
  const labels = {
    uk: 'UK',
    ie: 'IE',
    pt: 'PT',
    es: 'ES',
    fr: 'FR',
    benelux: 'BNX',
    de: 'DE',
    ch: 'CH',
    it: 'IT',
    dk: 'DK',
    scandinavia: 'NORD',
    pl: 'PL',
    sk: 'SK',
    hu: 'HU',
    si: 'SI',
    bg: 'BG',
    gr: 'GR',
    mt: 'MT',
    cy: 'CY',
    lt: 'LT',
    al: 'AL',
  };
  return labels[id] || id.toUpperCase();
}

function getEuropeHeatMapLabel(entry) {
  if (!entry) return '—';
  if (state.lang === 'en' && entry.label_en) return entry.label_en;
  if (state.lang === 'zh' && entry.label_zh) return entry.label_zh;
  return getEuropeHeatLabel(entry.id);
}

function normalizeGeoHeatTags(rawTags) {
  const tags = new Set();
  const values = Array.isArray(rawTags) ? rawTags : (rawTags ? [rawTags] : []);
  values.forEach((value) => {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return;
    if (key === 'gb') {
      tags.add('uk');
      return;
    }
    tags.add(key);
  });
  if (['be', 'nl', 'lu'].some((key) => tags.has(key))) tags.delete('benelux');
  if (['is', 'no', 'se', 'fi', 'dk'].some((key) => tags.has(key))) tags.delete('scandinavia');
  return [...tags];
}

function getEuropeHeatTargetLabel(targetId) {
  const key = String(targetId || '').trim().toLowerCase();
  if (!key) return '—';
  if (key === 'upc_overall') return t('section_europe_heat_upc_overall');
  if (['uk', 'benelux', 'scandinavia', 'eu'].includes(key)) return getEuropeHeatLabel(key);
  if (key === 'gb') return state.lang === 'zh' ? '英国' : 'United Kingdom';
  return getIntlRegionDisplayName(key) || getEuropeHeatLabel(key);
}

function getEuropeHeatTargetMeta(targetId) {
  const key = String(targetId || '').trim().toLowerCase();
  if (!key) return null;
  if (key === 'upc_overall') {
    return {
      id: key,
      label: getEuropeHeatTargetLabel(key),
      matchTags: [key],
    };
  }
  return {
    id: key,
    label: getEuropeHeatTargetLabel(key),
    matchTags: EUROPE_HEAT_TARGET_MATCHES[key] || [key],
  };
}

function parseStringArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((entry) => String(entry || '').trim()).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((entry) => String(entry || '').trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
  return [];
}

function getEuropeHeatTargetKeySet(targetId) {
  const target = getEuropeHeatTargetMeta(targetId);
  return new Set(target?.matchTags || []);
}

function targetsEquivalent(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const aSet = getEuropeHeatTargetKeySet(a);
  const bSet = getEuropeHeatTargetKeySet(b);
  for (const key of aSet) {
    if (bSet.has(key)) return true;
  }
  return false;
}

function matchesEuropeHeatTarget(tag, targetId) {
  const normalizedTag = String(tag || '').trim().toLowerCase();
  if (!normalizedTag) return false;
  return getEuropeHeatTargetKeySet(targetId).has(normalizedTag);
}

function getEuropeHeatBaseText(item) {
  return [
    item?.title || '',
    item?.summary || '',
    item?.content || '',
    item?.ai_summary_zh || '',
  ].join(' ').toLowerCase();
}

function isUpcItem(item) {
  const institutions = parseStringArray(item?.ai_institutions_list || item?.ai_institutions).map((entry) => entry.toLowerCase());
  if (institutions.includes('upc')) return true;
  const sourceId = String(item?.source_id || '').trim().toLowerCase();
  if (sourceId === 'upc') return true;
  const text = getEuropeHeatBaseText(item);
  return /\bunified patent court\b|\bupc\b|local division|court of appeal|central division|regional division/.test(text);
}

function getUpcForumPrimaryTarget(item) {
  if (!isUpcItem(item)) return '';
  const text = getEuropeHeatBaseText(item);
  const forumRules = [
    { target: 'lu', patterns: [/\bcourt of appeal\b/, /\bluxembourg\b/] },
    { target: 'fr', patterns: [/paris local division/, /\bparis ld\b/, /central division[^.]{0,30}\bparis\b/, /\bparis\b[^.]{0,30}local division/] },
    { target: 'de', patterns: [/d[üu]sseldorf local division/, /\bd[üu]sseldorf ld\b/, /mannheim local division/, /\bmannheim ld\b/, /munich local division/, /\bmunich ld\b/, /hamburg local division/, /\bhamburg ld\b/, /central division[^.]{0,30}\bmunich\b/] },
    { target: 'nl', patterns: [/the hague local division/, /\bhague local division\b/, /\bthe hague ld\b/, /\bhague ld\b/] },
    { target: 'it', patterns: [/milan local division/, /\bmilan ld\b/, /central division[^.]{0,30}\bmilan\b/] },
    { target: 'be', patterns: [/brussels local division/, /\bbrussels ld\b/] },
    { target: 'dk', patterns: [/copenhagen local division/, /\bcopenhagen ld\b/] },
    { target: 'fi', patterns: [/helsinki local division/, /\bhelsinki ld\b/] },
    { target: 'at', patterns: [/vienna local division/, /\bvienna ld\b/] },
    { target: 'pt', patterns: [/lisbon local division/, /\blisbon ld\b/] },
    { target: 'scandinavia', patterns: [/nordic[-\s]baltic regional division/, /nordic baltic regional division/] },
  ];
  for (const rule of forumRules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) return rule.target;
  }
  return '';
}

function isUpcOverallItem(item, forumPrimary = '') {
  if (!isUpcItem(item) || forumPrimary) return false;
  const text = getEuropeHeatBaseText(item);
  const sourceId = String(item?.source_id || '').trim().toLowerCase();
  if (sourceId === 'upc' && !/local division|court of appeal|central division|regional division/.test(text)) return true;
  return /monthly statistics|statistics publication|presidium|judicial compositions|oath taking|appointed judges|rules of procedure|court fees|registry|case management|cms|mediation|arbitration|committee|annual report|representatives/.test(text);
}

function getEuropeHeatItemRouting(item) {
  const tags = normalizeGeoHeatTags(item?.geo_tags_list || []);
  const specificTags = tags.filter((tag) => !['eu', 'intl'].includes(tag));
  const primaryScope = String(item?.primary_scope || item?.ai_primary_scope || '').trim().toLowerCase();
  if (isUpcItem(item)) {
    const forumPrimary = getUpcForumPrimaryTarget(item);
    const upcOverall = isUpcOverallItem(item, forumPrimary);
    const primaryTargets = forumPrimary ? [forumPrimary] : [];
    const relatedTargets = specificTags.filter((tag) => !primaryTargets.some((primary) => targetsEquivalent(primary, tag)));
    return {
      upc: true,
      upcOverall,
      primaryTargets,
      relatedTargets,
      displayTargets: upcOverall ? [] : (primaryTargets.length ? primaryTargets : relatedTargets),
      tags,
    };
  }
  const primaryTargets = [];
  if (primaryScope && !['eu', 'intl'].includes(primaryScope)) {
    primaryTargets.push(primaryScope);
  } else if (specificTags.length === 1) {
    primaryTargets.push(specificTags[0]);
  }
  const relatedTargets = specificTags.filter((tag) => !primaryTargets.some((primary) => targetsEquivalent(primary, tag)));
  return {
    upc: false,
    upcOverall: false,
    primaryTargets,
    relatedTargets,
    displayTargets: specificTags,
    tags,
  };
}

function getEuropeHeatItemsForTarget(items, targetId) {
  const target = getEuropeHeatTargetMeta(targetId);
  if (!target) return { primaryItems: [], relatedItems: [], total: 0 };
  const primaryItems = [];
  const relatedItems = [];
  (items || []).filter(isRelevantDisplayItem).forEach((item) => {
    const routing = getEuropeHeatItemRouting(item);
    if (target.id === 'upc_overall') {
      if (routing.upcOverall) primaryItems.push(item);
      return;
    }
    const primaryMatch = routing.primaryTargets.some((entry) => matchesEuropeHeatTarget(entry, target.id));
    const relatedMatch = routing.relatedTargets.some((entry) => matchesEuropeHeatTarget(entry, target.id));
    const displayMatch = routing.displayTargets.some((entry) => matchesEuropeHeatTarget(entry, target.id));
    if (primaryMatch) {
      primaryItems.push(item);
    } else if (relatedMatch || displayMatch) {
      relatedItems.push(item);
    }
  });
  const dedupedRelated = relatedItems.filter((item) => !primaryItems.some((primary) => primary.id === item.id));
  const sortItems = (list) => sortBySignalPriority(list, 'stream');
  return {
    primaryItems: sortItems(primaryItems),
    relatedItems: sortItems(dedupedRelated),
    total: primaryItems.length + dedupedRelated.length,
  };
}

function buildEuropeHeatData(items) {
  const ordered = sortByChronology((items || []).filter(isRelevantDisplayItem));
  const timestamps = ordered.map((item) => parseItemTimestamp(item)).filter(Boolean);
  const latestTs = timestamps[0] || Date.now();
  const cutoffTs = latestTs - (7 * 24 * 60 * 60 * 1000);
  let recentItems = ordered.filter((item) => {
    const ts = parseItemTimestamp(item);
    return ts && ts >= cutoffTs;
  });
  if (recentItems.length < 18) recentItems = ordered.slice(0, Math.min(ordered.length, 90));

  const counts = new Map();
  let europeWideCount = 0;
  let upcOverallCount = 0;

  recentItems.forEach((item) => {
    const routing = getEuropeHeatItemRouting(item);
    const tags = routing.tags || normalizeGeoHeatTags(item?.geo_tags_list || []);
    const seen = new Set();
    if (tags.includes('eu')) europeWideCount += 1;
    if (routing.upcOverall) {
      upcOverallCount += 1;
      return;
    }
    const heatTargets = routing.upc ? routing.primaryTargets : routing.displayTargets;
    heatTargets.forEach((tag) => {
      if (!tag || ['eu', 'intl'].includes(tag) || seen.has(tag)) return;
      seen.add(tag);
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });

  const hotspots = [...counts.entries()]
    .map(([id, count]) => ({
      id,
      count,
      label: getEuropeHeatTargetLabel(id),
      shortLabel: getEuropeHeatShortLabel(id),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    europeWideCount,
    upcOverallCount,
    hotspots,
    maxCount: hotspots[0]?.count || 1,
  };
}

function getEuropeHeatTone(count, maxCount) {
  const ratio = count / (maxCount || 1);
  if (ratio >= 0.72) return 'hot';
  if (ratio >= 0.42) return 'warm';
  return 'steady';
}

function getEuropeHeatShapeIds(id) {
  return EUROPE_HEAT_SHAPE_GROUPS[id] || [id];
}

async function loadEuropeHeatBaseMapMarkup() {
  if (!europeHeatBaseMapPromise) {
    europeHeatBaseMapPromise = fetch(EUROPE_HEAT_MAP_ASSET)
      .then((response) => (response.ok ? response.text() : ''))
      .then((text) => {
        const match = text.match(/<g class="europe-base-map"[\s\S]*<\/g>/i);
        return match ? match[0] : '';
      })
      .catch((error) => {
        console.warn('Failed to load Europe heat base map', error);
        return '';
      });
  }
  return europeHeatBaseMapPromise;
}

function decorateEuropeHeatMapMarkup(mapMarkup, hotspots, maxCount) {
  const toneByIso = new Map();
  hotspots.forEach((entry) => {
    const tone = getEuropeHeatTone(entry.count, maxCount);
    getEuropeHeatShapeIds(entry.id).forEach((iso) => toneByIso.set(iso, tone));
  });
  return mapMarkup.replace(/<path id="country-([a-z]+)"([^>]*)\/>/gi, (full, iso, rest) => {
    const normalizedIso = String(iso).toLowerCase();
    const tone = toneByIso.get(normalizedIso) || 'base';
    const label = escapeHtml(getEuropeHeatTargetLabel(normalizedIso));
    return `<path id="country-${normalizedIso}" class="europe-heat-country ${tone}" data-heat-target="${normalizedIso}" role="button" tabindex="0" aria-label="${label}"${rest}></path>`;
  });
}

function formatEuropeHeatTooltipCount(total) {
  const count = Number(total) || 0;
  if (!count) return '';
  return state.lang === 'zh'
    ? `${count}${t('section_europe_heat_hover_count')}`
    : `${count} ${t('section_europe_heat_hover_count')}`;
}

function normalizeEuropeHeatMembershipCode(targetId) {
  const normalized = String(targetId || '').trim().toLowerCase();
  if (normalized === 'gb') return 'uk';
  return normalized;
}

function getEuropeHeatMembershipFlags(targetId) {
  const code = normalizeEuropeHeatMembershipCode(targetId);
  return [
    EUROPE_HEAT_EU_MEMBER_CODES.has(code) ? { id: 'eu', label: 'EU' } : null,
    EUROPE_HEAT_UPC_MEMBER_CODES.has(code) ? { id: 'upc', label: 'UPC' } : null,
    EUROPE_HEAT_EPC_MEMBER_CODES.has(code) ? { id: 'epc', label: 'EPC' } : null,
  ].filter(Boolean);
}

function showEuropeHeatCountryModal(targetId, items) {
  const target = getEuropeHeatTargetMeta(targetId);
  if (!target) return;
  const root = document.getElementById('modal-root');
  const matched = getEuropeHeatItemsForTarget(items, target.id);
  const primaryItems = matched.primaryItems.slice(0, 6);
  const relatedItems = matched.relatedItems.slice(0, 6);

  const overlay = el('div', 'modal-overlay');
  overlay.innerHTML = `
    <div class="modal modal-wide europe-heat-modal">
      <div class="modal-header">
        <div class="modal-header-copy">
          <div class="modal-header-tags">
            <span class="ip-badge general">${escapeHtml(target.label)}</span>
            <span class="hero-chip"><strong>${t('label_showing')}</strong>${matched.total}</span>
            <span class="section-search-pill">${t('section_europe_heat_recent')}</span>
          </div>
          <div class="modal-header-caption">${target.id === 'upc_overall' ? t('section_europe_heat_upc_overall_desc') : t('section_europe_heat_country_desc')}</div>
        </div>
        <button class="modal-close" id="modal-close">✕</button>
      </div>
      <div class="modal-body">
        <div class="intel-block modal-intel-block">
          <div class="intel-block-label">${t('section_europe_heat_country_feed')}</div>
          <div class="europe-heat-country-summary">
            <strong>${escapeHtml(target.label)}</strong>
            <span>${target.id === 'upc_overall' ? t('section_europe_heat_upc_overall_desc') : t('section_europe_heat_country_desc')}</span>
          </div>
          ${matched.total ? `
            ${primaryItems.length ? `
              <div class="europe-heat-country-block">
                <div class="intel-block-label">${escapeHtml(target.id === 'upc_overall' ? t('section_europe_heat_country_feed') : t('section_europe_heat_primary_feed'))}</div>
                <div class="europe-heat-country-grid europe-heat-country-grid-primary"></div>
              </div>
            ` : ''}
            ${relatedItems.length ? `
              <div class="europe-heat-country-block">
                <div class="intel-block-label">${t('section_europe_heat_related_feed')}</div>
                <div class="europe-heat-country-grid europe-heat-country-grid-related"></div>
              </div>
            ` : ''}
          ` : `<div class="mini-empty">${t('section_europe_heat_country_empty')}</div>`}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-close-btn">${t('btn_close')}</button>
        <span class="modal-status-hint">${t('section_europe_heat_recent')}</span>
      </div>
    </div>
  `;

  [
    ['.europe-heat-country-grid-primary', primaryItems],
    ['.europe-heat-country-grid-related', relatedItems],
  ].forEach(([selector, list]) => {
    const grid = overlay.querySelector(selector);
    if (!grid) return;
    list.forEach((item, index) => {
      const card = renderNewsCard(item, index < 2 ? 'must-read' : 'scan');
      card.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', (event) => event.stopPropagation());
      });
      grid.appendChild(card);
    });
  });

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) overlay.remove();
  });
  overlay.querySelector('#modal-close')?.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#modal-close-btn')?.addEventListener('click', () => overlay.remove());
  root.appendChild(overlay);
}

async function renderEuropeHeatSection(items) {
  const data = buildEuropeHeatData(items);
  const mapNodes = data.hotspots.slice(0, 7);
  const hotspotRows = data.hotspots.slice(0, 6);
  const maxCount = data.maxCount || 1;
  const legendItems = state.lang === 'zh'
    ? [
        { tone: 'hot', label: '高度聚焦' },
        { tone: 'warm', label: '持续升温' },
        { tone: 'steady', label: '持续关注' },
      ]
    : [
        { tone: 'hot', label: 'High pulse' },
        { tone: 'warm', label: 'Rising' },
        { tone: 'steady', label: 'Active' },
      ];
  const baseMapMarkup = mapNodes.length ? await loadEuropeHeatBaseMapMarkup() : '';
  const mapSurfaceMarkup = baseMapMarkup
    ? decorateEuropeHeatMapMarkup(baseMapMarkup, mapNodes, maxCount)
    : `<image class="europe-heat-base-image" href="${EUROPE_HEAT_MAP_ASSET}" x="0" y="0" width="560" height="360" preserveAspectRatio="xMidYMid meet"></image>`;
  const geoLabelMarkup = EUROPE_HEAT_GEO_LABELS.map((entry) => `
    <g class="europe-heat-geo-label ${entry.priority || 'support'}">
      <text x="${entry.x}" y="${entry.y}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(getEuropeHeatMapLabel(entry))}</text>
    </g>
  `).join('');
  const section = el('section', 'europe-heat-section');
  section.innerHTML = `
    <div class="section-heading-row">
      <div>
        <div class="section-kicker">${t('section_europe_heat')}</div>
        <h2 class="section-title">${t('section_europe_heat')}</h2>
      </div>
      <div class="section-meta">${t('section_europe_heat_desc')}</div>
    </div>
    <div class="europe-heat-shell">
      <div class="europe-heat-map-card">
        <div class="europe-heat-meta-row">
          <span class="section-search-pill">${t('section_europe_heat_recent')}</span>
          ${data.europeWideCount ? `<span class="hero-chip"><strong>${t('section_europe_heat_wide')}</strong>${data.europeWideCount}</span>` : ''}
          ${data.upcOverallCount ? `<button type="button" class="hero-chip europe-heat-upc-chip" data-heat-target="upc_overall"><strong>${t('section_europe_heat_upc_overall')}</strong>${data.upcOverallCount}</button>` : ''}
        </div>
        <div class="europe-heat-tip">${t('section_europe_heat_click_hint')}</div>
        ${mapNodes.length ? `
          <div class="europe-heat-visual">
            <div class="europe-heat-hover-tooltip" hidden></div>
            <svg class="europe-heat-svg" viewBox="0 0 560 360" role="img" aria-label="${escapeHtml(t('section_europe_heat'))}">
              <defs>
                <linearGradient id="europeHeatSea" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="rgba(247, 242, 235, 0.95)"></stop>
                  <stop offset="55%" stop-color="rgba(230, 240, 242, 0.92)"></stop>
                  <stop offset="100%" stop-color="rgba(215, 230, 236, 0.96)"></stop>
                </linearGradient>
              </defs>
              <rect class="europe-heat-sea" x="10" y="10" width="540" height="340" rx="26" fill="url(#europeHeatSea)"></rect>
              ${mapSurfaceMarkup}
              <g class="europe-heat-geo-labels">
                ${geoLabelMarkup}
              </g>
            </svg>
          </div>
        ` : `<div class="mini-empty">${t('section_europe_heat_empty')}</div>`}
      </div>
      <div class="europe-heat-list-card">
        <div class="europe-heat-legend">
          ${legendItems.map((item) => `
            <span class="europe-heat-legend-item ${item.tone}">
              <span class="europe-heat-legend-dot"></span>
              ${escapeHtml(item.label)}
            </span>
          `).join('')}
        </div>
        <div class="europe-heat-list-title">${t('section_europe_heat_hotspots')}</div>
        ${hotspotRows.length ? hotspotRows.map((entry) => `
          <button type="button" class="europe-heat-row ${getEuropeHeatTone(entry.count, maxCount)}" data-heat-target="${escapeHtml(entry.id)}" aria-label="${escapeHtml(entry.label)}">
            <span class="europe-heat-row-dot"></span>
            <span class="europe-heat-row-name">${escapeHtml(entry.label)}</span>
            <strong>${entry.count}</strong>
          </button>
        `).join('') : `<div class="mini-empty">${t('section_europe_heat_empty')}</div>`}
      </div>
    </div>
  `;
  const hoverCountCache = new Map();
  const getHoverCount = (targetId) => {
    if (!hoverCountCache.has(targetId)) {
      hoverCountCache.set(targetId, getEuropeHeatItemsForTarget(items, targetId).total);
    }
    return hoverCountCache.get(targetId) || 0;
  };
  const mapVisual = section.querySelector('.europe-heat-visual');
  const hoverTooltip = mapVisual?.querySelector('.europe-heat-hover-tooltip');
  const hideHoverTooltip = () => {
    if (!hoverTooltip) return;
    hoverTooltip.hidden = true;
    hoverTooltip.innerHTML = '';
  };
  const placeHoverTooltip = (clientX, clientY) => {
    if (!mapVisual || !hoverTooltip) return;
    const visualRect = mapVisual.getBoundingClientRect();
    const tooltipRect = hoverTooltip.getBoundingClientRect();
    const maxLeft = Math.max(visualRect.width - tooltipRect.width - 10, 10);
    const maxTop = Math.max(visualRect.height - tooltipRect.height - 10, 10);
    const left = Math.min(Math.max(clientX - visualRect.left + 14, 10), maxLeft);
    const top = Math.min(Math.max(clientY - visualRect.top - tooltipRect.height - 16, 10), maxTop);
    hoverTooltip.style.left = `${left}px`;
    hoverTooltip.style.top = `${top}px`;
  };
  const showHoverTooltip = (targetId, clientX, clientY, fallbackNode = null) => {
    if (!hoverTooltip || !mapVisual) return;
    const label = getEuropeHeatTargetLabel(targetId);
    const countText = formatEuropeHeatTooltipCount(getHoverCount(targetId));
    const membershipFlags = getEuropeHeatMembershipFlags(targetId);
    hoverTooltip.innerHTML = `
      <strong>${escapeHtml(label)}</strong>
      ${countText ? `<span>${escapeHtml(countText)}</span>` : ''}
      ${membershipFlags.length ? `
        <div class="europe-heat-hover-flags">
          ${membershipFlags.map((flag) => `
            <span class="europe-heat-hover-flag active ${flag.id}">
              ${escapeHtml(flag.label)}
            </span>
          `).join('')}
        </div>
      ` : ''}
    `;
    hoverTooltip.hidden = false;
    if (typeof clientX === 'number' && typeof clientY === 'number') {
      placeHoverTooltip(clientX, clientY);
      return;
    }
    const nodeRect = fallbackNode?.getBoundingClientRect?.();
    const visualRect = mapVisual.getBoundingClientRect();
    const anchorX = nodeRect ? nodeRect.left + (nodeRect.width / 2) : visualRect.left + (visualRect.width / 2);
    const anchorY = nodeRect ? nodeRect.top : visualRect.top + 36;
    placeHoverTooltip(anchorX, anchorY);
  };
  section.querySelectorAll('[data-heat-target]').forEach((node) => {
    const targetId = node.dataset.heatTarget || '';
    const openCountryModal = () => showEuropeHeatCountryModal(targetId, items);
    node.addEventListener('click', openCountryModal);
    if (node.tagName !== 'BUTTON') {
      node.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openCountryModal();
        }
      });
    }
  });
  section.querySelectorAll('.europe-base-map .europe-heat-country[data-heat-target]').forEach((node) => {
    const targetId = node.dataset.heatTarget || '';
    node.addEventListener('mouseenter', (event) => {
      showHoverTooltip(targetId, event.clientX, event.clientY, node);
    });
    node.addEventListener('mousemove', (event) => {
      showHoverTooltip(targetId, event.clientX, event.clientY, node);
    });
    node.addEventListener('mouseleave', hideHoverTooltip);
    node.addEventListener('focus', () => showHoverTooltip(targetId, null, null, node));
    node.addEventListener('blur', hideHoverTooltip);
  });
  mapVisual?.addEventListener('mouseleave', hideHoverTooltip);
  return section;
}

function renderAnalysisDepthBadge(item, compact = false) {
  const label = state.lang === 'zh'
    ? (item?.analysis_depth_label_zh || '')
    : (item?.analysis_depth_label_en || item?.analysis_depth_label_zh || '');
  if (!label) return '';
  const desc = state.lang === 'zh'
    ? (item?.analysis_depth_desc_zh || '')
    : (item?.analysis_depth_desc_en || item?.analysis_depth_desc_zh || '');
  const tier = item?.analysis_depth || 'summary_only';
  return `<span class="analysis-depth-badge ${tier}${compact ? ' compact' : ''}" title="${escapeHtml(desc)}">${escapeHtml(label)}</span>`;
}

function getHeadlineVariantClass(title) {
  const text = (title || '').trim();
  if (!text) return '';
  const latinChars = (text.match(/[A-Za-z]/g) || []).length;
  const glyphCount = text.replace(/\s+/g, '').length || 1;
  const latinRatio = latinChars / glyphCount;
  if (latinRatio > 0.42 && text.length > 88) return 'is-long';
  if (latinRatio > 0.42 && text.length > 46) return 'is-compact';
  if (text.length > 120) return 'is-long';
  return '';
}

function parseItemTimestamp(item) {
  const raw = item?.published_at || item?.scraped_at;
  const value = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(value) ? 0 : value;
}

function buildPrimaryDateLabel(item) {
  const published = formatDate(item?.published_at || '');
  const captured = formatDate(item?.scraped_at || '');
  if (published !== '—') return published;
  if (captured !== '—') {
    return `${t('label_captured_short')} ${captured}`;
  }
  return '—';
}

function formatTimelineDateLabel(item) {
  const raw = typeof item === 'string'
    ? item
    : (item?.published_at || item?.scraped_at || '');
  if (!raw) return t('stream_group_undated');
  try {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return formatDate(raw);
    if (state.lang === 'zh') {
      return date.toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
      }).replace(/\s+/g, '');
    }
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).replace(',', '');
  } catch {
    return formatDate(raw);
  }
}

function buildOriginalLinkDateMeta(item) {
  const published = formatDate(item?.published_at || '');
  const captured = formatDate(item?.scraped_at || '');
  if (published !== '—' && captured !== '—' && published !== captured) {
    return state.lang === 'zh'
      ? `${t('label_published_short')} ${published} · ${t('label_captured_short')} ${captured}`
      : `${t('label_published_short')} ${published} · ${t('label_captured_short')} ${captured}`;
  }
  if (published !== '—') return `${t('label_published_short')} ${published}`;
  if (captured !== '—') return `${t('label_captured_short')} ${captured}`;
  return '—';
}

function sortByChronology(items) {
  return [...(items || [])].sort((a, b) => parseItemTimestamp(b) - parseItemTimestamp(a));
}

function selectChronologyWindow(items, limit, page = 1) {
  const ordered = sortByChronology(items);
  if (page !== 1 || ordered.length <= limit) {
    return ordered.slice(0, limit);
  }

  const maxItems = Math.max(limit * 6, 120);
  const selected = [];
  const seenGroups = new Set();
  const groupCounts = new Map();
  const targetMinimums = new Map([
    ['today', Math.min(limit, 24)],
    ['yesterday', 3],
    ['this-week', 3],
    ['this-month', 8],
  ]);

  ordered.some((item) => {
    const key = getChronologyGroupMeta(item).key;
    selected.push(item);
    seenGroups.add(key);
    groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
    const hasTargetCoverage = [...targetMinimums.entries()].every(([groupKey, minCount]) => (
      seenGroups.has(groupKey) && (groupCounts.get(groupKey) || 0) >= minCount
    ));
    return selected.length >= maxItems || (selected.length >= limit && hasTargetCoverage);
  });

  if (!selected.some((item) => getEditorialLane(item) === 'calendar')) {
    const calendarBoost = ordered
      .filter((item) => getEditorialLane(item) === 'calendar' && !selected.some((entry) => entry.id === item.id))
      .slice(0, 2);
    if (calendarBoost.length) selected.push(...calendarBoost);
  }

  return sortByChronology(selected);
}

function countChronologyGroups(items) {
  const groups = new Set();
  (items || []).forEach((item) => groups.add(getChronologyGroupMeta(item).key));
  return groups.size;
}

function buildChronologySummary(items) {
  const buckets = [
    ['today', t('stream_group_today')],
    ['yesterday', t('stream_group_yesterday')],
    ['this-week', t('stream_group_this_week')],
    ['this-month', t('stream_group_this_month')],
  ];
  const counts = new Map(buckets.map(([key]) => [key, 0]));
  (items || []).forEach((item) => {
    const key = getChronologyGroupMeta(item).key;
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  });
  return buckets
    .map(([key, label]) => `<span class="section-search-pill">${escapeHtml(label)} ${counts.get(key) || 0}</span>`)
    .join('');
}

function groupChronologyModalItems(items) {
  const grouped = [];
  const groupMap = new Map();
  sortByChronology(items).forEach((item) => {
    const ts = parseItemTimestamp(item);
    if (!ts) {
      if (!groupMap.has('undated')) {
        const payload = {
          key: 'undated',
          label: t('stream_group_undated'),
          timelineLabel: t('stream_group_undated'),
          items: [],
        };
        groupMap.set('undated', payload);
        grouped.push(payload);
      }
      groupMap.get('undated').items.push(item);
      return;
    }
    const date = new Date(ts);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!groupMap.has(key)) {
      const payload = {
        key,
        label: buildPrimaryDateLabel(item),
        timelineLabel: formatTimelineDateLabel(item),
        items: [],
      };
      groupMap.set(key, payload);
      grouped.push(payload);
    }
    groupMap.get(key).items.push(item);
  });
  return grouped;
}

function showChronologyGroupModal(group) {
  const root = document.getElementById('modal-root');
  const items = group?.items || [];
  if (!root || !items.length) return;
  const dateGroups = groupChronologyModalItems(items);
  const newestLabel = buildPrimaryDateLabel(items[0]);
  const oldestLabel = buildPrimaryDateLabel(items[items.length - 1]);
  const rangeLabel = newestLabel && oldestLabel && newestLabel !== oldestLabel
    ? `${newestLabel} → ${oldestLabel}`
    : (newestLabel || '—');
  const overlay = el('div', 'modal-overlay');
  overlay.innerHTML = `
    <div class="modal modal-wide chronology-modal">
      <div class="modal-header">
        <div class="modal-header-copy">
          <div class="modal-header-tags">
            <span class="section-search-pill">${escapeHtml(group.label || t('section_stream'))}</span>
            <span class="section-search-pill">${items.length} ${t('stream_group_items')}</span>
          </div>
          <div class="modal-header-caption">${escapeHtml(rangeLabel)}</div>
        </div>
        <button class="modal-close" id="modal-close">✕</button>
      </div>
      <div class="modal-body chronology-modal-body">
        <div class="chronology-modal-summary">
          <div class="chronology-summary-card">
            <div class="chronology-summary-label">${t('chronology_modal_summary_range')}</div>
            <div class="chronology-summary-value">${escapeHtml(rangeLabel)}</div>
          </div>
          <div class="chronology-summary-card compact">
            <div class="chronology-summary-label">${t('chronology_modal_summary_dates')}</div>
            <div class="chronology-summary-value">${dateGroups.length}</div>
          </div>
          <div class="chronology-summary-card compact">
            <div class="chronology-summary-label">${t('chronology_modal_summary_items')}</div>
            <div class="chronology-summary-value">${items.length}</div>
          </div>
        </div>
        <div class="chronology-modal-layout">
          <aside class="chronology-modal-timeline">
            <div class="chronology-modal-timeline-label">${t('chronology_modal_timeline_label')}</div>
            <div class="chronology-modal-timeline-inner"></div>
          </aside>
          <div class="chronology-modal-content"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-close-btn">${t('btn_close')}</button>
      </div>
    </div>
  `;
  const timeline = overlay.querySelector('.chronology-modal-timeline-inner');
  const content = overlay.querySelector('.chronology-modal-content');
  const buttons = [];
  const sections = [];

  dateGroups.forEach((dateGroup) => {
    const section = el('section', 'chronology-modal-section');
    section.dataset.chronoAnchor = dateGroup.key;
    section.innerHTML = `
      <div class="chronology-modal-section-head">
        <div class="chronology-modal-section-date">${escapeHtml(dateGroup.label)}</div>
        <div class="chronology-modal-section-count">${dateGroup.items.length} ${t('stream_group_items')}</div>
      </div>
    `;
    const grid = el('div', 'chronology-modal-grid');
    dateGroup.items.forEach((item, index) => grid.appendChild(renderNewsCard(item, group.key === 'today' && index < 2 ? 'must-read' : 'scan')));
    section.appendChild(grid);
    content.appendChild(section);
    sections.push(section);

    const btn = el('button', 'chronology-timeline-btn');
    btn.type = 'button';
    btn.dataset.targetKey = dateGroup.key;
    btn.title = dateGroup.label;
    btn.setAttribute('aria-label', dateGroup.label);
    btn.innerHTML = `
      <span class="chronology-timeline-date">${escapeHtml(dateGroup.timelineLabel || dateGroup.label)}</span>
      <span class="chronology-timeline-count">${dateGroup.items.length}</span>
    `;
    btn.addEventListener('click', () => {
      content.scrollTo({ top: section.offsetTop - 8, behavior: 'smooth' });
    });
    timeline.appendChild(btn);
    buttons.push(btn);
  });

  const syncActiveDate = () => {
    let activeKey = sections[0]?.dataset.chronoAnchor || '';
    sections.forEach((section) => {
      if (section.offsetTop - content.scrollTop <= 48) {
        activeKey = section.dataset.chronoAnchor;
      }
    });
    buttons.forEach((btn) => {
      const active = btn.dataset.targetKey === activeKey;
      btn.classList.toggle('active', active);
      if (active) btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  };

  content.addEventListener('scroll', syncActiveDate, { passive: true });
  syncActiveDate();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#modal-close')?.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#modal-close-btn')?.addEventListener('click', () => overlay.remove());
  root.appendChild(overlay);
}

function formatArchiveMonthLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return t('stream_group_undated');
  return state.lang === 'zh'
    ? `${date.getFullYear()}年${date.getMonth() + 1}月`
    : date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
}

function getChronologyGroupMeta(item, referenceDate = new Date()) {
  const ts = parseItemTimestamp(item);
  if (!ts) {
    return { key: 'undated', label: t('stream_group_undated'), accent: 'slate' };
  }
  const itemDate = new Date(ts);
  const todayStart = new Date(referenceDate);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  const day = weekStart.getDay();
  const offset = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - offset);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  if (ts >= todayStart.getTime()) return { key: 'today', label: t('stream_group_today'), accent: 'gold' };
  if (ts >= yesterdayStart.getTime()) return { key: 'yesterday', label: t('stream_group_yesterday'), accent: 'teal' };
  if (ts >= weekStart.getTime()) return { key: 'this-week', label: t('stream_group_this_week'), accent: 'slate' };
  if (ts >= monthStart.getTime()) return { key: 'this-month', label: t('stream_group_this_month'), accent: 'slate' };

  const monthKey = `month-${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
  return { key: monthKey, label: formatArchiveMonthLabel(itemDate), accent: 'slate' };
}

function hasEuropeanSignal(item) {
  const sourceId = item?.source_id || '';
  if (['epo', 'euipo', 'upc', 'cjeu', 'ukipo', 'dpma', 'boip', 'inpi'].includes(sourceId)) return true;

  const combined = `${item?.title || ''} ${item?.summary || ''} ${item?.url || ''}`.toLowerCase();
  const europeMarkers = [
    'europe', 'european', 'euipo', 'epo', 'upc', 'unified patent court', 'unitary patent',
    'court of justice', 'cjeu', 'eutm', 'community design', 'geographical indication',
    'european union', 'member state', 'ukipo', 'united kingdom', 'britain', 'british',
    'germany', 'german', 'france', 'french', 'spain', 'spanish', 'italy', 'italian',
    'benelux', 'boip', 'dpma', 'inpi', 'netherlands', 'dutch', 'luxembourg',
    'belgium', 'sweden', 'swedish', 'denmark', 'danish', 'finland', 'finnish',
    'norway', 'nordic', 'paris', 'munich', 'düsseldorf', 'dusseldorf', 'the hague',
  ];
  if (europeMarkers.some((marker) => combined.includes(marker))) return true;

  const foreignOnlyMarkers = [
    'australia', 'australian', 'india', 'indian', 'japan', 'japanese', 'china', 'chinese',
    'singapore', 'korea', 'korean', 'united states', 'u.s.', 'us court', 'california',
  ];
  if (foreignOnlyMarkers.some((marker) => combined.includes(marker))) return false;

  return false;
}

function isHardSignalHomeItem(item) {
  const title = (item?.title || '').trim().toLowerCase();
  const summary = (item?.summary || '').trim().toLowerCase();
  const combined = `${title} ${summary}`;
  const docType = (item?.ai_document_type || '').trim().toLowerCase();
  const editorialLane = getEditorialLane(item);
  const sourceTier = getSourceQualityTier(getSourceById(item?.source_id || ''));

  if (!title) return false;
  if (/^\[?guest post/.test(title)) return false;
  if (/^exclusive:/.test(title)) return false;
  if (/^all in a name:/.test(title)) return false;
  if (/recent trade mark successes/.test(title)) return false;
  if (/response to opposition/.test(title)) return false;
  if (editorialLane === 'calendar' || docType === 'event_notice') return false;
  if (editorialLane === 'core' && !['lawfirm_analysis', 'market_commentary'].includes(docType)) return true;

  if (docType === 'lawfirm_analysis') {
    return /(court|judgment|general court|patents court|cjeu|upc|referral|appeal|proceedings|sued|dispute|revok|invalidity|dismissal|injunction|crime|counterfeit|raid|seizure)/.test(combined);
  }

  if (docType === 'market_commentary') {
    if (/ip lawyers'? ai tool/.test(title)) return false;
    return /(upc|cjeu|euipo|ukipo|epo|wto|frand|counterfeit|ip crime|crime unit|licen[cs]e|licensing|patent pool|access advance|avanci|via)/.test(combined);
  }

  if (sourceTier === 'watch' && !['judgment', 'official_news', 'enforcement_action'].includes(docType)) {
    return /(upc|cjeu|euipo|ukipo|epo|injunction|counterfeit|ip crime|frand|patent pool|licen[cs]ing|board of appeal|general court|court of justice)/.test(combined);
  }

  return true;
}

function isRelevantDisplayItem(item) {
  if (!item) return false;
  if (item.ai_is_relevant === 0) return false;
  return true;
}

function getEditorialLane(item) {
  const lane = String(item?.editorial_lane || '').trim().toLowerCase();
  if (['core', 'watch', 'calendar', 'pending'].includes(lane)) return lane;
  const docType = String(item?.ai_document_type || '').trim().toLowerCase();
  if (!docType) return 'pending';
  if (docType === 'event_notice') return 'calendar';
  if (['judgment', 'official_news', 'policy_update', 'guidance', 'enforcement_action', 'legislation', 'data_release'].includes(docType)) {
    return 'core';
  }
  return 'watch';
}

function getIntelPriorityScore(item) {
  let score = 0;
  const now = Date.now();
  const ageHours = parseItemTimestamp(item) ? (now - parseItemTimestamp(item)) / 3600000 : 999;
  const contentLen = (item?.content || '').trim().length;
  const aiConfidence = Number(item?.ai_confidence || 0);
  const docType = (item?.ai_document_type || '').trim().toLowerCase();
  const editorialLane = getEditorialLane(item);
  const scope = (item?.primary_scope || item?.ai_primary_scope || '').trim().toLowerCase();
  const title = (item?.title || '').trim().toLowerCase();
  const summary = (item?.summary || '').trim().toLowerCase();
  const combined = `${title} ${summary}`;
  const sourceTier = getSourceQualityTier(getSourceById(item?.source_id || ''));

  if (item.ai_status === 'done') score += 3;
  if (item.ai_is_relevant === 1) score += 2;
  if (item.ai_is_relevant === 0) score -= 6;
  if (aiConfidence >= 0.85) score += 1;
  else if (aiConfidence > 0 && aiConfidence < 0.55) score -= 1;
  if ((item.category || '') === 'official') score += 3;
  if ((item.category || '') === 'media') score += 2;
  if ((item.category || '') === 'lawfirm') score += 1;
  if (sourceTier === 'core') score += 2;
  if (sourceTier === 'watch') score -= 2;
  if (editorialLane === 'core') score += 2;
  if (editorialLane === 'watch') score -= 1;
  if (editorialLane === 'calendar') score -= 4;
  if (['patent', 'trademark', 'design', 'sep'].includes(item.ip_type || '')) score += 1;
  if ((item.ip_type || '') === 'general') score -= 2;
  if (['judgment', 'official_news', 'enforcement_action'].includes(docType)) score += 1;
  if (['market_commentary', 'event_notice'].includes(docType)) score -= 2;
  if (docType === 'lawfirm_analysis') score -= 1;
  if (scope === 'intl') score -= 1;
  if (/(judgment|court of appeal|court of justice|general court|board of appeal|patents court|upc|cjeu|euipo|epo|ukipo|wto|injunction|invalidity|revok|dismissal|counterfeit|ip crime|fees from|funding|referral|sued|dispute|litigation|appeal|seizure|customs|frand|patent pool|licensing alliance)/.test(combined)) {
    score += 2;
  }
  if (title.startsWith('[guest post]') || title.startsWith('guest post')) score -= 5;
  if (title.startsWith('exclusive:')) score -= 2;
  if (title.includes('recent trade mark successes')) score -= 3;
  if ((docType === 'lawfirm_analysis' || docType === 'market_commentary') && (title.includes('?') || title.includes('implications for'))) score -= 1;
  if (title.includes('response to opposition')) score -= 2;
  if (contentLen >= 1200) score += 3;
  else if (contentLen >= 500) score += 2;
  else if (contentLen >= 200) score += 1;
  else score -= 1;
  if (sourceTier === 'watch' && contentLen < 250) score -= 1;
  if (ageHours <= 24) score += 3;
  else if (ageHours <= 72) score += 2;
  else if (ageHours <= 168) score += 1;
  if ((item.title || '').length > 70) score += 1;

  return score;
}

function getPriorityBriefScore(item) {
  let score = getIntelPriorityScore(item);
  const docType = (item?.ai_document_type || '').trim().toLowerCase();
  const editorialLane = getEditorialLane(item);
  const scope = (item?.primary_scope || item?.ai_primary_scope || '').trim().toLowerCase();
  const sourceId = (item?.source_id || '').trim().toLowerCase();
  const sourceTier = getSourceQualityTier(getSourceById(sourceId));
  if (item.ai_status === 'done') score += 8;
  if ((item.category || '') === 'official') score += 4;
  if ((item.category || '') === 'media') score += 2;
  if (editorialLane === 'core') score += 3;
  if (editorialLane === 'watch') score -= 1;
  if (editorialLane === 'calendar') score -= 4;
  if (['judgment', 'enforcement_action'].includes(docType)) score += 4;
  if (docType === 'official_news') score += 3;
  if (docType === 'lawfirm_analysis') score -= 2;
  if (docType === 'market_commentary') score -= 1;
  if (scope === 'intl') score -= 1;
  if (sourceTier === 'core') score += 2;
  if (sourceTier === 'watch') score -= 3;
  if (['epo', 'euipo', 'cjeu', 'upc', 'ukipo', 'ec'].includes(sourceId)) score += 4;
  if (['iam', 'managingip', 'juve'].includes(sourceId)) score += 2;
  return score;
}

function getPriorityBriefItem(items) {
  if (!items.length) return null;
  return [...items].sort((a, b) => getPriorityBriefScore(b) - getPriorityBriefScore(a))[0];
}

function getSignalSortScore(item, mode = 'stream') {
  const impactMap = { high: 3, medium: 2, low: 1 };
  const riskMap = { high: 3, medium: 2, low: 1 };
  const urgencyMap = { immediate: 3, soon: 2, watch: 1 };
  const base = mode === 'brief' ? getPriorityBriefScore(item) : getIntelPriorityScore(item);
  return (
    base * 100 +
    (impactMap[item?.impact_level] || 1) * 10 +
    (urgencyMap[item?.urgency_level] || 1) * 7 +
    (riskMap[item?.risk_level] || 1) * 4
  );
}

function sortBySignalPriority(items, mode = 'stream') {
  return [...(items || [])].sort((a, b) => {
    const scoreGap = getSignalSortScore(b, mode) - getSignalSortScore(a, mode);
    if (scoreGap) return scoreGap;
    return parseItemTimestamp(b) - parseItemTimestamp(a);
  });
}

function getIntelTier(item) {
  const score = getIntelPriorityScore(item);
  if (score >= 8) return 'must-read';
  if (score >= 5) return 'scan';
  return 'background';
}

function renderIntelStreamSections(items) {
  if (!items.length) {
    const wrap = el('div', 'intel-stream-shell');
    wrap.appendChild(renderEmptyState());
    return wrap;
  }

  function getEditorialLaneMeta(lane) {
    const fallback = {
      kicker: t('lane_watch_kicker'),
      title: t('lane_watch_title'),
      desc: t('lane_watch_desc'),
    };
    const map = {
      core: {
        kicker: t('lane_core_kicker'),
        title: t('lane_core_title'),
        desc: t('lane_core_desc'),
      },
      watch: fallback,
      calendar: {
        kicker: t('lane_calendar_kicker'),
        title: t('lane_calendar_title'),
        desc: t('lane_calendar_desc'),
      },
    };
    return map[lane] || fallback;
  }

  function buildChronologyGroups(itemsForLane) {
    const grouped = [];
    const groupMap = new Map();
    sortByChronology(itemsForLane).forEach((item) => {
      const meta = getChronologyGroupMeta(item);
      if (!groupMap.has(meta.key)) {
        const payload = { ...meta, items: [] };
        groupMap.set(meta.key, payload);
        grouped.push(payload);
      }
      groupMap.get(meta.key).items.push(item);
    });
    return grouped;
  }

  function renderChronologyGroups(groups) {
    const shell = el('div', 'intel-stream-shell chronology-stream');
    groups.forEach((group) => {
      const list = group.items || [];
      if (!list.length) return;
      const newestLabel = buildPrimaryDateLabel(list[0]);
      const oldestLabel = buildPrimaryDateLabel(list[list.length - 1]);
      const rangeLabel = newestLabel && oldestLabel && newestLabel !== oldestLabel
        ? `${newestLabel} → ${oldestLabel}`
        : (newestLabel || '—');
      const block = el('section', `intel-stream-section chronology-group ${group.key}`);
      block.innerHTML = `
        <div class="intel-stream-head chronology-head">
          <div>
            <div class="intel-stream-kicker ${group.accent}">${group.label}</div>
            <div class="intel-stream-desc">${rangeLabel}</div>
          </div>
          <div class="intel-stream-count">${String(list.length).padStart(2, '0')} ${t('stream_group_items')}</div>
        </div>
      `;
      const grid = el('div', 'news-grid intelligence-stream chronology-grid');
      const previewLimit = group.key === 'today' ? list.length : 3;
      const previewItems = list.slice(0, previewLimit);
      previewItems.forEach((item, index) => grid.appendChild(renderNewsCard(item, group.key === 'today' && index < 2 ? 'must-read' : 'scan')));
      block.appendChild(grid);
      if (group.key !== 'today' && list.length > previewLimit) {
        const actionRow = el('div', 'chronology-group-actions');
        const button = el('button', 'btn btn-secondary chronology-open-btn', `${t('stream_group_open_modal')} ${list.length} ${t('stream_group_items')}`);
        button.addEventListener('click', () => showChronologyGroupModal(group));
        actionRow.appendChild(button);
        block.appendChild(actionRow);
      }
      shell.appendChild(block);
    });
    return shell;
  }

  const laneBuckets = new Map([
    ['core', []],
    ['watch', []],
    ['calendar', []],
  ]);
  sortByChronology(items).forEach((item) => {
    const lane = getEditorialLane(item);
    if (!laneBuckets.has(lane)) laneBuckets.set(lane, []);
    laneBuckets.get(lane).push(item);
  });

  const shell = el('div', 'intel-stream-shell');
  laneBuckets.forEach((laneItems, lane) => {
    if (!laneItems.length) return;
    const meta = getEditorialLaneMeta(lane);
    const laneWrap = el('section', `editorial-lane-section editorial-lane-${lane}`);
    laneWrap.style.display = 'grid';
    laneWrap.style.gap = '14px';
    const sourceCount = new Set(laneItems.map((item) => item.source_id).filter(Boolean)).size;
    laneWrap.innerHTML = `
      <div class="section-heading-row editorial-lane-heading">
        <div>
          <div class="section-kicker">${meta.kicker}</div>
          <h2 class="section-title">${meta.title}</h2>
        </div>
        <div class="section-search-meta">
          <span class="section-search-pill">${laneItems.length} ${t('stream_group_items')}</span>
          <span class="section-search-pill">${sourceCount} ${t('focus_mode_sources')}</span>
        </div>
      </div>
      <div class="section-meta">${meta.desc}</div>
    `;
    laneWrap.appendChild(renderChronologyGroups(buildChronologyGroups(laneItems)));
    shell.appendChild(laneWrap);
  });
  return shell;
}

function isPresentationItem(item) {
  const title = (item?.title || '').trim();
  if (!title) return false;
  if (item.ai_model === 'qwen-demo') return false;
  if (/^skip to content$/i.test(title)) return false;
  if (/^[^\d]{2,32}\s*\/\s*[A-Z]{2,3}$/.test(title)) return false;
  if (/^(news and events|decisions and orders|skip to main content)$/i.test(title)) return false;
  if (/^esearch/i.test(title)) return false;
  if (title.length < 30 && /^[A-Z\s/&-]+$/.test(title)) return false;
  if (/(if you missed .* last week|never too late|sunday digest|this week on)/i.test(title)) return false;
  if (!hasEuropeanSignal(item)) return false;
  if (!isHardSignalHomeItem(item)) return false;
  return true;
}

function isStreamItem(item) {
  const title = (item?.title || '').trim();
  if (!title) return false;
  if (item.ai_model === 'qwen-demo') return false;
  if (/^skip to content$/i.test(title)) return false;
  if (/^esearch/i.test(title)) return false;
  if (/(if you missed .* last week|never too late|sunday digest|this week on)/i.test(title)) return false;
  if (!hasEuropeanSignal(item)) return false;
  if (getEditorialLane(item) === 'calendar') return true;
  if (!isHardSignalHomeItem(item)) return false;
  return true;
}

function renderNewsCard(item, tier = 'scan') {
  const ipType = item.ip_type || 'general';
  const category = item.category || 'media';
  const date = buildPrimaryDateLabel(item);
  const linkDateMeta = buildOriginalLinkDateMeta(item);
  const catLabel = { official: t('filter_official'), media: t('filter_media'), lawfirm: t('filter_lawfirm') }[category] || category;
  const aiDone = item.ai_status === 'done';
  const primaryTitle = item.title_zh || item.title || '—';
  const englishTitle = item.title && item.title !== primaryTitle ? item.title : '';
  const synopsis = item.ai_summary_zh || item.summary || '';
  const insight = item.ai_insight_zh || '';
  const fallbackSummary = buildFallbackBrief(item, 'summary');
  const fallbackInsight = buildFallbackBrief(item, 'signal');
  const summaryPoints = resolvePointList(item.ai_core_points_zh, synopsis || fallbackSummary, 2, tier === 'must-read' ? 78 : 68);
  const insightPoints = resolvePointList(item.ai_insight_points_zh, insight || fallbackInsight, 1, 72);
  const primaryInsight = insightPoints[0] || truncateText(insight || fallbackInsight, 72) || '';

  const card = el('div', `news-card news-card--latest-style tier-${tier}${aiDone ? ' has-ai' : ''}`);
  card.dataset.type = ipType;
  card.dataset.id = item.id;
  card.innerHTML = `
    <div class="news-card-meta compact latest-like">
      <span class="source-badge ${category}">${catLabel}</span>
      <span class="ip-badge ${ipType}">${getIpTypeLabel(ipType)}</span>
      ${renderGeoBadges(item)}
      ${renderAnalysisDepthBadge(item, true)}
      <span class="news-card-date">${date}</span>
    </div>
    <div class="news-card-rubric">${escapeHtml(compactSourceName(item.source_name || ''))}</div>
    <div class="news-card-title is-compact">${escapeHtml(truncateText(primaryTitle, 72))}</div>
    ${englishTitle ? `<div class="news-card-title-sub news-card-title-en">${escapeHtml(truncateText(englishTitle, 118))}</div>` : ''}
    <div class="news-card-points-compact latest-like">
      ${(summaryPoints.length ? summaryPoints : [truncateText(synopsis || fallbackSummary, 68) || '—']).map((point) => `
        <span class="news-card-point-inline">${escapeHtml(point)}</span>
      `).join('')}
    </div>
    <div class="news-card-insight-line news-card-insight-latest">${escapeHtml(primaryInsight || '—')}</div>
    <div class="news-card-footer compact latest-like">
      <div class="news-card-footer-meta">
        <span class="news-card-source-name">${escapeHtml(compactSourceName(item.source_name || '—'))}</span>
        <span class="news-card-date">${escapeHtml(linkDateMeta)}</span>
      </div>
      <a href="${item.url}" target="_blank" rel="noopener" class="read-more-link compact-pill"
         onclick="event.stopPropagation()">
        ${t('detail_btn_short')}
      </a>
    </div>
  `;
  card.addEventListener('click', () => showNewsDetail(item));
  return card;
}

function renderPagination(page, pages, total) {
  const wrap = el('div', 'pagination');

  // Prev
  const prev = el('button', `page-btn${page <= 1 ? ' disabled' : ''}`);
  prev.textContent = '←';
  if (page > 1) prev.addEventListener('click', () => { state.pagination.page--; renderMainContent(); });
  wrap.appendChild(prev);

  // Page numbers
  const showPages = getPageRange(page, pages);
  showPages.forEach(p => {
    if (p === '...') {
      wrap.insertAdjacentHTML('beforeend', '<span class="page-info">···</span>');
    } else {
      const btn = el('button', `page-btn${p === page ? ' active' : ''}`);
      btn.textContent = p;
      btn.addEventListener('click', () => { state.pagination.page = p; renderMainContent(); });
      wrap.appendChild(btn);
    }
  });

  // Next
  const next = el('button', `page-btn${page >= pages ? ' disabled' : ''}`);
  next.textContent = '→';
  if (page < pages) next.addEventListener('click', () => { state.pagination.page++; renderMainContent(); });
  wrap.appendChild(next);

  wrap.insertAdjacentHTML('beforeend',
    `<span class="page-info">${page} / ${pages} ${t('page_page')}</span>`);

  return wrap;
}

function getPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
  return [1, '...', current-1, current, current+1, '...', total];
}

// ── Sources Page ──────────────────────────────

async function renderSourcesPage(container) {
  container.innerHTML = `<div class="state-container"><div class="state-icon">📡</div><div class="state-title">${t('loading')}</div></div>`;

  try {
    const [data, stats] = await Promise.all([
      apiFetch('/sources'),
      apiFetch('/stats'),
    ]);
    state.sources = data.sources;
    container.innerHTML = '';

    const header = el('div', 'flex items-center gap-2 mt-4', `
      <div>
        <div class="text-sm font-bold">${t('sources_title')}</div>
        <div class="text-xs text-muted" style="margin-top:4px">${t('sources_desc')}</div>
      </div>
    `);
    container.appendChild(header);

    const sources = data.sources || [];
    const activeSources = sources.filter((s) => Number(s.item_count || 0) > 0);
    const totalItems = activeSources.reduce((sum, s) => sum + Number(s.item_count || 0), 0);
    const totalRelevant = activeSources.reduce((sum, s) => sum + Number(s.relevant_count || 0), 0);
    const totalRich = activeSources.reduce((sum, s) => sum + Number(s.rich_count || 0), 0);
    const relevanceRatio = totalItems ? `${Math.round((totalRelevant / totalItems) * 100)}%` : '—';
    const richRatio = totalItems ? `${Math.round((totalRich / totalItems) * 100)}%` : '—';
    const sourceSummary = el('section', 'sources-summary-shell', `
      <div class="section-heading-row">
        <div>
          <div class="section-kicker">${t('sources_window_title')}</div>
          <div class="section-title">${t('sources_window_title')}</div>
        </div>
        <div class="section-meta">${t('sources_window_desc')}</div>
      </div>
      <div class="about-status-grid sources-summary-grid">
        <div class="about-status-card">
          <span>${t('sources_summary_active')}</span>
          <strong>${activeSources.length}</strong>
        </div>
        <div class="about-status-card">
          <span>${t('sources_summary_relevant_ratio')}</span>
          <strong>${relevanceRatio}</strong>
        </div>
        <div class="about-status-card">
          <span>${t('sources_summary_rich_ratio')}</span>
          <strong>${richRatio}</strong>
        </div>
        <div class="about-status-card">
          <span>${t('sources_summary_window')}</span>
          <strong>${formatCollectionWindow(stats)}</strong>
        </div>
      </div>
    `);
    container.appendChild(sourceSummary);

    // Group by category
    const groups = { official: [], media: [], lawfirm: [] };
    sources.forEach(s => { if (groups[s.category]) groups[s.category].push(s); });
    Object.values(groups).forEach((sources) => {
      sources.sort((a, b) =>
        (getSourceTierRank(a) - getSourceTierRank(b)) ||
        ((b.item_count || 0) - (a.item_count || 0)) ||
        ((b.relevant_count || 0) - (a.relevant_count || 0)) ||
        a.name_en.localeCompare(b.name_en)
      );
    });

    const catNames = {
      official: t('cat_official'),
      media: t('cat_media'),
      lawfirm: t('cat_lawfirm'),
    };

    Object.entries(groups).forEach(([cat, sources]) => {
      if (!sources.length) return;
      const section = el('div', 'mt-4');
      section.insertAdjacentHTML('beforeend', `
        <div class="text-xs text-muted font-bold" style="margin-bottom:10px;text-transform:uppercase;letter-spacing:.8px">
          ${catNames[cat]} (${sources.length})
        </div>
      `);
      const table = el('div', 'sources-table');
      table.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>${t('col_source')}</th>
              <th>${t('col_type')}</th>
              <th>${t('col_category')}</th>
              <th>${t('col_country')}</th>
              <th>${t('col_scope')}</th>
              <th>${t('col_window_items')}</th>
              <th>${t('col_relevant_items')}</th>
              <th>${t('col_rich_items')}</th>
              <th>${t('col_latest_seen')}</th>
              <th>${t('col_status')}</th>
            </tr>
          </thead>
          <tbody>
            ${sources.map(s => `
              <tr>
                <td>
                  <div style="font-weight:600;color:var(--color-text)">${s.logo_emoji} ${state.lang === 'zh' ? s.name_zh : s.name_en}</div>
                  <div class="source-health-row">
                    ${renderSourceTierPill(s)}
                    ${renderSourceHealthPill(s)}
                    ${renderSourceRelevancePill(s)}
                  </div>
                  <a href="${s.url}" target="_blank" class="source-link text-xs" style="margin-top:2px">
                    ${s.url} ↗
                  </a>
                </td>
                <td><span class="source-badge ${s.category}">${catNames[s.category]}</span></td>
                <td>
                  ${s.ip_categories.map(c => `<span class="ip-badge ${c}" style="margin:1px">${getIpTypeLabel(c)}</span>`).join('')}
                </td>
                <td><span class="text-xs">${s.country}</span></td>
                <td><span class="text-xs">${(s.geo_scopes || ['eu']).join(', ')}</span></td>
                <td><span class="text-xs">${Number(s.item_count || 0).toLocaleString()}</span></td>
                <td><span class="text-xs">${Number(s.relevant_count || 0).toLocaleString()}</span></td>
                <td><span class="text-xs">${Number(s.rich_count || 0).toLocaleString()}</span></td>
                <td><span class="text-xs">${formatDateLabel(s.latest_at || '')}</span></td>
                <td>${renderSourceTierPill(s)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      section.appendChild(table);
      container.appendChild(section);
    });

  } catch (err) {
    container.innerHTML = renderErrorState(err.message);
  }
}

// ── Stats Page ────────────────────────────────

async function renderStatsPage(container) {
  container.innerHTML = `<div class="state-container"><div class="state-icon">📊</div><div class="state-title">${t('loading')}</div></div>`;

  try {
    const [stats, health, scrapeHistoryData, aiHistoryData, qualityHistoryData, eventClustersData, sourceAlertsData] = await Promise.all([
      apiFetch('/stats'),
      apiFetch('/health'),
      apiFetch('/scrape/history?limit=12'),
      apiFetch('/ai/history?limit=12'),
      apiFetch('/quality/history?limit=12'),
      apiFetch('/events/clusters?limit=8'),
      apiFetch('/source-alerts?limit=8'),
    ]);
    state.stats = stats;
    state.lastStatsToken = getStatsRefreshToken(stats);
    const scrapeHistory = scrapeHistoryData.history || [];
    const aiHistory = aiHistoryData.history || [];
    const qualityHistory = qualityHistoryData.history || [];
    const eventClusters = eventClustersData.clusters || [];
    const sourceAlerts = sourceAlertsData.items || [];
    const sourceAlertSummary = sourceAlertsData.summary || {};
    const schedulerStatus = health?.scheduler_running
      ? (state.lang === 'zh' ? '运行中' : 'Running')
      : (state.lang === 'zh' ? '未运行' : 'Stopped');
    const aiStatus = health?.ai_enabled
      ? (health?.ai_model || '—')
      : (state.lang === 'zh' ? '未启用' : 'Disabled');

    container.innerHTML = '';
    const title = el('div', 'section-heading-row', `
      <div>
        <div class="section-kicker">${t('stats_title')}</div>
        <h2 class="section-title">${t('stats_overview_title')}</h2>
      </div>
      <div class="section-meta">${t('stats_overview_desc')}</div>
    `);
    container.appendChild(title);

    const metricGrid = el('div', 'stats-row command-metrics');
    const metricCards = [
      {
        value: (stats.total_items || 0).toLocaleString(),
        label: t('label_article_count'),
        sub: `${stats.ai_relevant || 0} ${t('stats_runtime_relevant')}`,
      },
      {
        value: (stats.ai_structured_done || 0).toLocaleString(),
        label: t('stats_runtime_structured'),
        sub: `${stats.ai_pending || 0} ${t('stats_runtime_pending')}`,
      },
      {
        value: (stats.total_sources || 0).toLocaleString(),
        label: t('stat_sources'),
        sub: formatCollectionWindow(stats) || '—',
      },
      {
        value: schedulerStatus,
        label: t('stats_runtime_scheduler'),
        sub: stats.next_scrape || '—',
      },
    ];
    metricGrid.innerHTML = metricCards.map((card) => `
      <div class="command-stat-card">
        <div class="stat-card-value">${escapeHtml(String(card.value))}</div>
        <div class="stat-card-label">${escapeHtml(card.label)}</div>
        <div class="stat-card-sub">${escapeHtml(card.sub || '—')}</div>
      </div>
    `).join('');
    container.appendChild(metricGrid);

    const runtimeGrid = el('div', 'stats-runtime-grid');
    const buildRuntimeRows = (rows) => rows.map(([label, value]) => `
      <div class="ops-kv-row">
        <span class="ops-kv-label">${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value || '—'))}</strong>
      </div>
    `).join('');
    runtimeGrid.innerHTML = `
      <div class="chart-card ops-runtime-card">
        <div class="chart-card-title">${t('stats_runtime_title')}</div>
        <div class="ops-kv-list">
          ${buildRuntimeRows([
            [t('stats_runtime_window'), formatCollectionWindow(stats) || '—'],
            [t('stats_runtime_scheduler'), schedulerStatus],
            [t('stats_runtime_model'), aiStatus],
            [t('stats_runtime_relevant'), (stats.ai_relevant || 0).toLocaleString()],
          ])}
        </div>
      </div>
      <div class="chart-card ops-runtime-card">
        <div class="chart-card-title">${state.lang === 'zh' ? '抓取与分析状态' : 'Scrape & Analysis Status'}</div>
        <div class="ops-kv-list">
          ${buildRuntimeRows([
            [t('stats_runtime_latest_scrape'), formatDateTimeLabel(stats.last_scrape_time || '')],
            [t('stats_runtime_latest_ai'), formatDateTimeLabel(stats.last_analyze_time || '')],
            [t('stats_runtime_latest_quality'), formatDateTimeLabel(stats.last_quality_guard_time || '')],
            [t('label_next_window'), stats.next_scrape || '—'],
            [t('stats_runtime_pending'), (stats.ai_pending || 0).toLocaleString()],
          ])}
        </div>
      </div>
      <div class="chart-card ops-runtime-card">
        <div class="chart-card-title">${state.lang === 'zh' ? '去重与聚合' : 'Deduplication & Clustering'}</div>
        <div class="ops-kv-list">
          ${buildRuntimeRows([
            [t('stats_runtime_duplicates'), (stats.duplicate_candidate_items || 0).toLocaleString()],
            [t('stats_runtime_event_clusters'), (stats.event_cluster_count || 0).toLocaleString()],
            [t('stats_runtime_cross_source'), (stats.multi_source_event_count || 0).toLocaleString()],
            [state.lang === 'zh' ? '重复分组' : 'Duplicate Groups', (stats.duplicate_candidate_groups || 0).toLocaleString()],
          ])}
        </div>
      </div>
      <div class="chart-card ops-runtime-card">
        <div class="chart-card-title">${t('stats_runtime_health_24h')}</div>
        <div class="ops-kv-list">
          ${buildRuntimeRows([
            [t('stats_runtime_scrape_success'), stats.scrape_success_rate_24h != null ? `${stats.scrape_success_rate_24h}%` : '—'],
            [t('stats_runtime_ai_success'), stats.ai_success_rate_24h != null ? `${stats.ai_success_rate_24h}%` : '—'],
            [t('stats_runtime_quality_success'), stats.quality_guard_success_rate_24h != null ? `${stats.quality_guard_success_rate_24h}%` : '—'],
            [t('stats_runtime_scrape_volume'), `${Number(stats.scrape_new_24h || 0).toLocaleString()} / ${Number(stats.scrape_found_24h || 0).toLocaleString()}`],
            [t('stats_runtime_ai_volume'), `${Number(stats.ai_success_24h || 0).toLocaleString()} / ${Number(stats.ai_attempted_24h || 0).toLocaleString()}`],
            [t('stats_runtime_quality_volume'), `${Number(stats.quality_guard_deleted_24h || 0).toLocaleString()} / ${Number(stats.quality_guard_matched_24h || 0).toLocaleString()}`],
          ])}
        </div>
      </div>
      <div class="chart-card ops-runtime-card">
        <div class="chart-card-title">${t('stats_runtime_source_tiers')}</div>
        <div class="ops-kv-list">
          ${buildRuntimeRows([
            [t('stats_runtime_active_sources'), Number(stats.active_source_count || 0).toLocaleString()],
            [t('source_tier_core'), Number(stats.source_tier_core_count || 0).toLocaleString()],
            [t('source_tier_stable'), Number(stats.source_tier_stable_count || 0).toLocaleString()],
            [t('source_tier_watch'), Number(stats.source_tier_watch_count || 0).toLocaleString()],
          ])}
        </div>
      </div>
    `;
    container.appendChild(runtimeGrid);

    const alertSeverityPill = (severity) => {
      const normalized = String(severity || '').toLowerCase();
      const labelMap = {
        error: t('stats_alert_error'),
        warn: t('stats_alert_warn'),
        watch: t('stats_alert_watch'),
      };
      return `<span class="ops-status-pill ${normalized || 'watch'}">${escapeHtml(labelMap[normalized] || normalized || '—')}</span>`;
    };
    const describeSourceAlert = (alert) => {
      const key = `stats_alert_reason_${alert.alert_type || ''}`;
      const translated = t(key);
      return translated === key
        ? (state.lang === 'zh' ? '该来源最近运行情况需要继续观察。' : 'This source needs follow-up attention.')
        : translated;
    };
    const describeAlertAction = (alert) => {
      const key = `stats_alert_action_${alert.recommended_action || ''}`;
      const translated = t(key);
      return translated === key
        ? (state.lang === 'zh' ? '继续观察' : 'Keep watching')
        : translated;
    };
    const alertSummaryItems = [
      [t('stats_alert_total'), sourceAlertSummary.total || 0, 'watch'],
      [t('stats_alert_error'), sourceAlertSummary.error || 0, 'error'],
      [t('stats_alert_warn'), sourceAlertSummary.warn || 0, 'warn'],
      [t('stats_alert_watch'), sourceAlertSummary.watch || 0, 'watch'],
    ];
    const scrapeIssueTypes = new Set(['error', 'unstable', 'no_signal', 'no_window_items']);
    const scrapeAlerts = sourceAlerts.filter((alert) => scrapeIssueTypes.has(String(alert.alert_type || '')));
    const quietAlerts = sourceAlerts.filter((alert) => !scrapeIssueTypes.has(String(alert.alert_type || '')));
    const renderAlertItems = (alerts, emptyKey) => alerts.length ? alerts.map((alert) => `
      <article class="ops-alert-item">
        <div class="ops-alert-head">
          <div class="ops-alert-title-wrap">
            <div class="ops-alert-title">${escapeHtml(compactSourceName(alert.source_name || alert.source_id || '—'))}</div>
            <div class="ops-alert-sub">${escapeHtml(alert.source_id || '—')}</div>
          </div>
          <div class="ops-alert-actions">${renderSourceTierPill({ quality_tier: alert.quality_tier || 'stable' })}${alertSeverityPill(alert.severity)}</div>
        </div>
        <div class="ops-alert-reason">${escapeHtml(describeSourceAlert(alert))}</div>
        <div class="ops-alert-action-row">
          <span class="ops-alert-action-label">${t('stats_alert_action')}</span>
          <span class="ops-event-pill">${escapeHtml(describeAlertAction(alert))}</span>
        </div>
        <div class="ops-alert-meta">
          <span>${t('stats_alert_last_run')}: ${escapeHtml(formatDateTimeLabel(alert.last_started_at || ''))}</span>
          <span>${t('stats_alert_found')}: ${Number(alert.last_items_found || 0).toLocaleString()}</span>
          <span>${t('stats_alert_new')}: ${Number(alert.last_items_new || 0).toLocaleString()}</span>
          <span>${t('stats_alert_window_items')}: ${Number(alert.item_count || 0).toLocaleString()}</span>
          <span>${t('stats_alert_relevant')}: ${Number(alert.relevant_count || 0).toLocaleString()}</span>
          <span>${t('stats_alert_latest_content')}: ${escapeHtml(formatDateTimeLabel(alert.latest_content_at || ''))}</span>
        </div>
      </article>
    `).join('') : `<div class="ops-empty">${t(emptyKey)}</div>`;
    const alertCard = el('div', 'chart-card ops-alert-card');
    alertCard.innerHTML = `
      <div class="section-heading-row" style="margin-bottom:14px">
        <div>
          <div class="section-kicker">${t('stats_title')}</div>
          <h3 class="section-title" style="font-size:20px">${t('stats_source_alerts')}</h3>
        </div>
        <div class="section-meta">${t('stats_source_alerts_desc')}</div>
      </div>
      <div class="ops-alert-summary">
        ${alertSummaryItems.map(([label, value, cls]) => `
          <span class="ops-alert-summary-pill ${cls}">
            <strong>${Number(value || 0).toLocaleString()}</strong>
            <span>${escapeHtml(label)}</span>
          </span>
        `).join('')}
      </div>
      <div class="ops-alert-columns">
        <div class="ops-alert-column">
          <div class="ops-alert-column-head">
            <div class="ops-alert-column-title">${t('stats_alerts_scrape')}</div>
            <div class="ops-alert-column-desc">${t('stats_alerts_scrape_desc')}</div>
          </div>
          <div class="ops-alert-list">
            ${renderAlertItems(scrapeAlerts, 'stats_alerts_empty_scrape')}
          </div>
        </div>
        <div class="ops-alert-column">
          <div class="ops-alert-column-head">
            <div class="ops-alert-column-title">${t('stats_alerts_quiet')}</div>
            <div class="ops-alert-column-desc">${t('stats_alerts_quiet_desc')}</div>
          </div>
          <div class="ops-alert-list">
            ${renderAlertItems(quietAlerts, 'stats_alerts_empty_quiet')}
          </div>
        </div>
      </div>
    `;
    container.appendChild(alertCard);

    const grid = el('div', 'stats-page-grid mt-4');

    // By IP Type
    const ipTypeCard = el('div', 'chart-card');
    ipTypeCard.innerHTML = `<div class="chart-card-title">${t('stats_by_type')}</div>`;
    const ipTypes = [
      ['patent', t('filter_patent'), 'var(--color-patent)'],
      ['trademark', t('filter_trademark'), 'var(--color-trademark)'],
      ['design', t('filter_design'), 'var(--color-design)'],
      ['copyright', t('filter_copyright'), 'var(--color-copyright)'],
      ['data', t('filter_data'), 'var(--color-data)'],
      ['general', t('filter_general'), 'var(--color-general)'],
    ];
    const maxType = Math.max(...Object.values(stats.by_ip_type || {}), 1);
    ipTypes.forEach(([key, label, color]) => {
      const count = stats.by_ip_type?.[key] || 0;
      const pct = Math.round(count / maxType * 100);
      ipTypeCard.insertAdjacentHTML('beforeend', `
        <div class="bar-chart-row">
          <div class="bar-chart-label">${label}</div>
          <div class="bar-chart-bar-wrap">
            <div class="bar-chart-bar" style="width:${pct}%;background:${color}"></div>
          </div>
          <div class="bar-chart-val">${count}</div>
        </div>
      `);
    });
    grid.appendChild(ipTypeCard);

    // By Source
    const srcCard = el('div', 'chart-card');
    srcCard.innerHTML = `<div class="chart-card-title">${t('stats_by_source')}</div>`;
    const bySource = stats.by_source || {};
    const srcEntries = Object.entries(bySource).slice(0, 10);
    const maxSrc = Math.max(...srcEntries.map(([, v]) => v.count), 1);
    srcEntries.forEach(([id, info]) => {
      const pct = Math.round(info.count / maxSrc * 100);
      srcCard.insertAdjacentHTML('beforeend', `
        <div class="bar-chart-row">
          <div class="bar-chart-label truncate" style="font-size:11px">${info.name}</div>
          <div class="bar-chart-bar-wrap">
            <div class="bar-chart-bar" style="width:${pct}%;background:var(--color-accent)"></div>
          </div>
          <div class="bar-chart-val">${info.count}</div>
        </div>
      `);
    });
    grid.appendChild(srcCard);

    // 7-Day Trend
    const trendCard = el('div', 'chart-card');
    trendCard.innerHTML = `<div class="chart-card-title">${t('stats_trend')}</div>`;
    const trend = stats.recent_7_days || [];
    if (trend.length > 0) {
      const maxTrend = Math.max(...trend.map(r => r.count), 1);
      trend.forEach(row => {
        const pct = Math.round(row.count / maxTrend * 100);
        trendCard.insertAdjacentHTML('beforeend', `
          <div class="bar-chart-row">
            <div class="bar-chart-label">${row.date?.slice(5) || '—'}</div>
            <div class="bar-chart-bar-wrap">
              <div class="bar-chart-bar" style="width:${pct}%;background:var(--color-success)"></div>
            </div>
            <div class="bar-chart-val">${row.count}</div>
          </div>
        `);
      });
    } else {
      trendCard.insertAdjacentHTML('beforeend',
        `<div class="text-xs text-muted" style="padding:16px 0">暂无趋势数据 / No data yet</div>`);
    }
    grid.appendChild(trendCard);

    container.appendChild(grid);

    const historyGrid = el('div', 'stats-history-grid');
    const statusPill = (status) => {
      const normalized = String(status || '').toLowerCase();
      const cls = normalized === 'success' || normalized === 'done'
        ? 'ok'
        : normalized === 'running'
          ? 'running'
          : 'error';
      const label = normalized || '—';
      return `<span class="ops-status-pill ${cls}">${escapeHtml(label)}</span>`;
    };
    const scrapeRows = scrapeHistory.length ? scrapeHistory.map((row) => `
      <tr>
        <td>${escapeHtml(compactSourceName(row.source_id || '—'))}</td>
        <td>${escapeHtml(formatDateTimeLabel(row.started_at || ''))}</td>
        <td>${Number(row.items_found || 0).toLocaleString()}</td>
        <td>${Number(row.items_new || 0).toLocaleString()}</td>
        <td>${statusPill(row.status)}</td>
      </tr>
    `).join('') : `<tr><td colspan="5" class="ops-empty">${state.lang === 'zh' ? '暂无抓取历史' : 'No scrape history yet'}</td></tr>`;
    const aiRows = aiHistory.length ? aiHistory.map((row) => `
      <tr>
        <td>${escapeHtml(formatDateTimeLabel(row.started_at || ''))}</td>
        <td>${Number(row.items_attempted || 0).toLocaleString()}</td>
        <td>${Number(row.items_success || 0).toLocaleString()}</td>
        <td>${Number(row.items_failed || 0).toLocaleString()}</td>
        <td>${escapeHtml(row.model_used || '—')}</td>
        <td>${statusPill(row.status)}</td>
      </tr>
    `).join('') : `<tr><td colspan="6" class="ops-empty">${state.lang === 'zh' ? '暂无AI分析历史' : 'No AI history yet'}</td></tr>`;
    const qualityRows = qualityHistory.length ? qualityHistory.map((row) => `
      <tr>
        <td>${escapeHtml(row.stage || '—')}</td>
        <td>${escapeHtml(formatDateTimeLabel(row.started_at || ''))}</td>
        <td>${Number(row.items_matched || 0).toLocaleString()}</td>
        <td>${Number(row.items_deleted || 0).toLocaleString()}</td>
        <td>${statusPill(row.status)}</td>
      </tr>
    `).join('') : `<tr><td colspan="5" class="ops-empty">${state.lang === 'zh' ? '暂无质检历史' : 'No quality history yet'}</td></tr>`;
    historyGrid.innerHTML = `
      <div class="chart-card">
        <div class="chart-card-title">${t('stats_scrape_history')}</div>
        <div class="ops-history-table">
          <table>
            <thead>
              <tr>
                <th>${t('stats_col_source')}</th>
                <th>${t('stats_col_started')}</th>
                <th>${t('stats_col_found')}</th>
                <th>${t('stats_col_new')}</th>
                <th>${t('stats_col_status')}</th>
              </tr>
            </thead>
            <tbody>${scrapeRows}</tbody>
          </table>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title">${t('stats_ai_history')}</div>
        <div class="ops-history-table">
          <table>
            <thead>
              <tr>
                <th>${t('stats_col_started')}</th>
                <th>${t('stats_col_attempted')}</th>
                <th>${t('stats_col_success')}</th>
                <th>${t('stats_col_failed')}</th>
                <th>${t('stats_col_model')}</th>
                <th>${t('stats_col_status')}</th>
              </tr>
            </thead>
            <tbody>${aiRows}</tbody>
          </table>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title">${t('stats_quality_history')}</div>
        <div class="ops-history-table">
          <table>
            <thead>
              <tr>
                <th>${t('stats_col_stage')}</th>
                <th>${t('stats_col_started')}</th>
                <th>${t('stats_col_matched')}</th>
                <th>${t('stats_col_deleted')}</th>
                <th>${t('stats_col_status')}</th>
              </tr>
            </thead>
            <tbody>${qualityRows}</tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(historyGrid);

    const clusterCard = el('div', 'chart-card');
    clusterCard.innerHTML = `
      <div class="section-heading-row" style="margin-bottom:14px">
        <div>
          <div class="section-kicker">${t('stats_title')}</div>
          <h3 class="section-title" style="font-size:20px">${t('stats_event_clusters')}</h3>
        </div>
        <div class="section-meta">${t('stats_event_clusters_desc')}</div>
      </div>
      <div class="ops-event-list">
        ${eventClusters.length ? eventClusters.map((cluster) => `
          <article class="ops-event-item">
            <div class="ops-event-head">
              <div>
                <div class="ops-event-title">${escapeHtml(cluster.headline || '—')}</div>
                <div class="ops-event-sub">${escapeHtml(cluster.headline_en || '')}</div>
              </div>
              <div class="ops-event-metrics">
                <span class="ops-event-pill">${Number(cluster.item_count || 0).toLocaleString()} ${t('stats_cluster_items')}</span>
                <span class="ops-event-pill">${Number(cluster.source_count || 0).toLocaleString()} ${t('stats_cluster_sources')}</span>
              </div>
            </div>
            <div class="ops-event-meta">
              <span>${escapeHtml((cluster.sources || []).join(' · '))}</span>
              <span>${t('stats_cluster_latest')}: ${escapeHtml(formatDateTimeLabel(cluster.latest_at || ''))}</span>
            </div>
          </article>
        `).join('') : `<div class="ops-empty">${state.lang === 'zh' ? '当前窗口内暂无需要聚合展示的重复事件。' : 'No multi-item event clusters in the current window.'}</div>`}
      </div>
    `;
    container.appendChild(clusterCard);

  } catch (err) {
    container.innerHTML = renderErrorState(err.message);
  }
}

// ── About Page ────────────────────────────────

async function renderAboutPage(container) {
  container.innerHTML = `<div class="state-container"><div class="state-icon">🧭</div><div class="state-title">${t('loading')}</div></div>`;

  try {
    const [stats, sourcesData, health] = await Promise.all([
      apiFetch('/stats'),
      apiFetch('/sources'),
      apiFetch('/health'),
    ]);

    state.stats = stats;
    state.lastStatsToken = getStatsRefreshToken(stats);
    state.sources = sourcesData.sources || [];

    const groupedSources = { official: [], media: [], lawfirm: [] };
    state.sources.forEach((source) => {
      groupedSources[source.category]?.push({ ...source });
    });
    Object.keys(groupedSources).forEach((key) => {
      groupedSources[key].sort((a, b) => (b.item_count - a.item_count) || a.name_en.localeCompare(b.name_en));
    });

    const statusCards = [
      [t('about_status_total'), stats.total_items || 0],
      [t('about_status_structured'), stats.ai_structured_done || 0],
      [t('about_status_relevant'), stats.ai_relevant || 0],
      [t('about_status_irrelevant'), stats.ai_irrelevant || 0],
    ];

    const workflowSteps = [1, 2, 3, 4, 5].map((idx) => ({
      title: t(`about_workflow_step${idx}`),
      desc: t(`about_workflow_step${idx}_desc`),
    }));

    const assuranceCards = [
      [
        t('about_method_metric_ai_success'),
        stats.ai_success_rate_24h != null ? `${stats.ai_success_rate_24h}%` : '—',
        t('about_method_metric_ai_success_desc'),
      ],
      [
        t('about_method_metric_quality_deleted'),
        Number(stats.quality_guard_deleted_24h || 0).toLocaleString(),
        t('about_method_metric_quality_deleted_desc'),
      ],
      [
        t('about_method_metric_last_quality'),
        formatDateTimeLabel(stats.last_quality_guard_time || ''),
        t('about_method_metric_last_quality_desc'),
      ],
    ];

    const precisionPoints = [1, 2, 3, 4].map((idx) => t(`about_method_precision_${idx}`));
    const stabilityPoints = [1, 2, 3, 4].map((idx) => t(`about_method_stability_${idx}`));

    const outputCards = [
      [t('about_output_title'), `${t('label_translated_title')} + ${t('label_original_title')}`],
      [t('about_output_core'), t('block_core_points')],
      [t('about_output_insight'), t('block_insight')],
      [t('about_output_link'), t('block_original_link')],
      [t('about_output_meta'), t('about_output_meta_desc')],
    ];

    container.innerHTML = '';
    const page = el('section', 'about-page');
    page.innerHTML = `
      <div class="about-hero">
        <div class="about-hero-copy">
          <div class="section-kicker">${t('about_purpose_kicker')}</div>
          <h1 class="about-title">${t('about_title')}</h1>
          <div class="about-subtitle">${t('about_subtitle')}</div>
          <p class="about-summary">${t('about_purpose_desc')}</p>
          <div class="hero-chip-row">
            <span class="hero-chip"><strong>${t('label_next_window')}</strong>${stats.next_scrape || '—'}</span>
            <span class="hero-chip"><strong>${t('hero_overview_sources')}</strong>${stats.total_sources || 0}</span>
            <span class="hero-chip"><strong>AI</strong>${health.ai_model || '—'}</span>
            <span class="hero-chip"><strong>Flow</strong>${stats.workflow_version || '—'}</span>
            <span class="hero-chip"><strong>${t('sources_summary_window')}</strong>${formatCollectionWindow(stats)}</span>
            <span class="hero-chip"><strong>${t('hero_refresh')}</strong>${formatDateTimeLabel(stats.last_analyze_time || stats.last_scrape_time || '')}</span>
          </div>
        </div>
        <div class="about-status-panel">
          <div class="intel-panel-head">
            <div class="intel-panel-kicker">${t('about_status_kicker')}</div>
            <span class="intel-panel-count">${String(stats.ai_structured_done || 0).padStart(3, '0')}</span>
          </div>
          <div class="about-status-title">${t('about_status_title')}</div>
          <p class="about-status-desc">${t('about_status_desc')}</p>
          <div class="about-status-grid">
            ${statusCards.map(([label, value]) => `
              <div class="about-status-card">
                <span>${escapeHtml(label)}</span>
                <strong>${Number(value).toLocaleString()}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="section-heading-row">
        <div>
          <div class="section-kicker">${t('about_workflow_kicker')}</div>
          <h2 class="section-title">${t('about_workflow_title')}</h2>
        </div>
        <div class="section-meta">${formatCollectionWindow(stats)}</div>
      </div>
      <div class="about-workflow-grid">
        ${workflowSteps.map((step, idx) => `
          <article class="about-workflow-card">
            <div class="about-workflow-index">${String(idx + 1).padStart(2, '0')}</div>
            <h3>${escapeHtml(step.title)}</h3>
            <p>${escapeHtml(step.desc)}</p>
          </article>
        `).join('')}
      </div>

      <div class="about-source-section">
        <div class="section-heading-row">
          <div>
            <div class="section-kicker">${t('about_sources_kicker')}</div>
            <h2 class="section-title">${t('about_sources_title')}</h2>
          </div>
          <div class="section-meta">${t('about_sources_desc')}</div>
        </div>
        <div class="about-source-grid">
          ${renderAboutSourceColumn(t('about_source_official'), groupedSources.official)}
          ${renderAboutSourceColumn(t('about_source_media'), groupedSources.media)}
          ${renderAboutSourceColumn(t('about_source_lawfirm'), groupedSources.lawfirm)}
        </div>
      </div>

      <div class="about-method-grid">
        <section class="about-method-panel about-method-summary">
          <div class="section-kicker">${t('about_method_kicker')}</div>
          <h2 class="section-title">${t('about_method_title')}</h2>
          <p class="about-method-intro">${t('about_method_intro')}</p>
          <div class="about-method-stats">
            ${assuranceCards.map(([label, value, desc]) => `
              <article class="about-method-stat-card">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value || '—')}</strong>
                <small>${escapeHtml(desc)}</small>
              </article>
            `).join('')}
          </div>
          <div class="about-method-note">${t('about_method_note')}</div>
        </section>
        <section class="about-method-panel">
          <div class="section-kicker">${t('about_method_precision_title')}</div>
          <h2 class="section-title">${t('about_method_precision_title')}</h2>
          ${renderPointList(precisionPoints, 'intel-points')}
        </section>
        <section class="about-method-panel">
          <div class="section-kicker">${t('about_method_stability_title')}</div>
          <h2 class="section-title">${t('about_method_stability_title')}</h2>
          ${renderPointList(stabilityPoints, 'intel-points')}
        </section>

      </div>

      <div class="about-output-section">
        <section class="about-output-panel">
          <div class="section-kicker">${t('about_outputs_kicker')}</div>
          <h2 class="section-title">${t('about_outputs_title')}</h2>
          <div class="about-output-grid">
            ${outputCards.map(([title, desc]) => `
              <article class="about-output-card">
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(desc)}</span>
              </article>
            `).join('')}
          </div>
        </section>
      </div>

      <div class="about-cta-row">
        <button class="btn btn-secondary" data-about-back>${t('about_cta_back')}</button>
        <button class="btn btn-secondary" data-about-sources>${t('about_cta_sources')}</button>
      </div>
    `;

    page.querySelector('[data-about-back]')?.addEventListener('click', () => navigate('news'));
    page.querySelector('[data-about-sources]')?.addEventListener('click', () => navigate('sources'));
    container.appendChild(page);
  } catch (err) {
    container.innerHTML = renderErrorState(err.message);
  }
}

function renderAboutSourceColumn(title, sources) {
  return `
    <section class="about-source-panel">
      <div class="intel-panel-head">
        <div class="intel-panel-kicker">${escapeHtml(title)}</div>
        <span class="intel-panel-count">${String((sources || []).length).padStart(2, '0')}</span>
      </div>
      <div class="about-source-list">
        ${(sources || []).slice(0, 10).map((source) => `
          <a class="about-source-item" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">
            <div class="about-source-copy">
              <span class="about-source-name">${escapeHtml(source.logo_emoji || '•')} ${escapeHtml(state.lang === 'zh' ? source.name_zh : source.name_en)}</span>
              <span class="about-source-meta">
                ${t('about_source_window')}: ${Number(source.item_count || 0).toLocaleString()}
                · ${t('about_source_relevant')}: ${Number(source.relevant_count || 0).toLocaleString()}
                · ${t('about_source_rich')}: ${Number(source.rich_count || 0).toLocaleString()}
                · ${t('about_source_latest')}: ${escapeHtml(formatDateLabel(source.latest_at || ''))}
              </span>
            </div>
            <strong>${Number(source.item_count || 0).toLocaleString()}</strong>
          </a>
        `).join('') || `<div class="mini-empty">${t('card_empty')}</div>`}
      </div>
    </section>
  `;
}

// ── Settings Page ─────────────────────────────

function renderSettingsPage(container) {
  container.innerHTML = '';
  const title = el('div', 'text-sm font-bold mt-4', t('settings_title'));
  container.appendChild(title);

  // ── Scrape Settings Card ──
  const scrapeCard = el('div', 'settings-card mt-4');
  scrapeCard.innerHTML = `
    <div class="settings-card-title">${state.lang === 'zh' ? '⚙️ 抓取设置' : '⚙️ Scrape Settings'}</div>
    <div class="settings-row">
      <div>
        <div class="settings-label">${t('settings_interval')}</div>
        <div class="settings-desc">${t('settings_interval_desc')}</div>
      </div>
      <div class="flex items-center gap-2">
        <input type="number" class="settings-input" id="interval-input"
               value="7" min="0" max="23">
        <span class="text-xs text-muted">${t('settings_interval_unit')}</span>
      </div>
    </div>
    <div class="settings-row">
      <div>
        <div class="settings-label">${state.lang === 'zh' ? '全源刷新' : 'Full Refresh'}</div>
        <div class="settings-desc">${state.lang === 'zh' ? '手动触发一次全源刷新并更新所有来源的最新内容' : 'Manually trigger a full refresh and update the latest items from all sources'}</div>
      </div>
      <button class="btn btn-primary" id="manual-scrape-btn">
        ⬇ ${t('btn_refresh')}
      </button>
    </div>
  `;
  container.appendChild(scrapeCard);

  // ── AI Settings Card ──
  const aiCard = el('div', 'settings-card mt-4');
  aiCard.innerHTML = `
    <div class="settings-card-title">🤖 ${t('settings_ai_title')}</div>
    <div class="settings-row">
      <div>
        <div class="settings-label">${t('settings_ai_key_status')}</div>
      </div>
      <div id="ai-key-status" class="text-sm">${state.lang === 'zh' ? '检查中...' : 'Checking...'}</div>
    </div>
    <div class="settings-row">
      <div>
        <div class="settings-label">${t('settings_ai_model')}</div>
        <div class="settings-desc">${t('settings_ai_model_desc')}</div>
      </div>
      <div class="flex items-center gap-2">
        <input type="text" class="settings-input" id="model-input"
               value="qwen-plus" placeholder="qwen-plus" style="width:160px">
      </div>
    </div>
    <div class="settings-row">
      <div>
        <div class="settings-label">${t('settings_ai_auto')}</div>
        <div class="settings-desc">${t('settings_ai_auto_desc')}</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="auto-analyze-toggle">
        <span class="toggle-slider"></span>
      </label>
    </div>
    <div class="settings-row">
      <div>
        <div class="settings-label">${state.lang === 'zh' ? '立即运行AI分析' : 'Run AI Analysis Now'}</div>
        <div class="settings-desc">${state.lang === 'zh' ? '对所有待分析文章立即运行AI分析' : 'Run AI analysis on all pending articles now'}</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-secondary" id="analyze-btn">🤖 ${t('btn_analyze')}</button>
        <button class="btn btn-primary" id="pipeline-btn">🚀 ${t('btn_pipeline')}</button>
      </div>
    </div>
  `;
  container.appendChild(aiCard);

  const appearanceCard = el('div', 'settings-card mt-4');
  appearanceCard.innerHTML = `
    <div class="settings-card-title">${state.lang === 'zh' ? '🎨 界面外观' : '🎨 Appearance'}</div>
    <div class="settings-row">
      <div>
        <div class="settings-label">${t('settings_theme')}</div>
        <div class="settings-desc">${t('settings_theme_desc')}</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="theme-dark-toggle" ${state.theme === 'dark' ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
  container.appendChild(appearanceCard);

  // ── Save Button ──
  const saveRow = el('div', 'settings-card mt-4');
  saveRow.innerHTML = `
    <div class="settings-row" style="justify-content:flex-end">
      <button class="btn btn-primary" id="save-settings-btn">💾 ${t('btn_save')}</button>
    </div>
  `;
  container.appendChild(saveRow);

  // Wire up events
  scrapeCard.querySelector('#manual-scrape-btn')?.addEventListener('click', triggerScrape);
  aiCard.querySelector('#analyze-btn')?.addEventListener('click', triggerAnalyze);
  aiCard.querySelector('#pipeline-btn')?.addEventListener('click', triggerPipeline);
  appearanceCard.querySelector('#theme-dark-toggle')?.addEventListener('change', (event) => {
    applyTheme(event.target.checked ? 'dark' : 'light');
  });

  saveRow.querySelector('#save-settings-btn')?.addEventListener('click', async () => {
    const hour = parseInt(scrapeCard.querySelector('#interval-input').value);
    const model = aiCard.querySelector('#model-input').value.trim();
    const autoAnalyze = aiCard.querySelector('#auto-analyze-toggle').checked;
    if (isNaN(hour) || hour < 0 || hour > 23) {
      showToast(state.lang === 'zh' ? '请输入 0-23 之间的整数' : 'Enter a number 0–23', 'error');
      return;
    }
    try {
      await apiFetch('/config', { method: 'PATCH', body: JSON.stringify({
        daily_scrape_hour: hour,
        qwen_model: model || undefined,
        analyze_after_scrape: autoAnalyze,
      }) });
      showToast(state.lang === 'zh' ? '设置已保存 ✓' : 'Settings saved ✓', 'success');
    } catch (err) {
      showToast(state.lang === 'zh' ? '保存失败' : 'Save failed', 'error');
    }
  });

  // Load current config & health
  Promise.all([
    apiFetch('/config').catch(() => ({})),
    apiFetch('/health').catch(() => ({})),
  ]).then(([config, health]) => {
    const hourInput = scrapeCard.querySelector('#interval-input');
    if (hourInput) hourInput.value = config.daily_scrape_hour ?? 7;

    const modelInput = aiCard.querySelector('#model-input');
    if (modelInput && config.qwen_model) modelInput.value = config.qwen_model;

    const toggle = aiCard.querySelector('#auto-analyze-toggle');
    if (toggle) toggle.checked = config.analyze_after_scrape ?? false;

    const keyEl = document.getElementById('ai-key-status');
    if (keyEl) {
      keyEl.textContent = health.ai_enabled ? t('settings_ai_key_set') : t('settings_ai_key_unset');
    }
  });
}

// ──────────────────────────────────────────────
// Modal: News Detail
// ──────────────────────────────────────────────

function showNewsDetail(item) {
  const root = document.getElementById('modal-root');
  const ipType = item.ip_type || 'general';
  const linkDateMeta = buildOriginalLinkDateMeta(item);
  const aiDone = item.ai_status === 'done';
  const hostname = (() => { try { return new URL(item.url).hostname; } catch { return item.url; } })();
  const primaryTitle = state.lang === 'zh' && item.title_zh ? item.title_zh : item.title;
  const secondaryTitle = item.title_zh ? item.title : '';
  const fallbackSummary = buildFallbackBrief(item, 'summary');
  const fallbackInsight = buildFallbackBrief(item, 'signal');
  const summaryPoints = resolvePointList(item.ai_core_points_zh, item.ai_summary_zh || item.summary || fallbackSummary, 4, 180);
  const insightPoints = resolvePointList(item.ai_insight_points_zh, item.ai_insight_zh || fallbackInsight, 3, 170);

  const overlay = el('div', 'modal-overlay');
  overlay.innerHTML = `
    <div class="modal modal-wide">
      <div class="modal-header">
        <div class="modal-header-copy">
          <div class="modal-header-tags">
            <span class="ip-badge ${ipType}">${getIpTypeLabel(ipType)}</span>
            <span class="source-badge ${item.category}">${item.source_name || ''}</span>
            ${renderGeoBadges(item)}
            ${renderAnalysisDepthBadge(item, true)}
            ${renderSignalTagPills(item, true)}
            ${aiDone ? '<span class="ai-badge ai-badge-sm">AI</span>' : ''}
          </div>
          <div class="modal-header-caption">${t('section_priority')}</div>
        </div>
        <button class="modal-close" id="modal-close">✕</button>
      </div>
      <div class="modal-body">
        <div class="intel-block modal-intel-block title">
          <div class="modal-title-pair">
            <div class="modal-title-main">${escapeHtml(primaryTitle)}</div>
            ${secondaryTitle ? `<div class="modal-title-sub">${escapeHtml(secondaryTitle)}</div>` : ''}
          </div>
        </div>
        <div class="intel-block modal-intel-block">
          <div class="intel-block-label">${t('block_core_points')}</div>
          ${renderPointList(summaryPoints)}
        </div>
        <div class="intel-block modal-intel-block insight">
          <div class="intel-block-label">${t('block_insight')}</div>
          ${renderPointList(insightPoints)}
        </div>
        <div class="intel-block modal-intel-block intel-link-block">
          <div class="intel-block-label">${t('block_original_link')}</div>
          <div class="intel-link-row modal-link-row">
            <div class="intel-link-meta">
              <strong>${escapeHtml(item.source_name || '—')}</strong>
              <span>${escapeHtml(linkDateMeta)} · ${hostname}</span>
            </div>
            <a href="${item.url}" target="_blank" rel="noopener" class="btn btn-primary">${t('detail_btn')}</a>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-close-btn">${t('btn_close')}</button>
        <span class="modal-status-hint">${aiDone ? `AI ${t('ai_done')}` : t('ai_pending')}</span>
      </div>
    </div>
  `;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#modal-close')?.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#modal-close-btn')?.addEventListener('click', () => overlay.remove());
  root.appendChild(overlay);
}

async function triggerReportExport(reportType, format) {
  try {
    const res = await apiFetch(`/reports/${reportType}/export?fmt=${encodeURIComponent(format)}`);
    if (format === 'pdf') {
      downloadBase64File(res.filename, res.content_base64, res.mime_type || 'application/pdf');
    } else {
      const mimeType = format === 'html' ? 'text/html;charset=utf-8' : 'text/markdown;charset=utf-8';
      downloadTextFile(res.filename, res.content, mimeType);
    }
    showToast(`${t('export_done')}: ${res.saved_path}`, 'success', 5000);
  } catch (err) {
    showToast(t('export_failed'), 'error');
  }
}

// ──────────────────────────────────────────────
// Scrape & AI Actions
// ──────────────────────────────────────────────

async function triggerScrape() {
  if (state.scraping) return;
  state.scraping = true;
  const btn = document.getElementById('scrape-btn');
  if (btn) { btn.classList.add('loading'); btn.innerHTML = `<span class="spin">⟳</span> ${t('btn_refreshing')}`; }

  try {
    await apiFetch('/pipeline-enhanced', { method: 'POST' });
    showToast(t('scrape_started'), 'success');

    // Give the background pipeline enough time to pull RSS + official sources.
    setTimeout(async () => {
      state.scraping = false;
      if (state.currentPage === 'news') await renderMainContent();
    }, 15000);
  } catch (err) {
    state.scraping = false;
    showToast(t('scrape_error'), 'error');
    if (btn) { btn.classList.remove('loading'); btn.innerHTML = t('label_manual_refresh'); }
  }
}

async function triggerAnalyze() {
  const btn = document.activeElement?.id === 'analyze-btn'
    ? document.getElementById('analyze-btn')
    : document.getElementById('analyze-btn');
  const origText = btn?.innerHTML;
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin">⟳</span> ${t('btn_analyzing')}`; }
  try {
    const res = await apiFetch('/analyze', { method: 'POST' });
    showToast(
      `${t('analyze_started')} (${res.pending_count ?? '?'} ${state.lang === 'zh' ? '篇待分析' : 'items'})`,
      'success'
    );
    // Refresh news list after 10s to pick up analyzed items
    setTimeout(() => { if (state.currentPage === 'news') renderMainContent(); }, 10000);
  } catch (err) {
    showToast(t('analyze_error'), 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function triggerPipeline() {
  const btn = document.getElementById('pipeline-btn');
  const origText = btn?.innerHTML;
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin">⟳</span> ${state.lang === 'zh' ? '运行中...' : 'Running...'}`; }
  try {
    await apiFetch('/pipeline-enhanced', { method: 'POST' });
    showToast(
      state.lang === 'zh' ? '🚀 抓取+AI分析已启动，约需几分钟' : '🚀 Pipeline started (scrape + analyze)',
      'success',
      5000
    );
    setTimeout(() => { if (state.currentPage === 'news') renderMainContent(); }, 15000);
  } catch (err) {
    showToast(state.lang === 'zh' ? '启动失败，请检查服务状态' : 'Failed to start pipeline', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

// ──────────────────────────────────────────────
// Event Listeners
// ──────────────────────────────────────────────

function attachEvents() {
  // Language toggle
  $$('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  // Sidebar nav
  $$('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      const ipType = btn.dataset.iptype;
      if (ipType) {
        state.focusViewExpanded = false;
        releaseDefaultEditorialLaneForFocusedNews();
        state.filters.ip_type = ipType;
        navigate(page, ipType);
      } else {
        navigate(page);
      }
    });
  });

  // Scrape button
  document.getElementById('scrape-btn')?.addEventListener('click', triggerScrape);

  // AI analyze button (settings)
  document.getElementById('analyze-btn')?.addEventListener('click', triggerAnalyze);

  // Search input (debounced)
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(state.searchDebounceTimer);
      state.searchDebounceTimer = setTimeout(() => {
        state.focusViewExpanded = false;
        state.filters.q = e.target.value.trim();
        if (state.filters.q) releaseDefaultEditorialLaneForFocusedNews();
        state.pagination.page = 1;
        renderMainContent();
      }, 400);
    });
  }

  // Filter chips
  $$('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      const value = chip.dataset.value;
      state.pagination.page = 1;
      state.focusViewExpanded = false;

      if (shouldReleaseDefaultEditorialLane(filter, value)) {
        releaseDefaultEditorialLaneForFocusedNews();
      }

      if (filter === 'has_ai') {
        // Toggle boolean
        state.filters.has_ai = !state.filters.has_ai;
        chip.classList.toggle('active', state.filters.has_ai);
      } else if (filter === 'editorial_lane') {
        state.filters[filter] = value;
        localStorage.setItem('pontnova_editorial_lane', value);
        $$(`[data-filter="editorial_lane"]`).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      } else if (filter === 'scope') {
        state.filters[filter] = value;
        localStorage.setItem('pontnova_scope', value);
        $$(`[data-filter="scope"]`).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      } else {
        state.filters[filter] = value;
        // Update active chips in this group only
        $$(`[data-filter="${filter}"]`).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      }

      renderMainContent();
    });
  });

  const content = document.querySelector('.content-area');
  if (content) {
    content.addEventListener('scroll', () => {
      if (state.currentPage === 'reports') {
        syncReportsNavByScroll();
      }
    }, { passive: true });
  }
}

// ──────────────────────────────────────────────
// Utility Functions
// ──────────────────────────────────────────────

function syncContentFrameGeometry() {
  const main = document.querySelector('.main-content');
  const content = document.querySelector('.content-area');
  const page = document.getElementById('page-content');
  if (!main || !content || !page) return;

  const mainRect = main.getBoundingClientRect();
  const pageRect = page.getBoundingClientRect();
  const frameLeft = Math.max(0, pageRect.left - mainRect.left);
  const frameWidth = Math.max(0, pageRect.width);

  document.documentElement.style.setProperty('--content-frame-left', `${frameLeft}px`);
  document.documentElement.style.setProperty('--content-frame-width', `${frameWidth}px`);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr.slice(0, 10);
    return d.toLocaleDateString(state.lang === 'zh' ? 'zh-CN' : 'en-GB', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch { return dateStr?.slice(0, 10) || '—'; }
}

function formatDateLabel(dateStr) {
  return formatDate(dateStr);
}

function formatDateTimeLabel(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleString(state.lang === 'zh' ? 'zh-CN' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr || '—';
  }
}

function formatCollectionWindow(payload) {
  const from = payload?.date_from || payload?.collection_start_date || '';
  const to = payload?.date_to || payload?.collection_end_date || '';
  if (!from && !to) return '';
  return `${formatDate(from)} — ${formatDate(to)}`;
}

function getTopicStrategyMeta(topic) {
  const topicId = topic?.topic_id || state.currentTopicId || '';
  if (topicId !== 'sep_frand') return null;
  return {
    label: t('topic_long_window'),
    hint: t('topic_long_window_hint'),
  };
}

function getIpTypeLabel(type) {
  const labels = {
    zh: { all: '全部', patent: '专利', trademark: '商标', design: '外观', copyright: '版权', data: '数据', sep: 'SEP标准必要专利', gi: '地标', general: '综合' },
    en: { all: 'All', patent: 'Patent', trademark: 'Trademark', design: 'Design', copyright: 'Copyright', data: 'Data', sep: 'SEP Standard-Essential Patents', gi: 'GI', general: 'General' },
  };
  return labels[state.lang]?.[type] || type;
}

function getLevelLabel(level) {
  const map = {
    high: t('level_high'),
    medium: t('level_medium'),
    low: t('level_low'),
    immediate: t('level_immediate'),
    soon: t('level_soon'),
    watch: t('level_watch'),
  };
  return map[level] || level || '—';
}

function renderSignalTagPills(item, compact = false) {
  if (!item) return '';
  const cls = compact ? ' compact' : '';
  return `
    <span class="signal-pill impact ${item.impact_level || 'low'}${cls}">${t('impact_label')} ${getLevelLabel(item.impact_level)}</span>
    <span class="signal-pill risk ${item.risk_level || 'low'}${cls}">${t('risk_label')} ${getLevelLabel(item.risk_level)}</span>
    <span class="signal-pill urgency ${item.urgency_level || 'watch'}${cls}">${t('urgency_label')} ${getLevelLabel(item.urgency_level)}</span>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderSkeletons(count) {
  const grid = `<div class="news-grid mt-4">` +
    Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton-line w-1-2 h-16"></div>
        <div class="skeleton-line w-full h-24"></div>
        <div class="skeleton-line w-full"></div>
        <div class="skeleton-line w-3-4"></div>
      </div>
    `).join('') + '</div>';
  return `<div class="stats-row">${[1,2,3,4].map(() => '<div class="stat-card"><div class="skeleton-line h-24 w-1-2"></div><div class="skeleton-line w-full" style="margin-top:8px"></div></div>').join('')}</div>${grid}`;
}

function renderEmptyState() {
  const wrap = el('div', 'state-container');
  wrap.innerHTML = `
    <div class="state-icon">🗂️</div>
    <div class="state-title">${t('no_news')}</div>
    <div class="state-desc">${t('no_news_desc')}</div>
    <button class="btn btn-primary" onclick="triggerScrape()">⬇ ${t('btn_refresh')}</button>
  `;
  return wrap;
}

function renderErrorState(msg) {
  return `
    <div class="state-container">
      <div class="state-icon">⚠️</div>
      <div class="state-title">${state.lang === 'zh' ? '加载失败' : 'Load Failed'}</div>
      <div class="state-desc">${escapeHtml(msg)}</div>
      <button class="btn btn-secondary" onclick="renderMainContent()">
        ${state.lang === 'zh' ? '重试' : 'Retry'}
      </button>
    </div>
  `;
}

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
  window.addEventListener('resize', syncContentFrameGeometry);

  // Auto-refresh stats every 60s
  if (STATIC_MODE) return;
  setInterval(async () => {
    try {
      const stats = await apiFetch('/stats');
      const nextToken = getStatsRefreshToken(stats);
      const shouldRefreshContent =
        Boolean(state.lastStatsToken) &&
        nextToken !== state.lastStatsToken &&
        state.currentPage !== 'settings' &&
        !document.querySelector('.modal-overlay');
      state.stats = stats;
      state.lastStatsToken = nextToken;
      document.querySelector('.statusbar')?.replaceWith(renderStatusBar());
      if (shouldRefreshContent) {
        renderMainContent();
      }
    } catch (e) { /* silent */ }
  }, 60000);
});

// Expose for inline handlers
window.triggerScrape = triggerScrape;
window.triggerAnalyze = triggerAnalyze;
window.triggerPipeline = triggerPipeline;
window.renderMainContent = renderMainContent;
