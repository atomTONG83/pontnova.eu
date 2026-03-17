#!/usr/bin/env python3
"""
同步“Pontnova Europe IP Intelligence”展示版静态快照。

默认从本机运行中的研究服务抓取公开展示所需数据，并写入
pontnova.eu/eu_ip_sentinel_assets/data/snapshot.json
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


API_BASE = "http://127.0.0.1:8013/api"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "eu_ip_sentinel_assets" / "data" / "snapshot.json"


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


def main() -> int:
    stats = fetch_json("/stats")
    topic_briefs_payload = fetch_optional_json("/topic-briefs", {"topics": []})
    topic_details = {}
    for topic in topic_briefs_payload.get("topics", []):
      topic_id = topic.get("topic_id")
      if not topic_id:
          continue
      brief = fetch_optional_json(f"/topic-briefs/{topic_id}", topic)
      items_payload = fetch_optional_json(f"/topic-briefs/{topic_id}/items", {"items": [], "total": 0})
      topic_details[topic_id] = {
          "brief": brief,
          "items": items_payload.get("items", []),
          "total": items_payload.get("total", len(items_payload.get("items", []))),
      }

    snapshot = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "source_api": API_BASE,
        "health": fetch_optional_json("/health", {"status": "degraded"}),
        "stats": stats,
        "intel_overview": fetch_optional_json("/intel-overview", None),
        "daily_report": fetch_optional_json("/reports/daily", None),
        "weekly_report": fetch_optional_json("/reports/weekly", None),
        "sources_payload": fetch_optional_json("/sources", {"sources": [], "total": 0}),
        "topic_briefs_payload": topic_briefs_payload,
        "topic_details": topic_details,
        "archive": {"groups": {"daily": [], "weekly": []}, "items": [], "total": 0},
        "news_items": fetch_all_news(),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"snapshot written to {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
