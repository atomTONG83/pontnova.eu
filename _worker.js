const SESSION_COOKIE = "pn_workbench_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const WORKBENCH_PREFIX = "/workbench";
const DEFAULT_PROGRAMS = [
  {
    type: "consulting",
    label: "咨询",
    prefix: "CONS",
    accent: "#1d6b5e",
    kicker: "CONS · CONSULTING",
    title: "咨询项目",
    description: "市场进入、竞争风险、IP 策略与跨境业务判断。",
    mark: "咨",
  },
  {
    type: "fundraising",
    label: "投融资",
    prefix: "FUND",
    accent: "#547a9b",
    kicker: "FUND · FINANCE",
    title: "投融资项目",
    description: "技术尽调、投资人材料、商业叙事和壁垒表达。",
    mark: "融",
  },
  {
    type: "training",
    label: "培训",
    prefix: "TRN",
    accent: "#8b6f2f",
    kicker: "TRN · TRAINING",
    title: "培训项目",
    description: "管理层课程、案例设计、内部 IP 能力建设。",
    mark: "训",
  },
  {
    type: "workshop",
    label: "Workshop",
    prefix: "WS",
    accent: "#7f466d",
    kicker: "WS · WORKSHOP",
    title: "Workshop 项目",
    description: "公开活动、主题策划、嘉宾协同和报名转化。",
    mark: "坊",
  },
  {
    type: "operations",
    label: "运营",
    prefix: "OPS",
    accent: "#667d51",
    kicker: "OPS · OPERATIONS",
    title: "运营项目",
    description: "内部运营、资料建设、流程优化和长期维护。",
    mark: "营",
  },
];
const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

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

    if (path === "/workbench/api/analyze-document" && request.method === "POST") {
      if (!(await hasValidSession(request, env))) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      return handleDocumentAnalysis(request, env);
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
        programs: nextState.programs.length,
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

async function handleDocumentAnalysis(request, env) {
  const config = resolveQwenConfig(env);
  if (!config.apiKey) {
    return jsonResponse({ ok: false, error: "Qwen API key is not configured" });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const documentInfo = {
    title: sanitizeText(payload?.title, 240) || "未命名资料",
    type: sanitizeText(payload?.type, 80),
    path: sanitizeText(payload?.path, 800),
    note: sanitizeText(payload?.note, 1200),
    projectNo: sanitizeText(payload?.projectNo, 80),
    projectName: sanitizeText(payload?.projectName, 160),
    fileName: sanitizeText(payload?.fileName, 240),
    fileType: sanitizeText(payload?.fileType, 120),
    fileText: sanitizeText(payload?.fileText, 60000),
  };

  const prompt = buildDocumentAnalysisPrompt(documentInfo);
  const endpoint = qwenChatEndpoint(config.baseUrl);
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content: "你是 Pontnova 工作台的资料分析助手，擅长咨询、投融资、培训和 workshop 项目的资料研判。请严格输出 JSON。",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: "Qwen request failed before receiving a response" });
  }

  const responseText = await response.text();
  if (!response.ok) {
    return jsonResponse({
      ok: false,
      error: `Qwen request failed: ${response.status}`,
      providerMessage: summarizeProviderError(responseText),
      endpoint: describeQwenEndpoint(endpoint),
    });
  }

  let decoded;
  try {
    decoded = JSON.parse(responseText);
  } catch (error) {
    return jsonResponse({ ok: false, error: "Qwen response was not valid JSON" });
  }

  const rawContent = extractResponseContent(decoded);
  const analysis = sanitizeDocumentAnalysis(extractJsonPayload(rawContent));
  return jsonResponse({
    ok: true,
    model: config.model,
    analysis,
    analyzedAt: new Date().toISOString(),
  });
}

async function readWorkbenchState(db) {
  const programs = await readPrograms(db);
  const loginEvents = await readLoginEvents(db);
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
    programs,
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
      notes: row.notes || "",
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
      fileName: row.file_name || "",
      fileSize: Number(row.file_size || 0),
      fileType: row.file_type || "",
      fileText: row.file_text || "",
      uploadedAt: row.uploaded_at || "",
      aiStatus: row.ai_status || "",
      aiAnalysis: row.ai_analysis || "",
      aiModel: row.ai_model || "",
      aiAnalyzedAt: row.ai_analyzed_at || "",
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
    loginEvents,
  };
}

async function writeWorkbenchState(db, state) {
  const supportsPrograms = await tableExists(db, "programs");
  const supportsTaskNotes = await tableColumnExists(db, "tasks", "notes");
  const supportsDocumentUploads = await tableColumnExists(db, "documents", "file_name");
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
  if (supportsPrograms) statements.push(db.prepare("DELETE FROM programs"));

  if (supportsPrograms) {
    state.programs.forEach((program, index) => {
      statements.push(
        db
          .prepare(
            `INSERT INTO programs (type, label, prefix, accent, kicker, title, description, mark, sort_order, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
          )
          .bind(
            program.type,
            program.label,
            program.prefix,
            program.accent,
            program.kicker,
            program.title,
            program.description,
            program.mark,
            index
          )
      );
    });
  }

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
    const query = supportsTaskNotes
      ? `INSERT INTO tasks (id, project_id, title, owner, due_date, priority, status, notes, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      : `INSERT INTO tasks (id, project_id, title, owner, due_date, priority, status, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    const values = supportsTaskNotes
      ? [task.id, task.projectId, task.title, task.owner, task.due, task.priority, task.status, task.notes, index]
      : [task.id, task.projectId, task.title, task.owner, task.due, task.priority, task.status, index];
    statements.push(
      db
        .prepare(query)
        .bind(...values)
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
    const query = supportsDocumentUploads
      ? `INSERT INTO documents (id, project_id, title, type, path, note, file_name, file_size, file_type, file_text, uploaded_at, ai_status, ai_analysis, ai_model, ai_analyzed_at, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      : `INSERT INTO documents (id, project_id, title, type, path, note, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    const values = supportsDocumentUploads
      ? [
          document.id,
          document.projectId,
          document.title,
          document.type,
          document.path,
          document.note,
          document.fileName,
          document.fileSize,
          document.fileType,
          document.fileText,
          document.uploadedAt,
          document.aiStatus,
          document.aiAnalysis,
          document.aiModel,
          document.aiAnalyzedAt,
          index,
        ]
      : [document.id, document.projectId, document.title, document.type, document.path, document.note, index];
    statements.push(
      db
        .prepare(query)
        .bind(...values)
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
          programs: state.programs.length,
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

async function readPrograms(db) {
  if (!(await tableExists(db, "programs"))) return cloneDefaults(DEFAULT_PROGRAMS);
  const result = await db.prepare("SELECT * FROM programs ORDER BY sort_order ASC, type ASC").all();
  const rows = result.results || [];
  if (!rows.length) return cloneDefaults(DEFAULT_PROGRAMS);
  const byType = new Map(rows.map((row) => [row.type, row]));
  return DEFAULT_PROGRAMS.map((defaults) => {
    const row = byType.get(defaults.type) || {};
    return {
      type: defaults.type,
      label: sanitizeText(row.label, 80) || defaults.label,
      prefix: sanitizePrefix(row.prefix) || defaults.prefix,
      accent: sanitizeColor(row.accent) || defaults.accent,
      kicker: sanitizeText(row.kicker, 120) || defaults.kicker,
      title: sanitizeText(row.title, 120) || defaults.title,
      description: sanitizeText(row.description, 600) || defaults.description,
      mark: sanitizeText(row.mark, 8) || defaults.mark,
    };
  });
}

async function readLoginEvents(db) {
  if (!(await tableExists(db, "login_events"))) return [];
  const result = await db
    .prepare(
      `SELECT id, occurred_at, success, ip_address, country, colo, user_agent, method, path, reason
       FROM login_events
       ORDER BY occurred_at DESC
       LIMIT 120`
    )
    .all();
  return (result.results || []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at || "",
    success: Boolean(row.success),
    ipAddress: row.ip_address || "",
    country: row.country || "",
    colo: row.colo || "",
    userAgent: row.user_agent || "",
    method: row.method || "",
    path: row.path || "",
    reason: row.reason || "",
  }));
}

async function tableExists(db, tableName) {
  try {
    const row = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .bind(tableName)
      .first();
    return Boolean(row);
  } catch (error) {
    return false;
  }
}

async function tableColumnExists(db, tableName, columnName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${sqlIdentifier(tableName)})`).all();
    return (result.results || []).some((row) => row.name === columnName);
  } catch (error) {
    return false;
  }
}

function sqlIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error("Unsafe SQL identifier");
  return value;
}

function cloneDefaults(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveQwenConfig(env) {
  const apiKey = firstNonEmpty(
    env.PONTNOVA_QWEN_API_KEY,
    env.QWEN_API_KEY,
    env.DASHSCOPE_API_KEY,
    env.BAILIAN_API_KEY
  );
  const baseUrl = firstNonEmpty(
    env.PONTNOVA_QWEN_BASE_URL,
    env.QWEN_BASE_URL,
    env.DASHSCOPE_BASE_URL,
    env.BAILIAN_BASE_URL
  ) || "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const model = firstNonEmpty(
    env.PONTNOVA_QWEN_MODEL,
    env.QWEN_MODEL,
    env.DASHSCOPE_MODEL,
    env.BAILIAN_MODEL
  ) || "qwen3.6-plus";
  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    model,
  };
}

function qwenChatEndpoint(baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return cleanBase.endsWith("/chat/completions") ? cleanBase : `${cleanBase}/chat/completions`;
}

function summarizeProviderError(text) {
  const source = sanitizeText(text, 800);
  try {
    const payload = JSON.parse(source);
    return sanitizeText(payload?.error?.message || payload?.message || payload?.code || source, 400);
  } catch (error) {
    return source.replace(/\s+/g, " ").slice(0, 400);
  }
}

function describeQwenEndpoint(endpoint) {
  const url = new URL(endpoint);
  const path = url.pathname.replace(/\/+/g, "/");
  return `${url.hostname}${path}`;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function buildDocumentAnalysisPrompt(documentInfo) {
  return `请分析以下 Pontnova 项目资料，并只返回 JSON：
{
  "summary": "150字以内资料摘要",
  "key_points": ["3-5条要点"],
  "risks": ["需要注意的风险或信息缺口"],
  "next_actions": ["建议的下一步动作"],
  "project_relevance": "说明该资料和当前项目/任务的关系",
  "confidence": "high|medium|low"
}

项目号：${documentInfo.projectNo || "未提供"}
项目名称：${documentInfo.projectName || "未提供"}
资料名称：${documentInfo.title}
资料类型：${documentInfo.type || "未提供"}
文件名：${documentInfo.fileName || "未上传文件"}
文件类型：${documentInfo.fileType || "未提供"}
路径/链接：${documentInfo.path || "未提供"}
备注：${documentInfo.note || "未提供"}

资料文本：
${documentInfo.fileText || "没有可读取文本；请基于资料名称、备注、路径和项目上下文分析，并提示需要补充正文。"}
`;
}

function extractResponseContent(decoded) {
  const content = decoded?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((item) => typeof item === "string" ? item : item?.text || "").filter(Boolean).join("\n");
  }
  return JSON.stringify(decoded);
}

function extractJsonPayload(text) {
  const source = String(text || "").trim();
  const fenced = source.match(/```json\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidates = [source, fenced, extractBalancedJson(source)].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // Try the next shape.
    }
  }
  return {};
}

function extractBalancedJson(text) {
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== "{") continue;
    let depth = 0;
    for (let index = start; index < text.length; index += 1) {
      if (text[index] === "{") depth += 1;
      if (text[index] === "}") depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return "";
}

function sanitizeDocumentAnalysis(value) {
  const item = value && typeof value === "object" ? value : {};
  return {
    summary: sanitizeText(item.summary, 800) || "AI 未能生成摘要。",
    key_points: sanitizeTextList(item.key_points, 5, 220),
    risks: sanitizeTextList(item.risks, 5, 220),
    next_actions: sanitizeTextList(item.next_actions, 5, 220),
    project_relevance: sanitizeText(item.project_relevance, 600),
    confidence: sanitizeChoice(item.confidence, ["high", "medium", "low"], "medium"),
  };
}

function sanitizeTextList(value, limit, maxLength) {
  const source = Array.isArray(value) ? value : value ? [value] : [];
  return source.map((part) => sanitizeText(part, maxLength)).filter(Boolean).slice(0, limit);
}

function sanitizeWorkbenchState(payload) {
  const programs = sanitizePrograms(payload?.programs);
  const programTypes = programs.map((program) => program.type);
  const projects = sanitizeArray(payload?.projects, 200).map((rawItem, index) => {
    const item = rawItem && typeof rawItem === "object" ? rawItem : {};
    return {
    id: sanitizeId(item.id, `project-${index}`),
    projectNo: sanitizeText(item.projectNo || item.project_no || buildProjectNumber(item.type, index), 80),
    name: sanitizeText(item.name, 160) || "未命名项目",
    type: sanitizeChoice(item.type, programTypes, "consulting"),
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
    programs,
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
      notes: sanitizeText(item.notes, 800),
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
      fileName: sanitizeText(item.fileName, 240),
      fileSize: sanitizeInteger(item.fileSize, 0, 25_000_000, 0),
      fileType: sanitizeText(item.fileType, 120),
      fileText: sanitizeText(item.fileText, 100000),
      uploadedAt: sanitizeText(item.uploadedAt, 40),
      aiStatus: sanitizeChoice(item.aiStatus, ["", "idle", "pending", "done", "failed"], ""),
      aiAnalysis: sanitizeText(item.aiAnalysis, 6000),
      aiModel: sanitizeText(item.aiModel, 80),
      aiAnalyzedAt: sanitizeText(item.aiAnalyzedAt, 40),
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

function sanitizePrograms(value) {
  const source = new Map(
    sanitizeArray(value, 20)
      .map((rawItem) => {
        const item = rawItem && typeof rawItem === "object" ? rawItem : {};
        return [sanitizeText(item.type, 40), item];
      })
      .filter(([type]) => type)
  );

  return DEFAULT_PROGRAMS.map((defaults) => {
    const item = source.get(defaults.type) || {};
    return {
      type: defaults.type,
      label: sanitizeText(item.label, 80) || defaults.label,
      prefix: sanitizePrefix(item.prefix) || defaults.prefix,
      accent: sanitizeColor(item.accent) || defaults.accent,
      kicker: sanitizeText(item.kicker, 120) || defaults.kicker,
      title: sanitizeText(item.title, 120) || defaults.title,
      description: sanitizeText(item.description, 600) || defaults.description,
      mark: sanitizeText(item.mark, 8) || defaults.mark,
    };
  });
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

function sanitizePrefix(value) {
  return sanitizeText(value, 12).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function sanitizeColor(value) {
  const text = sanitizeText(value, 20);
  return /^#[0-9A-Fa-f]{6}$/.test(text) ? text : "";
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
  const ok = await passwordMatches(password, env);

  await recordLoginEvent(request, env, ok, ok ? "password_login" : "invalid_password");

  if (!ok) {
    return loginPage("口令不正确，请再试一次。", 401);
  }

  const token = await signSession(env);
  return redirect(`${url.origin}/workbench/`, {
    "Set-Cookie": sessionCookie(token, request),
  });
}

async function recordLoginEvent(request, env, success, reason) {
  if (!env.WORKBENCH_DB) return;
  try {
    const url = new URL(request.url);
    const cf = request.cf || {};
    await env.WORKBENCH_DB
      .prepare(
        `INSERT INTO login_events (id, occurred_at, success, ip_address, country, colo, user_agent, method, path, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        `login-${Date.now()}-${crypto.randomUUID()}`,
        new Date().toISOString(),
        success ? 1 : 0,
        requestIp(request),
        sanitizeText(cf.country, 24),
        sanitizeText(cf.colo, 24),
        sanitizeText(request.headers.get("User-Agent"), 500),
        sanitizeText(request.method, 16),
        sanitizeText(url.pathname, 120),
        sanitizeText(reason, 80)
      )
      .run();
  } catch (error) {
    // Login auditing should never block authentication.
  }
}

function requestIp(request) {
  const forwarded = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "";
  return sanitizeText(forwarded.split(",")[0], 80);
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
      ...SECURITY_HEADERS,
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
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => next.headers.set(key, value));
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
    body { display: grid; min-height: 100vh; margin: 0; place-items: center; background: #f2eadf; color: #2a211a; }
    main { width: min(420px, calc(100vw - 32px)); border: 1px solid #ead8c2; border-radius: 8px; padding: 28px; background: #fffaf2; box-shadow: 0 18px 46px rgba(73,50,29,.12); }
    .mark { display: grid; width: 44px; height: 44px; place-items: center; margin-bottom: 18px; border-radius: 8px; background: #2b1a12; color: #fdf6ec; font-weight: 800; }
    h1 { margin: 0 0 8px; font-size: 26px; letter-spacing: 0; }
    p { margin: 0 0 22px; color: #7b6d60; line-height: 1.6; }
    label { display: grid; gap: 8px; color: #7b6d60; font-size: 13px; font-weight: 700; }
    input { width: 100%; height: 44px; border: 1px solid #ead8c2; border-radius: 8px; padding: 0 12px; font: inherit; outline: none; }
    input:focus { border-color: #bd6045; box-shadow: 0 0 0 3px rgba(189,96,69,.18); }
    button { width: 100%; height: 44px; margin-top: 16px; border: 0; border-radius: 8px; background: #bd6045; color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
    .error { margin-bottom: 12px; border: 1px solid rgba(189,96,69,.30); border-radius: 8px; padding: 10px 12px; background: rgba(189,96,69,.08); color: #9a3f2c; }
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
        ...SECURITY_HEADERS,
      },
    }
  );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
