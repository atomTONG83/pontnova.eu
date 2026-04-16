#!/usr/bin/env python3
"""
同步“Pontnova Europe IP Intelligence”展示版静态快照。

默认从本机运行中的研究服务抓取公开展示所需数据，并写入
pontnova.eu/eu_ip_sentinel_assets/data/snapshot.json
"""

from __future__ import annotations

import json
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


API_BASE = "http://127.0.0.1:8013/api"
APP_BASE = "http://127.0.0.1:8013"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "eu_ip_sentinel_assets" / "data"
LEGACY_OUTPUT_PATH = OUTPUT_DIR / "snapshot.json"
INDEX_OUTPUT_PATH = OUTPUT_DIR / "snapshot.index.json"
MANIFEST_OUTPUT_PATH = OUTPUT_DIR / "snapshot.manifest.json"
NEWS_INDEX_OUTPUT_PATH = OUTPUT_DIR / "news.index.json"
TOPIC_DETAILS_DIR = OUTPUT_DIR / "topic-details"
AUDIO_BRIEF_DIR = OUTPUT_DIR / "audio-briefs"
AUDIO_BRIEF_OUTPUT_NAME = "daily-latest.mp3"
NEWS_LANES = ("core", "watch", "calendar", "pending")

NEWS_INDEX_FIELDS = (
    "id",
    "guid",
    "title",
    "title_zh",
    "url",
    "source_id",
    "source_name",
    "category",
    "ip_type",
    "published_at",
    "scraped_at",
    "language",
    "primary_scope",
    "ai_primary_scope",
    "geo_tags_list",
    "geo_label_zh",
    "geo_label_en",
    "geo_tag_labels_zh",
    "geo_tag_labels_en",
    "summary",
    "ai_summary_zh",
    "ai_insight_zh",
    "ai_core_points_zh",
    "ai_insight_points_zh",
    "ai_key_points_zh",
    "ai_status",
    "ai_is_relevant",
    "ai_model",
    "ai_confidence",
    "ai_analyzed_at",
    "ai_document_type",
    "ai_topic_primary",
    "ai_topic_secondary_list",
    "ai_institutions",
    "analysis_depth",
    "analysis_depth_label_zh",
    "analysis_depth_label_en",
    "analysis_depth_desc_zh",
    "analysis_depth_desc_en",
    "event_cluster_key",
    "editorial_lane",
    "editorial_lane_label_zh",
    "editorial_lane_label_en",
    "impact_level",
    "risk_level",
    "urgency_level",
    "is_featured",
    "is_read",
)


def fetch_json(path: str, retries: int = 6, sleep_seconds: float = 1.2):
    url = f"{API_BASE}{path}"
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            if attempt == retries:
                raise
            time.sleep(sleep_seconds * attempt)
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def fetch_optional_json(path: str, fallback):
    try:
        return fetch_json(path)
    except Exception:
        return fallback


def download_binary(url: str, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as response:
        output_path.write_bytes(response.read())


def fetch_all_news():
    page = 1
    limit = 100
    items = []
    while True:
        query = urllib.parse.urlencode({
            "page": page,
            "limit": limit,
            "relevant_only": "true",
        })
        payload = fetch_json(f"/news?{query}")
        items.extend(payload.get("items", []))
        if page >= int(payload.get("pages", 1)):
            break
        page += 1
    return items


def compact_object(payload: dict) -> dict:
    return {
        key: value
        for key, value in payload.items()
        if value not in (None, "", [], {})
    }


def build_news_index_item(item: dict) -> dict:
    return compact_object({
        key: item.get(key)
        for key in NEWS_INDEX_FIELDS
    })


def build_news_index(items: list[dict]) -> list[dict]:
    return [build_news_index_item(item) for item in items]


def resolve_editorial_lane(item: dict) -> str:
    lane = str(item.get("editorial_lane") or "").strip().lower()
    return lane if lane in NEWS_LANES else "pending"


def build_news_lane_payloads(items: list[dict], generated_at: str) -> dict[str, dict]:
    buckets = {lane: [] for lane in NEWS_LANES}
    for item in items:
        buckets[resolve_editorial_lane(item)].append(item)
    return {
        lane: {
            "generated_at": generated_at,
            "lane": lane,
            "total": len(bucket_items),
            "items": bucket_items,
        }
        for lane, bucket_items in buckets.items()
    }


def build_topic_detail_payload(topic: dict, items_payload: dict) -> dict:
    slim_items = build_news_index(items_payload.get("items", []))
    return {
        "brief": topic,
        "items": slim_items,
        "total": items_payload.get("total", len(slim_items)),
    }


def encode_topic_filename(topic_id: str, version_tag: str = "") -> str:
    filename = urllib.parse.quote(topic_id, safe="")
    if version_tag:
        filename = f"{filename}.{version_tag}"
    return f"{filename}.json"


def build_versioned_filename(stem: str, suffix: str, version_tag: str) -> str:
    return f"{stem}.{version_tag}{suffix}"


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def cleanup_generated_files() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TOPIC_DETAILS_DIR.mkdir(parents=True, exist_ok=True)
    AUDIO_BRIEF_DIR.mkdir(parents=True, exist_ok=True)
    for pattern in (
        "snapshot.index*.json",
        "news.index*.json",
        "news.core*.json",
        "news.watch*.json",
        "news.calendar*.json",
        "news.pending*.json",
    ):
        for file_path in OUTPUT_DIR.glob(pattern):
            file_path.unlink()
    for topic_file in TOPIC_DETAILS_DIR.glob("*.json"):
        topic_file.unlink()
    for audio_file in AUDIO_BRIEF_DIR.glob("daily-latest*.mp3"):
        audio_file.unlink()


def main() -> int:
    stats = fetch_json("/stats")
    daily_audio_latest = fetch_optional_json("/reports/daily/audio/latest", None)
    topic_briefs_payload = fetch_optional_json("/topic-briefs", {"topics": []})
    generated_at = time.strftime("%Y-%m-%d %H:%M:%S")
    version_tag = time.strftime("%Y%m%d-%H%M%S")
    topic_details = {}
    topic_detail_files = {}
    for topic in topic_briefs_payload.get("topics", []):
        topic_id = topic.get("topic_id")
        if not topic_id:
            continue
        brief = fetch_optional_json(f"/topic-briefs/{topic_id}", topic)
        items_payload = fetch_optional_json(f"/topic-briefs/{topic_id}/items", {"items": [], "total": 0})
        detail_payload = build_topic_detail_payload(brief, items_payload)
        topic_details[topic_id] = detail_payload
        topic_detail_files[topic_id] = f"{TOPIC_DETAILS_DIR.name}/{encode_topic_filename(topic_id, version_tag)}"

    news_items = build_news_index(fetch_all_news())
    news_lane_payloads = build_news_lane_payloads(news_items, generated_at)
    versioned_audio_name = build_versioned_filename("daily-latest", ".mp3", version_tag)
    audio_public_path = f"{OUTPUT_DIR.parent.name}/{OUTPUT_DIR.name}/audio-briefs/{versioned_audio_name}"
    audio_output_path = AUDIO_BRIEF_DIR / AUDIO_BRIEF_OUTPUT_NAME
    versioned_audio_output_path = AUDIO_BRIEF_DIR / versioned_audio_name
    cleanup_generated_files()
    if daily_audio_latest and daily_audio_latest.get("audio_available") and daily_audio_latest.get("audio_url"):
        source_audio_url = urllib.parse.urljoin(f"{APP_BASE}/", str(daily_audio_latest.get("audio_url", "")).lstrip("/"))
        download_binary(source_audio_url, versioned_audio_output_path)
        shutil.copyfile(versioned_audio_output_path, audio_output_path)
        daily_audio_latest = {
            **daily_audio_latest,
            "audio_url": audio_public_path,
        }
    news_lane_files = {
        lane: build_versioned_filename(f"news.{lane}", ".json", version_tag)
        for lane in NEWS_LANES
    }
    static_files = {
        "news_index": build_versioned_filename("news.index", ".json", version_tag),
        "news_lane_files": news_lane_files,
        "topic_details_dir": TOPIC_DETAILS_DIR.name,
        "topic_detail_files": topic_detail_files,
    }

    snapshot_index = {
        "format_version": 2,
        "generated_at": generated_at,
        "source_api": API_BASE,
        "static_files": static_files,
        "health": fetch_optional_json("/health", {"status": "degraded"}),
        "stats": stats,
        "intel_overview": fetch_optional_json("/intel-overview", None),
        "daily_report": fetch_optional_json("/reports/daily", None),
        "weekly_report": fetch_optional_json("/reports/weekly", None),
        "daily_audio_latest": daily_audio_latest,
        "sources_payload": fetch_optional_json("/sources", {"sources": [], "total": 0}),
        "topic_briefs_payload": topic_briefs_payload,
        "archive": {"groups": {"daily": [], "weekly": []}, "items": [], "total": 0},
    }
    snapshot = {
        **snapshot_index,
        "topic_details": topic_details,
        "news_items": news_items,
    }
    news_index_payload = {
        "generated_at": generated_at,
        "total": len(news_items),
        "items": news_items,
    }
    manifest = {
        "format_version": 1,
        "generated_at": generated_at,
        "version_tag": version_tag,
        "files": {
            "snapshot_index": build_versioned_filename("snapshot.index", ".json", version_tag),
            "legacy_snapshot_index": INDEX_OUTPUT_PATH.name,
            "legacy_snapshot": LEGACY_OUTPUT_PATH.name,
        },
    }

    versioned_snapshot_index_path = OUTPUT_DIR / manifest["files"]["snapshot_index"]
    versioned_news_index_path = OUTPUT_DIR / static_files["news_index"]
    write_json(INDEX_OUTPUT_PATH, snapshot_index)
    write_json(versioned_snapshot_index_path, snapshot_index)
    write_json(NEWS_INDEX_OUTPUT_PATH, news_index_payload)
    write_json(versioned_news_index_path, news_index_payload)
    for lane, payload in news_lane_payloads.items():
        write_json(OUTPUT_DIR / f"news.{lane}.json", payload)
        write_json(OUTPUT_DIR / news_lane_files[lane], payload)
    for topic_id, payload in topic_details.items():
        write_json(TOPIC_DETAILS_DIR / encode_topic_filename(topic_id), payload)
        write_json(TOPIC_DETAILS_DIR / encode_topic_filename(topic_id, version_tag), payload)
    write_json(LEGACY_OUTPUT_PATH, snapshot)
    write_json(MANIFEST_OUTPUT_PATH, manifest)
    print(f"snapshot index written to {INDEX_OUTPUT_PATH}")
    print(f"snapshot manifest written to {MANIFEST_OUTPUT_PATH}")
    print(f"news index written to {NEWS_INDEX_OUTPUT_PATH}")
    print(f"topic detail files written to {TOPIC_DETAILS_DIR}")
    print(f"legacy snapshot written to {LEGACY_OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
