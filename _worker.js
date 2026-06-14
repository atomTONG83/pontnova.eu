const SESSION_COOKIE = "pn_workbench_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const WORKBENCH_PREFIX = "/workbench";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/workbench") {
      return redirect(`${url.origin}/workbench/`);
    }

    if (path === "/workbench/login" && (request.method === "GET" || request.method === "HEAD")) {
      if (await hasValidSession(request, env)) {
        return redirect(`${url.origin}/workbench/`);
      }
      return loginPage("", 200, request.method === "HEAD");
    }

    if (path === "/workbench/api/login" && request.method === "POST") {
      return handleLogin(request, env);
    }

    if (path === "/workbench/api/logout" && request.method === "POST") {
      return redirect(`${url.origin}/workbench/login`, {
        "Set-Cookie": clearSessionCookie(request),
      });
    }

    if (path === "/workbench/api/state") {
      if (!(await hasValidSession(request, env))) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      return handleWorkbenchState(request, env);
    }

    if (path === "/workbench/" || path === "/workbench/index.html") {
      if (!(await hasValidSession(request, env))) {
        return redirect(`${url.origin}/workbench/login`);
      }
      const response = await env.ASSETS.fetch(request);
      return withPrivateHeaders(response);
    }

    if (path.startsWith(`${WORKBENCH_PREFIX}/api/`)) {
      return new Response("Not found", { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleWorkbenchState(request, env) {
  if (!env.WORKBENCH_DB) {
    return jsonResponse({ error: "Cloud database is not configured" }, 503);
  }

  if (request.method === "GET") {
    return jsonResponse(await readWorkbenchState(env.WORKBENCH_DB));
  }

  if (request.method === "PUT") {
    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    const nextState = sanitizeWorkbenchState(payload);
    await writeWorkbenchState(env.WORKBENCH_DB, nextState);
    return jsonResponse({
      ok: true,
      counts: {
        projects: nextState.projects.length,
        tasks: nextState.tasks.length,
        deadlines: nextState.deadlines.length,
        documents: nextState.documents.length,
        objectives: nextState.objectives.length,
        keyResults: nextState.keyResults.length,
        timeEntries: nextState.timeEntries.length,
        activities: nextState.activities.length,
      },
    });
  }

  return jsonResponse({ error: "Method not allowed" }, 405, { Allow: "GET, PUT" });
}

async function readWorkbenchState(db) {
  const [projects, tasks, deadlines, documents, objectives, keyResults, timeEntries, activities] = await db.batch([
    db.prepare("SELECT * FROM projects ORDER BY sort_order ASC, updated_at DESC"),
    db.prepare("SELECT * FROM tasks ORDER BY sort_order ASC, due_date ASC, updated_at DESC"),
    db.prepare("SELECT * FROM deadlines ORDER BY due_date ASC, sort_order ASC"),
    db.prepare("SELECT * FROM documents ORDER BY sort_order ASC, updated_at DESC"),
    db.prepare("SELECT * FROM objectives ORDER BY sort_order ASC, updated_at DESC"),
    db.prepare("SELECT * FROM key_results ORDER BY sort_order ASC, updated_at DESC"),
    db.prepare("SELECT * FROM time_entries ORDER BY entry_date DESC, sort_order ASC"),
    db.prepare("SELECT * FROM activities ORDER BY activity_date DESC, sort_order ASC"),
  ]);

  return {
    projects: (projects.results || []).map((row) => ({
      id: row.id,
      projectNo: row.project_no || "",
      name: row.name,
      type: row.type,
      client: row.client,
      owner: row.owner,
      stage: row.stage,
      priority: row.priority,
      progress: row.progress,
      next: row.next_action,
      summary: row.summary,
      openedAt: row.opened_at || "",
      dueDate: row.due_date || "",
      budget: row.budget || "",
      contact: row.contact || "",
      goal: row.goal || "",
      health: row.health || "on_track",
    })),
    tasks: (tasks.results || []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      owner: row.owner,
      due: row.due_date,
      priority: row.priority,
      status: row.status,
    })),
    deadlines: (deadlines.results || []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      date: row.due_date,
      kind: row.kind,
      risk: row.risk,
    })),
    documents: (documents.results || []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      type: row.type,
      path: row.path,
      note: row.note,
    })),
    objectives: (objectives.results || []).map((row) => ({
      id: row.id,
      projectId: row.project_id || "",
      title: row.title,
      owner: row.owner,
      quarter: row.quarter,
      progress: row.progress,
      status: row.status,
      signal: row.signal,
    })),
    keyResults: (keyResults.results || []).map((row) => ({
      id: row.id,
      objectiveId: row.objective_id,
      projectId: row.project_id || "",
      label: row.label,
      target: row.target,
      current: row.current,
      unit: row.unit,
      progress: row.progress,
      status: row.status,
    })),
    timeEntries: (timeEntries.results || []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      taskId: row.task_id || "",
      description: row.description,
      date: row.entry_date,
      hours: Number(row.hours || 0),
      billable: Boolean(row.billable),
      tags: row.tags,
    })),
    activities: (activities.results || []).map((row) => ({
      id: row.id,
      projectId: row.project_id || "",
      entity: row.entity,
      entityId: row.entity_id,
      action: row.action,
      title: row.title,
      actor: row.actor,
      date: row.activity_date,
      note: row.note,
    })),
  };
}

async function writeWorkbenchState(db, state) {
  const statements = [
    db.prepare("DELETE FROM activities"),
    db.prepare("DELETE FROM time_entries"),
    db.prepare("DELETE FROM key_results"),
    db.prepare("DELETE FROM objectives"),
    db.prepare("DELETE FROM documents"),
    db.prepare("DELETE FROM deadlines"),
    db.prepare("DELETE FROM tasks"),
    db.prepare("DELETE FROM projects"),
  ];

  state.projects.forEach((project, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO projects (id, project_no, name, type, client, owner, stage, priority, progress, next_action, summary, opened_at, due_date, budget, contact, goal, health, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          project.id,
          project.projectNo,
          project.name,
          project.type,
          project.client,
          project.owner,
          project.stage,
          project.priority,
          project.progress,
          project.next,
          project.summary,
          project.openedAt,
          project.dueDate,
          project.budget,
          project.contact,
          project.goal,
          project.health,
          index
        )
    );
  });

  state.tasks.forEach((task, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO tasks (id, project_id, title, owner, due_date, priority, status, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(task.id, task.projectId, task.title, task.owner, task.due, task.priority, task.status, index)
    );
  });

  state.deadlines.forEach((deadline, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO deadlines (id, project_id, title, due_date, kind, risk, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(deadline.id, deadline.projectId, deadline.title, deadline.date, deadline.kind, deadline.risk, index)
    );
  });

  state.documents.forEach((document, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO documents (id, project_id, title, type, path, note, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(document.id, document.projectId, document.title, document.type, document.path, document.note, index)
    );
  });

  state.objectives.forEach((objective, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO objectives (id, project_id, title, owner, quarter, progress, status, signal, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          objective.id,
          objective.projectId || null,
          objective.title,
          objective.owner,
          objective.quarter,
          objective.progress,
          objective.status,
          objective.signal,
          index
        )
    );
  });

  state.keyResults.forEach((keyResult, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO key_results (id, objective_id, project_id, label, target, current, unit, progress, status, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          keyResult.id,
          keyResult.objectiveId,
          keyResult.projectId || null,
          keyResult.label,
          keyResult.target,
          keyResult.current,
          keyResult.unit,
          keyResult.progress,
          keyResult.status,
          index
        )
    );
  });

  state.timeEntries.forEach((entry, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO time_entries (id, project_id, task_id, description, entry_date, hours, billable, tags, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          entry.id,
          entry.projectId,
          entry.taskId || null,
          entry.description,
          entry.date,
          entry.hours,
          entry.billable ? 1 : 0,
          entry.tags,
          index
        )
    );
  });

  state.activities.forEach((activity, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO activities (id, project_id, entity, entity_id, action, title, actor, activity_date, note, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          activity.id,
          activity.projectId || null,
          activity.entity,
          activity.entityId,
          activity.action,
          activity.title,
          activity.actor,
          activity.date,
          activity.note,
          index
        )
    );
  });

  statements.push(
    db
      .prepare("INSERT INTO audit_log (event_type, detail_json) VALUES (?, ?)")
      .bind(
        "state_replace",
        JSON.stringify({
          projects: state.projects.length,
          tasks: state.tasks.length,
          deadlines: state.deadlines.length,
          documents: state.documents.length,
          objectives: state.objectives.length,
          keyResults: state.keyResults.length,
          timeEntries: state.timeEntries.length,
          activities: state.activities.length,
        })
      )
  );

  await db.batch(statements);
}

function sanitizeWorkbenchState(payload) {
  const projects = sanitizeArray(payload?.projects, 200).map((rawItem, index) => {
    const item = rawItem && typeof rawItem === "object" ? rawItem : {};
    return {
    id: sanitizeId(item.id, `project-${index}`),
    projectNo: sanitizeText(item.projectNo || item.project_no || buildProjectNumber(item.type, index), 80),
    name: sanitizeText(item.name, 160) || "未命名项目",
    type: sanitizeChoice(item.type, ["consulting", "fundraising", "training", "workshop", "operations"], "consulting"),
    client: sanitizeText(item.client, 160),
    owner: sanitizeText(item.owner, 120),
    stage: sanitizeChoice(item.stage, ["planning", "active", "waiting", "complete"], "planning"),
    priority: sanitizeChoice(item.priority, ["high", "medium", "low"], "medium"),
    progress: sanitizeInteger(item.progress, 0, 100, 0),
    next: sanitizeText(item.next, 300),
    summary: sanitizeText(item.summary, 800),
    openedAt: sanitizeDate(item.openedAt),
    dueDate: sanitizeDate(item.dueDate),
    budget: sanitizeText(item.budget, 160),
    contact: sanitizeText(item.contact, 160),
    goal: sanitizeText(item.goal, 800),
    health: sanitizeChoice(item.health, ["on_track", "needs_review", "at_risk", "blocked"], "on_track"),
    };
  });
  const projectIds = new Set(projects.map((project) => project.id));
  const fallbackProjectId = projects[0]?.id || "inbox";
  if (!projectIds.size) {
    projects.push({
      id: fallbackProjectId,
      name: "Inbox",
      projectNo: "PN-OPS-2026-000",
      type: "operations",
      client: "",
      owner: "Pontnova",
      stage: "active",
      priority: "medium",
      progress: 0,
      next: "",
      summary: "临时收件箱项目。",
      openedAt: "",
      dueDate: "",
      budget: "",
      contact: "",
      goal: "",
      health: "on_track",
    });
    projectIds.add(fallbackProjectId);
  }
  const objectiveSource = sanitizeArray(payload?.objectives, 300).map((rawItem, index) => {
    const item = rawItem && typeof rawItem === "object" ? rawItem : {};
    return {
      id: sanitizeId(item.id, `objective-${index}`),
      projectId: projectIds.has(item.projectId) ? item.projectId : "",
      title: sanitizeText(item.title, 240) || "未命名目标",
      owner: sanitizeText(item.owner, 120),
      quarter: sanitizeText(item.quarter, 40),
      progress: sanitizeInteger(item.progress, 0, 100, 0),
      status: sanitizeChoice(item.status, ["on_track", "needs_review", "at_risk", "archived"], "on_track"),
      signal: sanitizeText(item.signal, 600),
    };
  });
  const objectiveIds = new Set(objectiveSource.map((objective) => objective.id));

  return {
    projects,
    tasks: sanitizeArray(payload?.tasks, 1000).map((rawItem, index) => {
      const item = rawItem && typeof rawItem === "object" ? rawItem : {};
      return {
      id: sanitizeId(item.id, `task-${index}`),
      projectId: projectIds.has(item.projectId) ? item.projectId : fallbackProjectId,
      title: sanitizeText(item.title, 240) || "未命名任务",
      owner: sanitizeText(item.owner, 120),
      due: sanitizeDate(item.due),
      priority: sanitizeChoice(item.priority, ["high", "medium", "low"], "medium"),
      status: sanitizeChoice(item.status, ["next", "in_progress", "waiting", "done"], "next"),
      };
    }),
    deadlines: sanitizeArray(payload?.deadlines, 1000).map((rawItem, index) => {
      const item = rawItem && typeof rawItem === "object" ? rawItem : {};
      return {
      id: sanitizeId(item.id, `deadline-${index}`),
      projectId: projectIds.has(item.projectId) ? item.projectId : fallbackProjectId,
      title: sanitizeText(item.title, 240) || "未命名节点",
      date: sanitizeDate(item.date),
      kind: sanitizeText(item.kind, 80),
      risk: sanitizeChoice(item.risk, ["high", "medium", "low"], "medium"),
      };
    }),
    documents: sanitizeArray(payload?.documents, 1000).map((rawItem, index) => {
      const item = rawItem && typeof rawItem === "object" ? rawItem : {};
      return {
      id: sanitizeId(item.id, `document-${index}`),
      projectId: projectIds.has(item.projectId) ? item.projectId : fallbackProjectId,
      title: sanitizeText(item.title, 240) || "未命名资料",
      type: sanitizeText(item.type, 80),
      path: sanitizeText(item.path, 800),
      note: sanitizeText(item.note, 800),
      };
    }),
    objectives: objectiveSource,
    keyResults: sanitizeArray(payload?.keyResults, 1000).map((rawItem, index) => {
      const item = rawItem && typeof rawItem === "object" ? rawItem : {};
      const fallbackObjectiveId = objectiveSource[0]?.id || "objective-inbox";
      return {
        id: sanitizeId(item.id, `key-result-${index}`),
        objectiveId: objectiveIds.has(item.objectiveId) ? item.objectiveId : fallbackObjectiveId,
        projectId: projectIds.has(item.projectId) ? item.projectId : "",
        label: sanitizeText(item.label, 240) || "未命名关键结果",
        target: sanitizeText(item.target, 80),
        current: sanitizeText(item.current, 80),
        unit: sanitizeText(item.unit, 40),
        progress: sanitizeInteger(item.progress, 0, 100, 0),
        status: sanitizeChoice(item.status, ["on_track", "needs_review", "at_risk"], "on_track"),
      };
    }).filter((item) => objectiveIds.has(item.objectiveId)),
    timeEntries: sanitizeArray(payload?.timeEntries, 2000).map((rawItem, index) => {
      const item = rawItem && typeof rawItem === "object" ? rawItem : {};
      return {
        id: sanitizeId(item.id, `time-${index}`),
        projectId: projectIds.has(item.projectId) ? item.projectId : fallbackProjectId,
        taskId: sanitizeText(item.taskId, 80),
        description: sanitizeText(item.description, 300),
        date: sanitizeDate(item.date),
        hours: sanitizeNumber(item.hours, 0, 999, 0),
        billable: Boolean(item.billable ?? true),
        tags: sanitizeText(item.tags, 200),
      };
    }),
    activities: sanitizeArray(payload?.activities, 2000).map((rawItem, index) => {
      const item = rawItem && typeof rawItem === "object" ? rawItem : {};
      return {
        id: sanitizeId(item.id, `activity-${index}`),
        projectId: projectIds.has(item.projectId) ? item.projectId : "",
        entity: sanitizeChoice(item.entity, ["Project", "Task", "Deadline", "Document", "Objective", "TimeEntry"], "Project"),
        entityId: sanitizeText(item.entityId, 80),
        action: sanitizeChoice(item.action, ["create", "update", "complete", "review", "note", "delete"], "update"),
        title: sanitizeText(item.title, 240) || "工作台更新",
        actor: sanitizeText(item.actor, 120) || "Pontnova",
        date: sanitizeDate(item.date),
        note: sanitizeText(item.note, 800),
      };
    }),
  };
}

function sanitizeArray(value, limit) {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

function sanitizeId(value, fallback) {
  const text = sanitizeText(value, 80);
  return /^[A-Za-z0-9_.:-]+$/.test(text) ? text : fallback;
}

function sanitizeText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function sanitizeChoice(value, choices, fallback) {
  return choices.includes(value) ? value : fallback;
}

function sanitizeInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function sanitizeNumber(value, min, max, fallback) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function sanitizeDate(value) {
  const text = sanitizeText(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function buildProjectNumber(type, index) {
  const prefix = {
    consulting: "CONS",
    fundraising: "FUND",
    training: "TRN",
    workshop: "WS",
    operations: "OPS",
  }[type] || "OPS";
  return `PN-${prefix}-2026-${String(index + 1).padStart(3, "0")}`;
}

async function handleLogin(request, env) {
  const url = new URL(request.url);
  const form = await request.formData();
  const password = String(form.get("password") || "");

  if (!(await passwordMatches(password, env))) {
    return loginPage("口令不正确，请再试一次。", 401);
  }

  const token = await signSession(env);
  return redirect(`${url.origin}/workbench/`, {
    "Set-Cookie": sessionCookie(token, request),
  });
}

function redirect(location, headers = {}) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      ...headers,
    },
  });
}

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

async function passwordMatches(input, env) {
  const expectedHash = env.PONTNOVA_WORKBENCH_PASSWORD_SHA256;
  const expectedPassword = env.PONTNOVA_WORKBENCH_PASSWORD;

  if (expectedHash) {
    const inputHash = await sha256Hex(input);
    return timingSafeEqual(inputHash, expectedHash.toLowerCase());
  }

  if (expectedPassword) {
    return timingSafeEqual(input, expectedPassword);
  }

  return false;
}

async function signSession(env) {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomUUID();
  const payload = `${expiry}.${nonce}`;
  const signature = await hmac(payload, sessionSecret(env));
  return `${payload}.${signature}`;
}

async function hasValidSession(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const token = cookies[SESSION_COOKIE];
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expiry, nonce, signature] = parts;
  if (!expiry || !nonce || Number(expiry) < Math.floor(Date.now() / 1000)) return false;

  const expected = await hmac(`${expiry}.${nonce}`, sessionSecret(env));
  return timingSafeEqual(signature, expected);
}

function sessionSecret(env) {
  return env.PONTNOVA_WORKBENCH_SESSION_SECRET || env.PONTNOVA_WORKBENCH_PASSWORD || "pontnova-local-dev-only";
}

async function hmac(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64Url(signature);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64Url(buffer) {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parseCookies(header) {
  return Object.fromEntries(
    header
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        return [cookie.slice(0, index), decodeURIComponent(cookie.slice(index + 1))];
      })
  );
}

function sessionCookie(token, request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/workbench; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/workbench; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }
  return diff === 0;
}

function withPrivateHeaders(response) {
  const next = new Response(response.body, response);
  next.headers.set("Cache-Control", "no-store");
  next.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
  next.headers.set("X-Frame-Options", "DENY");
  next.headers.set("X-Content-Type-Options", "nosniff");
  return next;
}

function loginPage(message = "", status = 200, headOnly = false) {
  return new Response(
    headOnly ? null : `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
  <title>Pontnova 工作台登录</title>
  <style>
    :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; color-scheme: light; }
    * { box-sizing: border-box; }
    body { display: grid; min-height: 100vh; margin: 0; place-items: center; background: #edf2f4; color: #172026; }
    main { width: min(420px, calc(100vw - 32px)); border: 1px solid #ccd9df; border-radius: 8px; padding: 28px; background: #ffffff; box-shadow: 0 18px 50px rgba(24,38,45,.12); }
    .mark { display: grid; width: 44px; height: 44px; place-items: center; margin-bottom: 18px; border-radius: 8px; background: #102226; color: #f7fbfc; font-weight: 800; }
    h1 { margin: 0 0 8px; font-size: 26px; letter-spacing: 0; }
    p { margin: 0 0 22px; color: #63737c; line-height: 1.6; }
    label { display: grid; gap: 8px; color: #63737c; font-size: 13px; font-weight: 700; }
    input { width: 100%; height: 44px; border: 1px solid #ccd9df; border-radius: 8px; padding: 0 12px; font: inherit; outline: none; }
    input:focus { border-color: #007f83; box-shadow: 0 0 0 3px rgba(0,127,131,.14); }
    button { width: 100%; height: 44px; margin-top: 16px; border: 0; border-radius: 8px; background: #007f83; color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
    .error { margin-bottom: 12px; border: 1px solid rgba(169,67,89,.28); border-radius: 8px; padding: 10px 12px; background: rgba(169,67,89,.08); color: #a94359; }
  </style>
</head>
<body>
  <main>
    <div class="mark">PN</div>
    <h1>Pontnova 工作台</h1>
    <p>请输入内部口令进入项目台。</p>
    ${message ? `<div class="error">${escapeHtml(message)}</div>` : ""}
    <form action="/workbench/api/login" method="post">
      <label>口令
        <input name="password" type="password" autocomplete="current-password" required autofocus>
      </label>
      <button type="submit">登录</button>
    </form>
  </main>
</body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
