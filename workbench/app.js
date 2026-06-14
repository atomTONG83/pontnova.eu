(function () {
  const storageKey = "pontnova-workbench-v1";
  const dayMs = 24 * 60 * 60 * 1000;
  const today = startOfDay(new Date());
  const isoDate = (offset) => toIsoDate(new Date(today.getTime() + offset * dayMs));

  const seed = {
    projects: [
      {
        id: "pn-consult-001",
        name: "中欧 IP 市场进入策略",
        type: "consulting",
        client: "医疗科技客户",
        owner: "Edmond",
        stage: "active",
        priority: "high",
        progress: 68,
        next: "完成竞争格局和自由实施风险图谱",
        summary: "面向欧洲上市路径的知识产权、监管和商业风险咨询。"
      },
      {
        id: "pn-fund-002",
        name: "投融资技术尽调支持",
        type: "fundraising",
        client: "硬科技团队",
        owner: "Pontnova",
        stage: "active",
        priority: "high",
        progress: 52,
        next: "整理投资人问答和技术壁垒材料",
        summary: "把专利资产、技术路线、市场叙事整理成投资人可读材料。"
      },
      {
        id: "pn-train-003",
        name: "企业 IP 管理培训",
        type: "training",
        client: "制造业客户",
        owner: "Edmond",
        stage: "planning",
        priority: "medium",
        progress: 35,
        next: "确认培训大纲和案例清单",
        summary: "两小时管理层课程，聚焦研发记录、商业秘密和海外布局。"
      },
      {
        id: "pn-ws-004",
        name: "UPC / SEP Workshop",
        type: "workshop",
        client: "开放报名",
        owner: "Pontnova",
        stage: "planning",
        priority: "medium",
        progress: 28,
        next: "确认嘉宾、页面和报名表",
        summary: "面向中国出海企业的欧洲争议解决和许可策略工作坊。"
      }
    ],
    tasks: [
      { id: "task-1", projectId: "pn-consult-001", title: "补齐三家竞品欧洲专利族摘要", owner: "Edmond", due: isoDate(2), priority: "high", status: "next" },
      { id: "task-2", projectId: "pn-fund-002", title: "生成技术尽调问题清单", owner: "Pontnova", due: isoDate(4), priority: "high", status: "in_progress" },
      { id: "task-3", projectId: "pn-train-003", title: "设计培训案例和互动题", owner: "Edmond", due: isoDate(7), priority: "medium", status: "next" },
      { id: "task-4", projectId: "pn-ws-004", title: "Workshop 页面文案第一版", owner: "Pontnova", due: isoDate(10), priority: "medium", status: "waiting" }
    ],
    deadlines: [
      { id: "due-1", projectId: "pn-consult-001", title: "客户策略简报", date: isoDate(3), kind: "交付", risk: "high" },
      { id: "due-2", projectId: "pn-fund-002", title: "投资人材料预演", date: isoDate(6), kind: "会议", risk: "medium" },
      { id: "due-3", projectId: "pn-ws-004", title: "报名页上线", date: isoDate(12), kind: "发布", risk: "medium" }
    ],
    documents: [
      { id: "doc-1", projectId: "pn-consult-001", title: "客户访谈纪要", type: "meeting-note", path: "Dropbox / Pontnova / Consulting / interviews", note: "访谈问题、结论和后续信息缺口。" },
      { id: "doc-2", projectId: "pn-fund-002", title: "融资 deck 草稿", type: "deck", path: "Dropbox / Pontnova / Fundraising / deck", note: "投资人版本，待补商业化证据。" },
      { id: "doc-3", projectId: "pn-ws-004", title: "Workshop 选题池", type: "outline", path: "Dropbox / Pontnova / Workshop / topics", note: "UPC、SEP、EUIPO、反假冒四条线。" }
    ]
  };

  const state = structuredClone(seed);
  let currentView = "dashboard";
  let currentFilter = "all";
  let query = "";
  let calendarMode = "month";
  let calendarAnchor = startOfDay(new Date());
  let activeDrawer = null;
  let cloudSaveTimer = null;
  let cloudSaveInFlight = false;
  let cloudSaveQueued = false;

  const views = {
    dashboard: document.getElementById("dashboardView"),
    projects: document.getElementById("projectsView"),
    tasks: document.getElementById("tasksView"),
    calendar: document.getElementById("calendarView"),
    documents: document.getElementById("documentsView"),
    map: document.getElementById("mapView")
  };
  const titles = {
    dashboard: "项目总览",
    projects: "项目组合",
    tasks: "任务清单",
    calendar: "日历",
    documents: "资料索引",
    map: "项目图谱"
  };

  function loadLocalState() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "");
      if (stored && Array.isArray(stored.projects)) return stored;
    } catch (error) {
      // Ignore malformed local data and fall back to seed records.
    }
    return structuredClone(seed);
  }

  function normalizeState(nextState) {
    const projects = Array.isArray(nextState.projects) ? nextState.projects : [];
    const fallbackProjectId = projects[0]?.id || "inbox";
    const knownProjectIds = new Set(projects.map((project) => project.id));
    return {
      projects,
      tasks: Array.isArray(nextState.tasks)
        ? nextState.tasks.map((task) => ({ ...task, projectId: knownProjectIds.has(task.projectId) ? task.projectId : fallbackProjectId }))
        : [],
      deadlines: Array.isArray(nextState.deadlines)
        ? nextState.deadlines.map((deadline) => ({ ...deadline, projectId: knownProjectIds.has(deadline.projectId) ? deadline.projectId : fallbackProjectId }))
        : [],
      documents: Array.isArray(nextState.documents)
        ? nextState.documents.map((document) => ({ ...document, projectId: knownProjectIds.has(document.projectId) ? document.projectId : fallbackProjectId }))
        : []
    };
  }

  function replaceState(nextState) {
    const normalized = normalizeState(nextState);
    state.projects = normalized.projects;
    state.tasks = normalized.tasks;
    state.deadlines = normalized.deadlines;
    state.documents = normalized.documents;
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
    queueCloudSave();
  }

  async function loadCloudState() {
    setSyncStatus("正在连接云端...", "pending");
    try {
      const response = await fetch("/workbench/api/state", {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
      if (!response.ok) throw new Error(`Cloud state load failed: ${response.status}`);
      const cloudState = await response.json();
      if (Array.isArray(cloudState.projects) && cloudState.projects.length) {
        replaceState(cloudState);
        localStorage.setItem(storageKey, JSON.stringify(state));
        renderAll();
        setSyncStatus("已连接云端数据库", "ok");
      } else {
        setSyncStatus("云端为空，正在初始化...", "pending");
        await saveCloudState();
      }
    } catch (error) {
      setSyncStatus("云端暂不可用，正在使用本地缓存", "warn");
    }
  }

  function queueCloudSave() {
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => {
      saveCloudState();
    }, 350);
  }

  async function saveCloudState() {
    if (cloudSaveInFlight) {
      cloudSaveQueued = true;
      return;
    }
    cloudSaveInFlight = true;
    setSyncStatus("正在保存到云端...", "pending");
    try {
      const response = await fetch("/workbench/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(state)
      });
      if (!response.ok) throw new Error(`Cloud state save failed: ${response.status}`);
      setSyncStatus("已保存到云端", "ok");
    } catch (error) {
      setSyncStatus("云端保存失败，本地已保留", "warn");
    } finally {
      cloudSaveInFlight = false;
      if (cloudSaveQueued) {
        cloudSaveQueued = false;
        queueCloudSave();
      }
    }
  }

  function setSyncStatus(message, tone = "pending") {
    const status = document.getElementById("syncStatus");
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function projectById(id) {
    return state.projects.find((project) => project.id === id) || { id: "", name: "未绑定项目", type: "operations", priority: "medium", stage: "planning", progress: 0 };
  }

  function related(projectId) {
    return {
      tasks: state.tasks.filter((task) => task.projectId === projectId),
      deadlines: state.deadlines.filter((deadline) => deadline.projectId === projectId),
      documents: state.documents.filter((document) => document.projectId === projectId)
    };
  }

  function typeLabel(type) {
    return {
      consulting: "咨询",
      fundraising: "投融资",
      training: "培训",
      workshop: "Workshop",
      operations: "运营"
    }[type] || type || "项目";
  }

  function stageLabel(stage) {
    return {
      planning: "规划",
      active: "推进中",
      waiting: "等待",
      complete: "完成"
    }[stage] || stage || "规划";
  }

  function priorityLabel(priority) {
    return { high: "高", medium: "中", low: "低" }[priority] || priority || "中";
  }

  function statusLabel(status) {
    return {
      next: "下一步",
      in_progress: "进行中",
      waiting: "等待",
      done: "完成"
    }[status] || status || "下一步";
  }

  function matches(text) {
    return String(text || "").toLowerCase().includes(query.toLowerCase());
  }

  function filteredProjects() {
    return state.projects
      .filter((project) => currentFilter === "all" || project.type === currentFilter)
      .filter((project) => {
        const haystack = [project.name, project.client, project.owner, project.summary, project.next, typeLabel(project.type)].join(" ");
        return !query || matches(haystack);
      });
  }

  function filteredTasks() {
    return state.tasks.filter((task) => {
      const project = projectById(task.projectId);
      const haystack = [task.title, task.owner, statusLabel(task.status), priorityLabel(task.priority), project.name].join(" ");
      return !query || matches(haystack);
    });
  }

  function filteredDeadlines() {
    return state.deadlines
      .filter((deadline) => {
        const project = projectById(deadline.projectId);
        return !query || matches([deadline.title, deadline.kind, project.name].join(" "));
      })
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  }

  function filteredDocuments() {
    return state.documents.filter((document) => {
      const project = projectById(document.projectId);
      return !query || matches([document.title, document.path, document.note, project.name].join(" "));
    });
  }

  function emptyNode(label = "还没有内容", hint = "从右上角新增一条记录即可开始。") {
    const fragment = document.getElementById("emptyTemplate").content.cloneNode(true);
    fragment.querySelector("strong").textContent = label;
    fragment.querySelector("span").textContent = hint;
    return fragment;
  }

  function renderMetrics() {
    const activeProjects = state.projects.filter((project) => project.stage !== "complete").length;
    const nextTasks = state.tasks.filter((task) => task.status !== "done").length;
    const nearDeadlines = state.deadlines.filter((deadline) => daysUntil(deadline.date) <= 14 && daysUntil(deadline.date) >= 0).length;
    const highPriority = state.tasks.filter((task) => task.priority === "high" && task.status !== "done").length;
    const completion = state.tasks.length ? Math.round((state.tasks.filter((task) => task.status === "done").length / state.tasks.length) * 100) : 0;
    document.getElementById("metricGrid").innerHTML = [
      ["活跃项目", activeProjects, "正在推进的咨询/培训/Workshop"],
      ["未完成任务", nextTasks, "仍需要处理的下一步"],
      ["14 天内节点", nearDeadlines, "交付、会议、发布"],
      ["任务完成率", `${completion}%`, "按当前任务状态计算"]
    ].map(([label, value, hint]) => `<article class="metric"><span>${label}</span><strong>${value}</strong><small>${hint}</small></article>`).join("");
  }

  function projectCard(project) {
    const rel = related(project.id);
    const openTasks = rel.tasks.filter((task) => task.status !== "done").length;
    const nextDeadline = rel.deadlines.slice().sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))[0];
    return `
      <button class="project-card clickable-card" data-open-project="${escapeAttr(project.id)}" type="button">
        <header>
          <div>
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.summary || "")}</p>
          </div>
          <span class="badge ${escapeAttr(project.priority)}">${priorityLabel(project.priority)}</span>
        </header>
        <div class="progress" aria-label="项目进度 ${Number(project.progress) || 0}%"><span style="width:${Number(project.progress) || 0}%"></span></div>
        <div class="meta-row">
          <span class="badge">${typeLabel(project.type)}</span>
          <span class="badge">${stageLabel(project.stage)}</span>
          <span class="badge">${escapeHtml(project.client || "内部")}</span>
        </div>
        <div class="project-card-footer">
          <span>${openTasks} 个未完成任务</span>
          <span>${nextDeadline ? `${dueLabel(nextDeadline.date)} · ${escapeHtml(nextDeadline.title)}` : "暂无关键节点"}</span>
        </div>
        <p><strong>下一步：</strong>${escapeHtml(project.next || "待确认")}</p>
      </button>
    `;
  }

  function renderProjects() {
    const list = filteredProjects();
    const grid = document.getElementById("projectGrid");
    const dash = document.getElementById("dashboardProjects");
    grid.innerHTML = "";
    dash.innerHTML = "";
    if (!list.length) {
      grid.appendChild(emptyNode());
      dash.appendChild(emptyNode());
      return;
    }
    grid.innerHTML = list.map(projectCard).join("");
    dash.innerHTML = list.slice(0, 4).map(projectCard).join("");
  }

  function taskCard(task) {
    const project = projectById(task.projectId);
    return `
      <article class="task-card ${task.status === "done" ? "done" : ""}">
        <div class="task-row">
          <input type="checkbox" data-toggle-task="${escapeAttr(task.id)}" ${task.status === "done" ? "checked" : ""} aria-label="标记任务完成">
          <button class="task-card-main" data-open-task="${escapeAttr(task.id)}" type="button">
            <h3>${escapeHtml(task.title)}</h3>
            <div class="meta-row">
              <span class="badge">${escapeHtml(project.name)}</span>
              <span class="badge">${statusLabel(task.status)}</span>
              <span class="badge ${escapeAttr(task.priority)}">${priorityLabel(task.priority)}</span>
              <span class="badge">${dueLabel(task.due)}</span>
            </div>
          </button>
        </div>
      </article>
    `;
  }

  function renderTasks() {
    const tasks = filteredTasks().sort(sortTasks);
    const board = document.getElementById("dashboardTasks");
    const table = document.getElementById("taskTable");
    board.innerHTML = "";
    table.innerHTML = "";
    if (!tasks.length) {
      board.appendChild(emptyNode());
      table.innerHTML = `<tr><td colspan="6">暂无任务</td></tr>`;
      return;
    }
    board.innerHTML = tasks.slice(0, 6).map(taskCard).join("");
    table.innerHTML = tasks.map((task) => {
      const project = projectById(task.projectId);
      return `
        <tr>
          <td><input type="checkbox" data-toggle-task="${escapeAttr(task.id)}" ${task.status === "done" ? "checked" : ""}></td>
          <td><button class="table-link" data-open-task="${escapeAttr(task.id)}" type="button">${escapeHtml(task.title)}</button><br><span class="status">${statusLabel(task.status)}</span></td>
          <td><button class="table-link muted" data-open-project="${escapeAttr(project.id)}" type="button">${escapeHtml(project.name)}</button></td>
          <td>${escapeHtml(task.owner || "")}</td>
          <td>${escapeHtml(task.due || "未定")}<br><span class="status">${dueLabel(task.due)}</span></td>
          <td><span class="badge ${escapeAttr(task.priority)}">${priorityLabel(task.priority)}</span></td>
        </tr>
      `;
    }).join("");
  }

  function renderDeadlines() {
    const deadlines = filteredDeadlines();
    const dash = document.getElementById("dashboardTimeline");
    dash.innerHTML = "";
    if (!deadlines.length) {
      dash.appendChild(emptyNode());
      return;
    }
    dash.innerHTML = deadlines.slice(0, 8).map(deadlineRow).join("");
  }

  function deadlineRow(deadline) {
    const project = projectById(deadline.projectId);
    return `
      <button class="deadline-row clickable-row" data-open-deadline="${escapeAttr(deadline.id)}" type="button">
        <div>
          <h3>${escapeHtml(deadline.title)}</h3>
          <div class="meta-row">
            <span class="badge">${escapeHtml(deadline.date || "未定")}</span>
            <span class="badge">${dueLabel(deadline.date)}</span>
            <span class="badge">${escapeHtml(project.name)}</span>
            <span class="badge">${escapeHtml(deadline.kind || "节点")}</span>
          </div>
        </div>
        <span class="badge ${escapeAttr(deadline.risk)}">${priorityLabel(deadline.risk)}</span>
      </button>
    `;
  }

  function renderDocuments() {
    const documents = filteredDocuments();
    const grid = document.getElementById("documentGrid");
    grid.innerHTML = "";
    if (!documents.length) {
      grid.appendChild(emptyNode());
      return;
    }
    grid.innerHTML = documents.map((document) => {
      const project = projectById(document.projectId);
      return `
        <button class="document-card clickable-card" data-open-document="${escapeAttr(document.id)}" type="button">
          <header>
            <h3>${escapeHtml(document.title)}</h3>
            <span class="badge">${escapeHtml(document.type || "资料")}</span>
          </header>
          <p>${escapeHtml(document.note || "")}</p>
          <div class="meta-row">
            <span class="badge">${escapeHtml(project.name)}</span>
          </div>
          <p class="doc-path">${escapeHtml(document.path || "未设置路径")}</p>
        </button>
      `;
    }).join("");
  }

  function renderCalendar() {
    const title = document.getElementById("calendarTitle");
    const board = document.getElementById("calendarBoard");
    document.querySelectorAll("[data-calendar-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.calendarMode === calendarMode);
    });
    title.textContent = calendarTitle();
    board.innerHTML = calendarMode === "month" ? renderCalendarMonth() : renderCalendarAgenda(calendarMode);
  }

  function calendarTitle() {
    if (calendarMode === "month") return `${calendarAnchor.getFullYear()} 年 ${calendarAnchor.getMonth() + 1} 月`;
    if (calendarMode === "week") {
      const start = weekStart(calendarAnchor);
      const end = addDays(start, 6);
      return `${toIsoDate(start)} → ${toIsoDate(end)}`;
    }
    return formatLongDate(toIsoDate(calendarAnchor));
  }

  function renderCalendarMonth() {
    const first = new Date(calendarAnchor.getFullYear(), calendarAnchor.getMonth(), 1);
    const start = addDays(first, -first.getDay());
    const cells = Array.from({ length: 42 }, (_, index) => addDays(start, index));
    return `
      <div class="calendar-weekdays">${["日", "一", "二", "三", "四", "五", "六"].map((day) => `<span>周${day}</span>`).join("")}</div>
      <div class="calendar-grid">
        ${cells.map((date) => calendarCell(date, date.getMonth() === calendarAnchor.getMonth())).join("")}
      </div>
    `;
  }

  function calendarCell(date, inMonth) {
    const key = toIsoDate(date);
    const events = eventsForDate(key);
    return `
      <button class="calendar-cell ${inMonth ? "" : "muted"} ${key === toIsoDate(today) ? "today" : ""}" data-open-day="${key}" type="button">
        <span class="calendar-day">${date.getDate()}</span>
        <span class="calendar-count">${events.length ? events.length : ""}</span>
        <span class="calendar-events">
          ${events.slice(0, 3).map((event) => `<span class="calendar-event ${event.kind}">${escapeHtml(event.title)}</span>`).join("")}
          ${events.length > 3 ? `<span class="calendar-more">+${events.length - 3} 更多</span>` : ""}
        </span>
      </button>
    `;
  }

  function renderCalendarAgenda(mode) {
    const dates = mode === "week"
      ? Array.from({ length: 7 }, (_, index) => addDays(weekStart(calendarAnchor), index))
      : [calendarAnchor];
    return `<div class="agenda-list">${dates.map((date) => {
      const key = toIsoDate(date);
      const events = eventsForDate(key);
      return `
        <section class="agenda-day">
          <button class="agenda-date" data-open-day="${key}" type="button">
            <strong>${formatLongDate(key)}</strong>
            <span>${events.length} 项</span>
          </button>
          <div class="agenda-events">
            ${events.length ? events.map(calendarEventRow).join("") : `<p class="muted-copy">当天没有任务或节点。</p>`}
          </div>
        </section>
      `;
    }).join("")}</div>`;
  }

  function calendarEventRow(event) {
    return `
      <button class="agenda-event ${event.kind}" ${event.kind === "task" ? `data-open-task="${escapeAttr(event.id)}"` : `data-open-deadline="${escapeAttr(event.id)}"`} type="button">
        <span>${escapeHtml(event.title)}</span>
        <small>${escapeHtml(projectById(event.projectId).name)} · ${event.kind === "task" ? "任务" : "节点"}</small>
      </button>
    `;
  }

  function eventsForDate(key) {
    const taskEvents = state.tasks
      .filter((task) => task.due === key)
      .map((task) => ({ ...task, kind: "task", date: task.due }));
    const deadlineEvents = state.deadlines
      .filter((deadline) => deadline.date === key)
      .map((deadline) => ({ ...deadline, kind: "deadline" }));
    return [...deadlineEvents, ...taskEvents].sort((a, b) => String(a.title).localeCompare(String(b.title), "zh-CN"));
  }

  function renderMap() {
    const target = document.getElementById("projectMap");
    if (!target) return;
    if (!state.projects.length) {
      target.innerHTML = "";
      target.appendChild(emptyNode());
      return;
    }
    const rowHeight = 116;
    const width = 1040;
    const height = Math.max(320, state.projects.length * rowHeight + 80);
    const projectX = 80;
    const taskX = 390;
    const deliveryX = 680;
    const documentX = 910;
    const rows = state.projects.map((project, index) => {
      const y = 70 + index * rowHeight;
      const rel = related(project.id);
      const taskCount = rel.tasks.filter((task) => task.status !== "done").length;
      const deadlineCount = rel.deadlines.length;
      const docCount = rel.documents.length;
      return { project, y, taskCount, deadlineCount, docCount };
    });
    target.innerHTML = `
      <svg class="relationship-map" viewBox="0 0 ${width} ${height}" role="img" aria-label="Pontnova 项目关系图谱">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L7,3 z" fill="#51748c"></path>
          </marker>
        </defs>
        <text x="${projectX}" y="28" class="map-label">项目</text>
        <text x="${taskX}" y="28" class="map-label">任务</text>
        <text x="${deliveryX}" y="28" class="map-label">节点</text>
        <text x="${documentX}" y="28" class="map-label">资料</text>
        ${rows.map(({ project, y }) => `
          <path class="map-link" d="M${projectX + 190},${y} C${projectX + 260},${y} ${taskX - 50},${y} ${taskX},${y}" marker-end="url(#arrow)"></path>
          <path class="map-link" d="M${taskX + 190},${y} C${taskX + 250},${y} ${deliveryX - 50},${y} ${deliveryX},${y}" marker-end="url(#arrow)"></path>
          <path class="map-link" d="M${deliveryX + 150},${y} C${deliveryX + 200},${y} ${documentX - 50},${y} ${documentX},${y}" marker-end="url(#arrow)"></path>
          <g class="map-node project-node" data-open-project="${escapeAttr(project.id)}" tabindex="0" role="button">
            <rect x="${projectX}" y="${y - 34}" rx="8" width="190" height="68"></rect>
            <text x="${projectX + 14}" y="${y - 8}" class="map-title">${escapeSvg(project.name)}</text>
            <text x="${projectX + 14}" y="${y + 14}" class="map-meta">${typeLabel(project.type)} · ${stageLabel(project.stage)}</text>
          </g>
        `).join("")}
        ${rows.map(({ y, taskCount }) => mapPill(taskX, y, `${taskCount} open`, "任务队列")).join("")}
        ${rows.map(({ y, deadlineCount }) => mapPill(deliveryX, y, `${deadlineCount}`, "关键节点")).join("")}
        ${rows.map(({ y, docCount }) => mapPill(documentX, y, `${docCount}`, "资料索引")).join("")}
      </svg>
    `;
  }

  function mapPill(x, y, value, label) {
    return `
      <g class="map-node stat-node">
        <rect x="${x}" y="${y - 28}" rx="8" width="150" height="56"></rect>
        <text x="${x + 14}" y="${y - 4}" class="map-title">${escapeSvg(value)}</text>
        <text x="${x + 14}" y="${y + 16}" class="map-meta">${escapeSvg(label)}</text>
      </g>
    `;
  }

  function renderAll() {
    renderMetrics();
    renderProjects();
    renderTasks();
    renderDeadlines();
    renderDocuments();
    renderCalendar();
    renderMap();
    refreshDrawer();
  }

  function setView(view) {
    currentView = view;
    Object.entries(views).forEach(([key, element]) => element?.classList.toggle("is-active", key === view));
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
    document.getElementById("viewTitle").textContent = titles[view];
  }

  function openDialog(kind, defaults = {}) {
    const dialog = document.getElementById("entryDialog");
    const form = document.getElementById("entryForm");
    const fields = document.getElementById("formFields");
    form.dataset.kind = kind;
    form.dataset.projectId = defaults.projectId || "";
    fields.innerHTML = fieldMarkup(kind, defaults);
    document.getElementById("dialogTitle").textContent = {
      project: "新增项目",
      task: "新增任务",
      deadline: "新增节点",
      document: "新增资料"
    }[kind];
    document.getElementById("dialogKicker").textContent = defaults.projectId ? projectById(defaults.projectId).name : "Pontnova";
    dialog.showModal();
  }

  function fieldMarkup(kind, defaults = {}) {
    if (kind === "project") {
      return `
        ${field("name", "项目名称", "text", "", true)}
        ${field("client", "客户 / 对象", "text")}
        ${selectField("type", "类型", [["consulting", "咨询"], ["fundraising", "投融资"], ["training", "培训"], ["workshop", "Workshop"], ["operations", "运营"]], defaults.type)}
        ${selectField("priority", "优先级", [["high", "高"], ["medium", "中"], ["low", "低"]], defaults.priority || "medium")}
        ${selectField("stage", "状态", [["planning", "规划"], ["active", "推进中"], ["waiting", "等待"], ["complete", "完成"]], defaults.stage || "planning")}
        ${field("owner", "负责人", "text", "Pontnova")}
        ${field("progress", "进度 0-100", "number", "10")}
        ${field("next", "下一步", "text", "", false, "full")}
        ${textareaField("summary", "项目说明")}
      `;
    }
    if (kind === "task") {
      return `
        ${field("title", "任务", "text", "", true, "full")}
        ${selectField("projectId", "项目", state.projects.map((p) => [p.id, p.name]), defaults.projectId)}
        ${field("owner", "负责人", "text", "Pontnova")}
        ${field("due", "截止日期", "date", defaults.date || isoDate(7))}
        ${selectField("priority", "优先级", [["high", "高"], ["medium", "中"], ["low", "低"]], "medium")}
        ${selectField("status", "状态", [["next", "下一步"], ["in_progress", "进行中"], ["waiting", "等待"], ["done", "完成"]], "next")}
      `;
    }
    if (kind === "deadline") {
      return `
        ${field("title", "节点名称", "text", "", true, "full")}
        ${selectField("projectId", "项目", state.projects.map((p) => [p.id, p.name]), defaults.projectId)}
        ${field("kind", "类型", "text", "交付")}
        ${field("date", "日期", "date", defaults.date || isoDate(7))}
        ${selectField("risk", "风险", [["high", "高"], ["medium", "中"], ["low", "低"]], "medium")}
      `;
    }
    return `
      ${field("title", "资料名称", "text", "", true, "full")}
      ${selectField("projectId", "项目", state.projects.map((p) => [p.id, p.name]), defaults.projectId)}
      ${field("type", "类型", "text", "note")}
      ${field("path", "Dropbox 路径 / 链接", "text", "", false, "full")}
      ${textareaField("note", "备注")}
    `;
  }

  function field(name, label, type, value = "", required = false, klass = "") {
    return `<div class="form-field ${klass}"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${escapeAttr(value)}" ${required ? "required" : ""}></div>`;
  }

  function selectField(name, label, options, selected = "") {
    return `<div class="form-field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map(([value, text]) => `<option value="${escapeAttr(value)}" ${String(value) === String(selected) ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></div>`;
  }

  function textareaField(name, label, value = "") {
    return `<div class="form-field full"><label for="${name}">${label}</label><textarea id="${name}" name="${name}">${escapeHtml(value)}</textarea></div>`;
  }

  function saveEntry(form) {
    const kind = form.dataset.kind;
    const data = Object.fromEntries(new FormData(form).entries());
    const id = `${kind}-${Date.now().toString(36)}`;
    if (kind === "project") {
      state.projects.unshift({
        id,
        ...data,
        progress: clamp(Number(data.progress) || 0, 0, 100)
      });
    }
    if (kind === "task") state.tasks.unshift({ id, ...data });
    if (kind === "deadline") state.deadlines.unshift({ id, ...data });
    if (kind === "document") state.documents.unshift({ id, ...data });
    saveState();
    renderAll();
    if (form.dataset.projectId) openProject(form.dataset.projectId);
  }

  function openProject(id) {
    const project = state.projects.find((item) => item.id === id);
    if (!project) return;
    const rel = related(id);
    activeDrawer = { kind: "project", id };
    setDrawer("项目", project.name, `
      <section class="drawer-section">
        <div class="detail-hero">
          <div>
            <p class="eyebrow">${typeLabel(project.type)} · ${stageLabel(project.stage)}</p>
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.summary || "暂无项目说明。")}</p>
          </div>
          <span class="badge ${escapeAttr(project.priority)}">${priorityLabel(project.priority)}</span>
        </div>
        <div class="detail-metrics">
          <span><strong>${rel.tasks.filter((task) => task.status !== "done").length}</strong>未完成任务</span>
          <span><strong>${rel.deadlines.length}</strong>关键节点</span>
          <span><strong>${rel.documents.length}</strong>资料</span>
        </div>
        <div class="progress large"><span style="width:${Number(project.progress) || 0}%"></span></div>
      </section>
      <section class="drawer-section">
        <h3>项目设置</h3>
        <div class="form-grid compact-grid">
          ${selectField("drawerProjectStage", "状态", [["planning", "规划"], ["active", "推进中"], ["waiting", "等待"], ["complete", "完成"]], project.stage)}
          ${selectField("drawerProjectPriority", "优先级", [["high", "高"], ["medium", "中"], ["low", "低"]], project.priority)}
          ${field("drawerProjectProgress", "进度", "number", project.progress || 0)}
          ${field("drawerProjectOwner", "负责人", "text", project.owner || "")}
          ${field("drawerProjectNext", "下一步", "text", project.next || "", false, "full")}
        </div>
        <button class="primary-button small" data-save-project="${escapeAttr(project.id)}" type="button">保存项目设置</button>
      </section>
      ${linkedList("任务", rel.tasks.sort(sortTasks), "task")}
      ${linkedList("关键节点", rel.deadlines.sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))), "deadline")}
      ${linkedList("资料", rel.documents, "document")}
      <div class="drawer-actions">
        <button class="ghost-button" data-add-related="task" data-project-id="${escapeAttr(id)}" type="button">新增任务</button>
        <button class="ghost-button" data-add-related="deadline" data-project-id="${escapeAttr(id)}" type="button">新增节点</button>
        <button class="ghost-button" data-add-related="document" data-project-id="${escapeAttr(id)}" type="button">新增资料</button>
      </div>
    `);
  }

  function linkedList(title, items, kind) {
    return `
      <section class="drawer-section">
        <h3>${title}</h3>
        <div class="linked-list">
          ${items.length ? items.map((item) => `
            <button class="linked-item" data-open-${kind}="${escapeAttr(item.id)}" type="button">
              <span>${escapeHtml(item.title)}</span>
              <small>${kind === "task" ? `${statusLabel(item.status)} · ${dueLabel(item.due)}` : kind === "deadline" ? `${item.date || "未定"} · ${item.kind || "节点"}` : item.type || "资料"}</small>
            </button>
          `).join("") : `<p class="muted-copy">暂无${title}。</p>`}
        </div>
      </section>
    `;
  }

  function openTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    const project = projectById(task.projectId);
    activeDrawer = { kind: "task", id };
    setDrawer("任务", task.title, `
      <section class="drawer-section">
        <div class="detail-hero">
          <div>
            <p class="eyebrow">${escapeHtml(project.name)}</p>
            <h3>${escapeHtml(task.title)}</h3>
            <p>${task.due ? `${dueLabel(task.due)} · ${escapeHtml(task.due)}` : "未设置截止日期"}</p>
          </div>
          <span class="badge ${escapeAttr(task.priority)}">${priorityLabel(task.priority)}</span>
        </div>
        <div class="form-grid compact-grid">
          ${field("drawerTaskTitle", "任务", "text", task.title, true, "full")}
          ${selectField("drawerTaskProject", "项目", state.projects.map((p) => [p.id, p.name]), task.projectId)}
          ${field("drawerTaskOwner", "负责人", "text", task.owner || "")}
          ${field("drawerTaskDue", "截止日期", "date", task.due || "")}
          ${selectField("drawerTaskStatus", "状态", [["next", "下一步"], ["in_progress", "进行中"], ["waiting", "等待"], ["done", "完成"]], task.status)}
          ${selectField("drawerTaskPriority", "优先级", [["high", "高"], ["medium", "中"], ["low", "低"]], task.priority)}
        </div>
        <div class="drawer-actions">
          <button class="primary-button small" data-save-task="${escapeAttr(task.id)}" type="button">保存任务</button>
          <button class="ghost-button" data-open-project="${escapeAttr(project.id)}" type="button">打开项目</button>
        </div>
      </section>
    `);
  }

  function openDeadline(id) {
    const deadline = state.deadlines.find((item) => item.id === id);
    if (!deadline) return;
    const project = projectById(deadline.projectId);
    activeDrawer = { kind: "deadline", id };
    setDrawer("关键节点", deadline.title, `
      <section class="drawer-section">
        <div class="detail-hero">
          <div>
            <p class="eyebrow">${escapeHtml(project.name)}</p>
            <h3>${escapeHtml(deadline.title)}</h3>
            <p>${deadline.date ? `${dueLabel(deadline.date)} · ${escapeHtml(deadline.date)}` : "未设置日期"}</p>
          </div>
          <span class="badge ${escapeAttr(deadline.risk)}">${priorityLabel(deadline.risk)}</span>
        </div>
        <div class="form-grid compact-grid">
          ${field("drawerDeadlineTitle", "节点名称", "text", deadline.title, true, "full")}
          ${selectField("drawerDeadlineProject", "项目", state.projects.map((p) => [p.id, p.name]), deadline.projectId)}
          ${field("drawerDeadlineKind", "类型", "text", deadline.kind || "")}
          ${field("drawerDeadlineDate", "日期", "date", deadline.date || "")}
          ${selectField("drawerDeadlineRisk", "风险", [["high", "高"], ["medium", "中"], ["low", "低"]], deadline.risk)}
        </div>
        <div class="drawer-actions">
          <button class="primary-button small" data-save-deadline="${escapeAttr(deadline.id)}" type="button">保存节点</button>
          <button class="ghost-button" data-open-project="${escapeAttr(project.id)}" type="button">打开项目</button>
        </div>
      </section>
    `);
  }

  function openDocument(id) {
    const documentItem = state.documents.find((item) => item.id === id);
    if (!documentItem) return;
    const project = projectById(documentItem.projectId);
    activeDrawer = { kind: "document", id };
    setDrawer("资料", documentItem.title, `
      <section class="drawer-section">
        <div class="detail-hero">
          <div>
            <p class="eyebrow">${escapeHtml(project.name)}</p>
            <h3>${escapeHtml(documentItem.title)}</h3>
            <p>${escapeHtml(documentItem.note || "暂无备注。")}</p>
          </div>
          <span class="badge">${escapeHtml(documentItem.type || "资料")}</span>
        </div>
        <div class="form-grid compact-grid">
          ${field("drawerDocumentTitle", "资料名称", "text", documentItem.title, true, "full")}
          ${selectField("drawerDocumentProject", "项目", state.projects.map((p) => [p.id, p.name]), documentItem.projectId)}
          ${field("drawerDocumentType", "类型", "text", documentItem.type || "")}
          ${field("drawerDocumentPath", "路径 / 链接", "text", documentItem.path || "", false, "full")}
          ${textareaField("drawerDocumentNote", "备注", documentItem.note || "")}
        </div>
        <div class="drawer-actions">
          <button class="primary-button small" data-save-document="${escapeAttr(documentItem.id)}" type="button">保存资料</button>
          <button class="ghost-button" data-open-project="${escapeAttr(project.id)}" type="button">打开项目</button>
        </div>
      </section>
    `);
  }

  function openDay(key) {
    const events = eventsForDate(key);
    activeDrawer = { kind: "day", id: key };
    setDrawer("日历", formatLongDate(key), `
      <section class="drawer-section">
        <div class="detail-hero">
          <div>
            <p class="eyebrow">Calendar</p>
            <h3>${formatLongDate(key)}</h3>
            <p>${events.length ? `${events.length} 个任务/节点` : "当天没有安排。"}</p>
          </div>
        </div>
        <div class="linked-list">
          ${events.length ? events.map(calendarEventRow).join("") : `<p class="muted-copy">当天没有任务或节点。</p>`}
        </div>
        <div class="drawer-actions">
          <button class="ghost-button" data-add-related="task" data-date="${escapeAttr(key)}" type="button">新增任务</button>
          <button class="ghost-button" data-add-related="deadline" data-date="${escapeAttr(key)}" type="button">新增节点</button>
        </div>
      </section>
    `);
  }

  function setDrawer(kicker, title, body) {
    document.getElementById("drawerKicker").textContent = kicker;
    document.getElementById("drawerTitle").textContent = title;
    document.getElementById("drawerBody").innerHTML = body;
    const drawer = document.getElementById("detailDrawer");
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    activeDrawer = null;
    const drawer = document.getElementById("detailDrawer");
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }

  function refreshDrawer() {
    if (!activeDrawer) return;
    if (activeDrawer.kind === "project") openProject(activeDrawer.id);
    if (activeDrawer.kind === "task") openTask(activeDrawer.id);
    if (activeDrawer.kind === "deadline") openDeadline(activeDrawer.id);
    if (activeDrawer.kind === "document") openDocument(activeDrawer.id);
    if (activeDrawer.kind === "day") openDay(activeDrawer.id);
  }

  function saveProjectDetail(id) {
    const project = state.projects.find((item) => item.id === id);
    if (!project) return;
    project.stage = valueOf("drawerProjectStage");
    project.priority = valueOf("drawerProjectPriority");
    project.progress = clamp(Number(valueOf("drawerProjectProgress")) || 0, 0, 100);
    project.owner = valueOf("drawerProjectOwner");
    project.next = valueOf("drawerProjectNext");
    saveState();
    renderAll();
    openProject(id);
  }

  function saveTaskDetail(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    task.title = valueOf("drawerTaskTitle") || task.title;
    task.projectId = valueOf("drawerTaskProject") || task.projectId;
    task.owner = valueOf("drawerTaskOwner");
    task.due = valueOf("drawerTaskDue");
    task.status = valueOf("drawerTaskStatus");
    task.priority = valueOf("drawerTaskPriority");
    saveState();
    renderAll();
    openTask(id);
  }

  function saveDeadlineDetail(id) {
    const deadline = state.deadlines.find((item) => item.id === id);
    if (!deadline) return;
    deadline.title = valueOf("drawerDeadlineTitle") || deadline.title;
    deadline.projectId = valueOf("drawerDeadlineProject") || deadline.projectId;
    deadline.kind = valueOf("drawerDeadlineKind");
    deadline.date = valueOf("drawerDeadlineDate");
    deadline.risk = valueOf("drawerDeadlineRisk");
    saveState();
    renderAll();
    openDeadline(id);
  }

  function saveDocumentDetail(id) {
    const documentItem = state.documents.find((item) => item.id === id);
    if (!documentItem) return;
    documentItem.title = valueOf("drawerDocumentTitle") || documentItem.title;
    documentItem.projectId = valueOf("drawerDocumentProject") || documentItem.projectId;
    documentItem.type = valueOf("drawerDocumentType");
    documentItem.path = valueOf("drawerDocumentPath");
    documentItem.note = valueOf("drawerDocumentNote");
    saveState();
    renderAll();
    openDocument(id);
  }

  function valueOf(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  function moveCalendar(direction) {
    if (calendarMode === "month") calendarAnchor = new Date(calendarAnchor.getFullYear(), calendarAnchor.getMonth() + direction, 1);
    if (calendarMode === "week") calendarAnchor = addDays(calendarAnchor, direction * 7);
    if (calendarMode === "day") calendarAnchor = addDays(calendarAnchor, direction);
    renderCalendar();
  }

  function sortTasks(a, b) {
    const statusWeight = { in_progress: 0, next: 1, waiting: 2, done: 3 };
    const priorityWeight = { high: 0, medium: 1, low: 2 };
    return (statusWeight[a.status] ?? 9) - (statusWeight[b.status] ?? 9)
      || (priorityWeight[a.priority] ?? 9) - (priorityWeight[b.priority] ?? 9)
      || String(a.due || "9999-12-31").localeCompare(String(b.due || "9999-12-31"));
  }

  function dueLabel(date) {
    if (!date) return "未定";
    const diff = daysUntil(date);
    if (diff < 0) return `逾期 ${Math.abs(diff)} 天`;
    if (diff === 0) return "今天";
    if (diff === 1) return "明天";
    return `${diff} 天后`;
  }

  function daysUntil(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return 9999;
    return Math.ceil((parseIsoDate(date) - today) / dayMs);
  }

  function parseIsoDate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  function weekStart(date) {
    return addDays(date, -date.getDay());
  }

  function toIsoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatLongDate(key) {
    const date = parseIsoDate(key);
    const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 · 周${weekday}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function escapeSvg(value) {
    return escapeHtml(value).slice(0, 18);
  }

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  document.querySelectorAll("[data-view-jump]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.viewJump));
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderProjects();
    });
  });
  document.querySelectorAll("[data-calendar-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      calendarMode = button.dataset.calendarMode;
      renderCalendar();
    });
  });

  document.getElementById("searchInput").addEventListener("input", (event) => {
    query = event.target.value.trim();
    renderAll();
  });

  document.getElementById("newProjectButton").addEventListener("click", () => openDialog("project"));
  document.getElementById("newProjectButtonSecondary").addEventListener("click", () => openDialog("project"));
  document.getElementById("newTaskButton").addEventListener("click", () => openDialog("task"));
  document.getElementById("newTaskButtonSecondary").addEventListener("click", () => openDialog("task"));
  document.getElementById("newDeadlineButton").addEventListener("click", () => openDialog("deadline"));
  document.getElementById("newDeadlineButtonSecondary").addEventListener("click", () => openDialog("deadline"));
  document.getElementById("newDocumentButton").addEventListener("click", () => openDialog("document"));
  document.getElementById("calendarPrevButton").addEventListener("click", () => moveCalendar(-1));
  document.getElementById("calendarNextButton").addEventListener("click", () => moveCalendar(1));
  document.getElementById("calendarTodayButton").addEventListener("click", () => {
    calendarAnchor = startOfDay(new Date());
    renderCalendar();
  });

  document.getElementById("entryForm").addEventListener("submit", (event) => {
    if (event.submitter && event.submitter.value === "cancel") return;
    event.preventDefault();
    saveEntry(event.currentTarget);
    document.getElementById("entryDialog").close();
    event.currentTarget.reset();
  });

  document.body.addEventListener("change", (event) => {
    const id = event.target.dataset.toggleTask;
    if (!id) return;
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    task.status = event.target.checked ? "done" : "next";
    saveState();
    renderAll();
  });

  document.body.addEventListener("click", (event) => {
    const target = event.target.closest("button, g");
    if (!target) return;
    if (target.dataset.openProject) openProject(target.dataset.openProject);
    if (target.dataset.openTask) openTask(target.dataset.openTask);
    if (target.dataset.openDeadline) openDeadline(target.dataset.openDeadline);
    if (target.dataset.openDocument) openDocument(target.dataset.openDocument);
    if (target.dataset.openDay) openDay(target.dataset.openDay);
    if (target.dataset.addRelated) openDialog(target.dataset.addRelated, { projectId: target.dataset.projectId || "", date: target.dataset.date || "" });
    if (target.dataset.saveProject) saveProjectDetail(target.dataset.saveProject);
    if (target.dataset.saveTask) saveTaskDetail(target.dataset.saveTask);
    if (target.dataset.saveDeadline) saveDeadlineDetail(target.dataset.saveDeadline);
    if (target.dataset.saveDocument) saveDocumentDetail(target.dataset.saveDocument);
  });

  document.getElementById("closeDrawerButton").addEventListener("click", closeDrawer);
  document.querySelector("[data-close-drawer]").addEventListener("click", closeDrawer);

  document.getElementById("exportDataButton").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pontnova-workbench-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importDataInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.projects) || !Array.isArray(imported.tasks)) {
      alert("JSON 结构不符合工作台格式。");
      return;
    }
    replaceState(imported);
    saveState();
    renderAll();
  });

  function init() {
    replaceState(loadLocalState());
    localStorage.setItem(storageKey, JSON.stringify(state));
    renderAll();
    loadCloudState();
  }

  init();
})();
