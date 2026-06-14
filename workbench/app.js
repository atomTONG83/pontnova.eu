(function () {
  const storageKey = "pontnova-workbench-v3";
  const dayMs = 24 * 60 * 60 * 1000;
  const today = startOfDay(new Date());
  const isoDate = (offset) => toIsoDate(new Date(today.getTime() + offset * dayMs));

  const typeOptions = [
    ["consulting", "咨询", "CONS", "#1d6b5e", "CONS · CONSULTING", "咨询项目", "市场进入、竞争风险、IP 策略与跨境业务判断。"],
    ["fundraising", "投融资", "FUND", "#547a9b", "FUND · FINANCE", "投融资项目", "技术尽调、投资人材料、商业叙事和壁垒表达。"],
    ["training", "培训", "TRN", "#8b6f2f", "TRN · TRAINING", "培训项目", "管理层课程、案例设计、内部 IP 能力建设。"],
    ["workshop", "Workshop", "WS", "#7f466d", "WS · WORKSHOP", "Workshop 项目", "公开活动、主题策划、嘉宾协同和报名转化。"],
    ["operations", "运营", "OPS", "#667d51", "OPS · OPERATIONS", "运营项目", "内部运营、资料建设、流程优化和长期维护。"]
  ];
  const stageOptions = [
    ["planning", "规划"],
    ["active", "推进中"],
    ["waiting", "等待"],
    ["review", "复核"],
    ["complete", "完成"],
    ["paused", "暂停"]
  ];
  const healthOptions = [
    ["on_track", "正常"],
    ["needs_review", "需复核"],
    ["at_risk", "有风险"],
    ["blocked", "阻塞"]
  ];
  const objectiveStatusOptions = [
    ["on_track", "正常"],
    ["needs_review", "需复核"],
    ["at_risk", "有风险"],
    ["archived", "归档"]
  ];

  const seed = {
    projects: [
      {
        id: "pn-consult-001",
        projectNo: "PN-CONS-2026-001",
        name: "中欧 IP 市场进入策略",
        type: "consulting",
        client: "医疗科技客户",
        contact: "Head of IP",
        owner: "Edmond",
        stage: "active",
        priority: "high",
        health: "on_track",
        progress: 68,
        openedAt: isoDate(-14),
        dueDate: isoDate(21),
        budget: "Strategy sprint",
        goal: "形成客户可执行的欧洲进入策略和风险地图",
        next: "完成竞争格局和自由实施风险图谱",
        summary: "面向欧洲上市路径的知识产权、监管和商业风险咨询。"
      },
      {
        id: "pn-fund-002",
        projectNo: "PN-FUND-2026-001",
        name: "投融资技术尽调支持",
        type: "fundraising",
        client: "硬科技团队",
        contact: "CEO / CTO",
        owner: "Pontnova",
        stage: "active",
        priority: "high",
        health: "needs_review",
        progress: 52,
        openedAt: isoDate(-10),
        dueDate: isoDate(28),
        budget: "Investor readiness",
        goal: "把技术壁垒转化为投资人可理解的尽调叙事",
        next: "整理投资人问答和技术壁垒材料",
        summary: "把专利资产、技术路线、市场叙事整理成投资人可读材料。"
      },
      {
        id: "pn-train-003",
        projectNo: "PN-TRN-2026-001",
        name: "企业 IP 管理培训",
        type: "training",
        client: "制造业客户",
        contact: "Legal manager",
        owner: "Edmond",
        stage: "planning",
        priority: "medium",
        health: "on_track",
        progress: 35,
        openedAt: isoDate(-4),
        dueDate: isoDate(35),
        budget: "Half-day training",
        goal: "让管理层建立可执行的 IP 管理动作清单",
        next: "确认培训大纲和案例清单",
        summary: "两小时管理层课程，聚焦研发记录、商业秘密和海外布局。"
      },
      {
        id: "pn-ws-004",
        projectNo: "PN-WS-2026-001",
        name: "UPC / SEP Workshop",
        type: "workshop",
        client: "开放报名",
        contact: "Pontnova audience",
        owner: "Pontnova",
        stage: "planning",
        priority: "medium",
        health: "at_risk",
        progress: 28,
        openedAt: isoDate(-3),
        dueDate: isoDate(42),
        budget: "Public workshop",
        goal: "完成一场高质量出海 IP workshop 的策划与发布",
        next: "确认嘉宾、页面和报名表",
        summary: "面向中国出海企业的欧洲争议解决和许可策略工作坊。"
      }
    ],
    tasks: [
      { id: "task-1", projectId: "pn-consult-001", title: "补齐三家竞品欧洲专利族摘要", owner: "Edmond", due: isoDate(2), priority: "high", status: "next", notes: "用于市场进入策略的竞争格局判断。" },
      { id: "task-2", projectId: "pn-fund-002", title: "生成技术尽调问题清单", owner: "Pontnova", due: isoDate(4), priority: "high", status: "in_progress", notes: "面向投资人 Q&A 和技术壁垒叙事。" },
      { id: "task-3", projectId: "pn-train-003", title: "设计培训案例和互动题", owner: "Edmond", due: isoDate(7), priority: "medium", status: "next", notes: "加入研发记录、商业秘密和海外布局场景。" },
      { id: "task-4", projectId: "pn-ws-004", title: "Workshop 页面文案第一版", owner: "Pontnova", due: isoDate(10), priority: "medium", status: "waiting", notes: "等待嘉宾与主题确认。" }
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
    ],
    objectives: [
      { id: "okr-1", projectId: "pn-consult-001", title: "建立 Pontnova 咨询项目交付标准", owner: "Edmond", quarter: "2026 Q2", progress: 62, status: "on_track", signal: "每个咨询项目都能沉淀为可复用方法论" },
      { id: "okr-2", projectId: "pn-fund-002", title: "形成投融资技术尽调产品包", owner: "Pontnova", quarter: "2026 Q2", progress: 48, status: "needs_review", signal: "让投资材料同时经得起技术与商业追问" },
      { id: "okr-3", projectId: "pn-ws-004", title: "把 Workshop 变成稳定获客入口", owner: "Pontnova", quarter: "2026 Q2", progress: 35, status: "at_risk", signal: "主题、嘉宾、报名与复盘形成闭环" }
    ],
    keyResults: [
      { id: "kr-1", objectiveId: "okr-1", projectId: "pn-consult-001", label: "完成 3 套咨询交付模板", target: "3", current: "2", unit: "套", progress: 66, status: "on_track" },
      { id: "kr-2", objectiveId: "okr-1", projectId: "pn-consult-001", label: "每个项目沉淀 1 张风险地图", target: "4", current: "2", unit: "张", progress: 50, status: "needs_review" },
      { id: "kr-3", objectiveId: "okr-2", projectId: "pn-fund-002", label: "完成技术尽调 Q&A 数据库", target: "60", current: "25", unit: "题", progress: 42, status: "needs_review" },
      { id: "kr-4", objectiveId: "okr-3", projectId: "pn-ws-004", label: "确认 workshop 嘉宾与报名页", target: "100", current: "35", unit: "%", progress: 35, status: "at_risk" }
    ],
    timeEntries: [
      { id: "time-1", projectId: "pn-consult-001", taskId: "task-1", description: "竞品专利族初筛和摘要", date: isoDate(-2), hours: 2.5, billable: true, tags: "research;strategy" },
      { id: "time-2", projectId: "pn-fund-002", taskId: "task-2", description: "技术尽调问题树整理", date: isoDate(-1), hours: 1.75, billable: true, tags: "fundraising;dd" },
      { id: "time-3", projectId: "pn-train-003", taskId: "task-3", description: "培训案例结构设计", date: isoDate(0), hours: 1.25, billable: true, tags: "training" }
    ],
    activities: [
      { id: "act-1", projectId: "pn-consult-001", entity: "Project", entityId: "pn-consult-001", action: "update", title: "更新竞争格局风险图谱", actor: "Edmond", date: isoDate(-1), note: "补充竞品专利族和市场进入风险。" },
      { id: "act-2", projectId: "pn-fund-002", entity: "Task", entityId: "task-2", action: "create", title: "创建技术尽调问题清单任务", actor: "Pontnova", date: isoDate(-2), note: "为投资人预演准备问答。" },
      { id: "act-3", projectId: "pn-ws-004", entity: "Deadline", entityId: "due-3", action: "review", title: "报名页上线节点进入风险观察", actor: "Pontnova", date: isoDate(0), note: "嘉宾和页面材料尚待确认。" }
    ]
  };

  const state = clone(seed);
  let currentView = "dashboard";
  let currentFilter = "all";
  let activeProgramType = "";
  let dashboardRange = "30";
  let query = "";
  let calendarMode = "month";
  let calendarAnchor = startOfDay(new Date());
  let activeDrawer = null;
  let activeDetail = null;
  let cloudSaveTimer = null;
  let cloudSaveInFlight = false;
  let cloudSaveQueued = false;

  const views = {
    dashboard: document.getElementById("dashboardView"),
    projects: document.getElementById("projectsView"),
    programDetail: document.getElementById("programDetailView"),
    tasks: document.getElementById("tasksView"),
    projectDetail: document.getElementById("projectDetailView"),
    taskDetail: document.getElementById("taskDetailView"),
    deadlines: document.getElementById("deadlinesView"),
    calendar: document.getElementById("calendarView"),
    documents: document.getElementById("documentsView"),
    objectives: document.getElementById("objectivesView"),
    workload: document.getElementById("workloadView"),
    audit: document.getElementById("auditView"),
    map: document.getElementById("mapView")
  };
  const titles = {
    dashboard: "项目看板",
    projects: "项目组合",
    programDetail: "项目组合",
    tasks: "任务清单",
    projectDetail: "项目详情",
    taskDetail: "任务详情",
    deadlines: "近期期限",
    calendar: "日历",
    documents: "资料索引",
    objectives: "OKR / 目标",
    workload: "计时器 / 工时",
    audit: "活动日志",
    map: "平台地图"
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadLocalState() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "");
      if (stored && Array.isArray(stored.projects)) return stored;
    } catch (error) {
      // Ignore malformed local data and fall back to seed records.
    }
    return clone(seed);
  }

  function normalizeState(nextState) {
    const sourceProjects = Array.isArray(nextState.projects) ? nextState.projects : [];
    const projects = sourceProjects.map((project, index) => ({
      id: text(project.id) || `project-${index}`,
      projectNo: text(project.projectNo || project.project_no) || buildProjectNo(project.type, index),
      name: text(project.name) || "未命名项目",
      type: choice(project.type, typeOptions.map(([value]) => value), "consulting"),
      client: text(project.client),
      contact: text(project.contact),
      owner: text(project.owner),
      stage: choice(project.stage, stageOptions.map(([value]) => value), "planning"),
      priority: choice(project.priority, ["high", "medium", "low"], "medium"),
      health: choice(project.health, healthOptions.map(([value]) => value), "on_track"),
      progress: clamp(Number(project.progress) || 0, 0, 100),
      openedAt: validDate(project.openedAt),
      dueDate: validDate(project.dueDate),
      budget: text(project.budget),
      goal: text(project.goal),
      next: text(project.next),
      summary: text(project.summary)
    }));
    if (!projects.length) projects.push({ ...clone(seed.projects[0]), id: "inbox", projectNo: "PN-OPS-2026-000", name: "Inbox" });

    const fallbackProjectId = projects[0].id;
    const projectIds = new Set(projects.map((project) => project.id));
    const tasks = asArray(nextState.tasks).map((task, index) => ({
      id: text(task.id) || `task-${index}`,
      projectId: projectIds.has(task.projectId) ? task.projectId : fallbackProjectId,
      title: text(task.title) || "未命名任务",
      owner: text(task.owner),
      due: validDate(task.due),
      priority: choice(task.priority, ["high", "medium", "low"], "medium"),
      status: choice(task.status, ["next", "in_progress", "waiting", "done"], "next"),
      notes: text(task.notes)
    }));
    const taskIds = new Set(tasks.map((task) => task.id));
    const deadlines = asArray(nextState.deadlines).map((deadline, index) => ({
      id: text(deadline.id) || `deadline-${index}`,
      projectId: projectIds.has(deadline.projectId) ? deadline.projectId : fallbackProjectId,
      title: text(deadline.title) || "未命名节点",
      date: validDate(deadline.date),
      kind: text(deadline.kind) || "节点",
      risk: choice(deadline.risk, ["high", "medium", "low"], "medium")
    }));
    const documents = asArray(nextState.documents).map((documentItem, index) => ({
      id: text(documentItem.id) || `document-${index}`,
      projectId: projectIds.has(documentItem.projectId) ? documentItem.projectId : fallbackProjectId,
      title: text(documentItem.title) || "未命名资料",
      type: text(documentItem.type) || "资料",
      path: text(documentItem.path),
      note: text(documentItem.note)
    }));
    const objectives = asArray(nextState.objectives).map((objective, index) => ({
      id: text(objective.id) || `objective-${index}`,
      projectId: projectIds.has(objective.projectId) ? objective.projectId : "",
      title: text(objective.title) || "未命名目标",
      owner: text(objective.owner),
      quarter: text(objective.quarter) || "2026 Q2",
      progress: clamp(Number(objective.progress) || 0, 0, 100),
      status: choice(objective.status, objectiveStatusOptions.map(([value]) => value), "on_track"),
      signal: text(objective.signal)
    }));
    const objectiveIds = new Set(objectives.map((objective) => objective.id));
    const keyResults = asArray(nextState.keyResults).map((kr, index) => ({
      id: text(kr.id) || `kr-${index}`,
      objectiveId: objectiveIds.has(kr.objectiveId) ? kr.objectiveId : "",
      projectId: projectIds.has(kr.projectId) ? kr.projectId : "",
      label: text(kr.label) || "未命名关键结果",
      target: text(kr.target),
      current: text(kr.current),
      unit: text(kr.unit),
      progress: clamp(Number(kr.progress) || 0, 0, 100),
      status: choice(kr.status, ["on_track", "needs_review", "at_risk"], "on_track")
    })).filter((kr) => kr.objectiveId);
    const timeEntries = asArray(nextState.timeEntries).map((entry, index) => ({
      id: text(entry.id) || `time-${index}`,
      projectId: projectIds.has(entry.projectId) ? entry.projectId : fallbackProjectId,
      taskId: taskIds.has(entry.taskId) ? entry.taskId : "",
      description: text(entry.description),
      date: validDate(entry.date) || toIsoDate(today),
      hours: clamp(Number(entry.hours) || 0, 0, 999),
      billable: Boolean(entry.billable ?? true),
      tags: text(entry.tags)
    }));
    const activities = asArray(nextState.activities).map((activity, index) => ({
      id: text(activity.id) || `activity-${index}`,
      projectId: projectIds.has(activity.projectId) ? activity.projectId : "",
      entity: choice(activity.entity, ["Project", "Task", "Deadline", "Document", "Objective", "TimeEntry"], "Project"),
      entityId: text(activity.entityId),
      action: choice(activity.action, ["create", "update", "complete", "review", "note", "delete"], "update"),
      title: text(activity.title) || "工作台更新",
      actor: text(activity.actor) || "Pontnova",
      date: validDate(activity.date) || toIsoDate(today),
      note: text(activity.note)
    }));

    return { projects, tasks, deadlines, documents, objectives, keyResults, timeEntries, activities };
  }

  function replaceState(nextState) {
    const normalized = normalizeState(nextState);
    Object.assign(state, normalized);
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
      if (response.status === 401) {
        setReauthStatus();
        return;
      }
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
    cloudSaveTimer = setTimeout(() => saveCloudState(), 350);
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
      if (response.status === 401) {
        setReauthStatus();
        return;
      }
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
    status.dataset.action = "";
    status.onclick = null;
  }

  function setReauthStatus() {
    const status = document.getElementById("syncStatus");
    if (!status) return;
    status.textContent = "登录已过期，请点这里重新登录";
    status.dataset.tone = "warn";
    status.dataset.action = "login";
    status.onclick = () => {
      window.location.href = "/workbench/login";
    };
  }

  function projectById(id) {
    return state.projects.find((project) => project.id === id) || {
      id: "",
      projectNo: "PN-OPS-0000-000",
      name: "未绑定项目",
      type: "operations",
      priority: "medium",
      stage: "planning",
      progress: 0,
      health: "on_track"
    };
  }

  function related(projectId) {
    return {
      tasks: state.tasks.filter((task) => task.projectId === projectId),
      deadlines: state.deadlines.filter((deadline) => deadline.projectId === projectId),
      documents: state.documents.filter((documentItem) => documentItem.projectId === projectId),
      objectives: state.objectives.filter((objective) => objective.projectId === projectId),
      timeEntries: state.timeEntries.filter((entry) => entry.projectId === projectId),
      activities: state.activities.filter((activity) => activity.projectId === projectId)
    };
  }

  function filteredProjects() {
    return state.projects.filter((project) => {
      const haystack = [project.projectNo, project.name, project.type, project.client, project.contact, project.owner, project.summary, project.goal, project.next].join(" ");
      return (currentFilter === "all" || project.type === currentFilter) && matches(haystack);
    });
  }

  function filteredTasks() {
    return state.tasks.filter((task) => {
      const project = projectById(task.projectId);
      return matches([task.title, task.owner, task.notes, project.projectNo, project.name, project.client].join(" "));
    });
  }

  function filteredDeadlines() {
    return state.deadlines.filter((deadline) => {
      const project = projectById(deadline.projectId);
      return matches([deadline.title, deadline.kind, project.projectNo, project.name].join(" "));
    });
  }

  function filteredDocuments() {
    return state.documents.filter((documentItem) => {
      const project = projectById(documentItem.projectId);
      return matches([documentItem.title, documentItem.path, documentItem.note, project.projectNo, project.name].join(" "));
    });
  }

  function matches(value) {
    return !query || String(value).toLowerCase().includes(query.toLowerCase());
  }

  function renderEmpty(target) {
    const fragment = document.getElementById("emptyTemplate").content.cloneNode(true);
    target.replaceChildren(fragment);
  }

  function renderAll() {
    renderDashboard();
    renderPrograms();
    renderProgramDetailPage(activeProgramType);
    renderProjects();
    renderTasks();
    renderDeadlines();
    renderDeadlinesView();
    renderDocuments();
    renderObjectives();
    renderWorkload();
    renderActivity();
    renderCalendar();
    renderMap();
    refreshDetailPage();
    refreshDrawer();
  }

  function renderDashboard() {
    const upcoming30 = state.deadlines.filter((deadline) => deadline.date && daysUntil(deadline.date) <= 30 && daysUntil(deadline.date) >= 0);
    const weekDeadlines = upcoming30.filter((deadline) => daysUntil(deadline.date) <= 7);
    const openTasks = state.tasks.filter((task) => task.status !== "done");
    const totalHours = sumHours(state.timeEntries);
    const activeProjects = state.projects.filter((project) => !["complete", "paused"].includes(project.stage));
    const riskProjects = state.projects.filter((project) => ["at_risk", "blocked"].includes(project.health));
    const scopedEntries = timeEntriesForDashboardRange();
    const scopedHours = sumHours(scopedEntries);
    const scopedDays = dashboardRange === "all" ? spanDays(scopedEntries) : Number(dashboardRange);
    const projectHours = projectHourRows(scopedEntries);

    const todayPill = document.getElementById("todayPill");
    if (todayPill) todayPill.textContent = formatLongDate(toIsoDate(today));

    const heroStats = document.getElementById("heroStats");
    if (heroStats) {
      heroStats.innerHTML = [
        dashboardMetricCard("本周到期", weekDeadlines.length, "7 天内关键节点", "rose"),
        dashboardMetricCard("30 天内", upcoming30.length, "未来一个月排期", "amber"),
        dashboardMetricCard("活跃项目", `${activeProjects.length}/${state.projects.length}`, "按项目号归档", "green"),
        dashboardMetricCard("累计投入", `${totalHours.toFixed(1)} h`, `${state.timeEntries.length} 条记录`, "neutral")
      ].join("");
    }

    document.querySelectorAll("[data-dashboard-range]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.dashboardRange === dashboardRange);
    });

    const analyticsStats = document.getElementById("analyticsStats");
    if (analyticsStats) {
      analyticsStats.innerHTML = [
        analyticsMetricCard("总工时", `${scopedHours.toFixed(1)} h`, `${projectHours.length} 个项目有投入`),
        analyticsMetricCard("日均", `${(scopedHours / Math.max(1, scopedDays)).toFixed(2)} h`, "按当前范围折算"),
        analyticsMetricCard("记录条数", scopedEntries.length, `${state.documents.length} 份资料索引`)
      ].join("");
    }

    const histogram = document.getElementById("workloadHistogram");
    if (histogram) histogram.innerHTML = histogramBars(scopedEntries);
    const histogramMeta = document.getElementById("histogramMeta");
    if (histogramMeta) histogramMeta.textContent = rangeLabel(dashboardRange);

    const byProject = document.getElementById("workloadByProject");
    if (byProject) byProject.innerHTML = distributionRows(projectHours, "wide");
    const topProject = document.getElementById("topProjectWorkload");
    if (topProject) topProject.innerHTML = distributionRows(projectHours.slice(0, 5), "compact");
    const trend = document.getElementById("weeklyTrend");
    if (trend) trend.innerHTML = weeklyTrendCard();

    const dashTasks = document.getElementById("dashboardTasks");
    const tasks = filteredTasks().filter((task) => task.status !== "done").sort(sortTasks).slice(0, 6);
    dashTasks.innerHTML = tasks.length ? tasks.map(dashboardTaskRow).join("") : "";
    if (!tasks.length) renderEmpty(dashTasks);
    const taskPanelMeta = document.getElementById("taskPanelMeta");
    if (taskPanelMeta) taskPanelMeta.innerHTML = `<span class="status">共 ${openTasks.length} 条</span><span class="status needs_review">进行中 ${state.tasks.filter((task) => task.status === "in_progress").length}</span>`;

    const dashTimeline = document.getElementById("dashboardTimeline");
    const radarDeadlines = filteredDeadlines()
      .filter((deadline) => deadline.date && daysUntil(deadline.date) >= -1 && daysUntil(deadline.date) <= 30)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
    dashTimeline.innerHTML = radarDeadlines.length ? radarDeadlines.map(deadlineRadarRow).join("") : "";
    if (!radarDeadlines.length) renderEmpty(dashTimeline);
    const deadlinePanelMeta = document.getElementById("deadlinePanelMeta");
    if (deadlinePanelMeta) deadlinePanelMeta.textContent = `共 ${upcoming30.length} 条，按时间排序`;

    const dashObjectives = document.getElementById("dashboardObjectives");
    const objectives = state.objectives.filter((objective) => objective.status !== "archived").slice(0, 2);
    dashObjectives.innerHTML = objectives.length ? objectives.map(dashboardObjectiveCard).join("") : "";
    if (!objectives.length) renderEmpty(dashObjectives);

    const dashActivity = document.getElementById("dashboardActivity");
    const activities = sortedActivities().slice(0, 5);
    dashActivity.innerHTML = activities.length ? activities.map(activityRow).join("") : "";
    if (!activities.length) renderEmpty(dashActivity);
  }

  function dashboardMetricCard(label, value, hint, tone) {
    return `
      <article class="hero-stat ${escapeAttr(tone)}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(hint)}</small>
      </article>
    `;
  }

  function analyticsMetricCard(label, value, hint) {
    return `
      <article class="analytics-metric">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(hint)}</small>
      </article>
    `;
  }

  function timeEntriesForDashboardRange() {
    if (dashboardRange === "all") return state.timeEntries;
    const days = Number(dashboardRange) || 30;
    const start = addDays(today, -(days - 1));
    return state.timeEntries.filter((entry) => {
      const date = parseDate(entry.date);
      return date >= start && date <= today;
    });
  }

  function spanDays(entries) {
    if (!entries.length) return 1;
    const times = entries.map((entry) => parseDate(entry.date).getTime()).filter(Number.isFinite);
    if (!times.length) return 1;
    return Math.max(1, Math.round((Math.max(...times) - Math.min(...times)) / dayMs) + 1);
  }

  function projectHourRows(entries) {
    return state.projects.map((project) => ({
      project,
      hours: sumHours(entries.filter((entry) => entry.projectId === project.id))
    })).filter((item) => item.hours > 0).sort((a, b) => b.hours - a.hours);
  }

  function histogramBars(entries) {
    const visibleDays = dashboardRange === "all" ? 30 : Math.min(Number(dashboardRange) || 30, 45);
    const start = addDays(today, -(visibleDays - 1));
    const byDate = new Map();
    entries.forEach((entry) => byDate.set(entry.date, (byDate.get(entry.date) || 0) + Number(entry.hours || 0)));
    const dates = Array.from({ length: visibleDays }, (_, index) => toIsoDate(addDays(start, index)));
    const values = dates.map((date) => byDate.get(date) || 0);
    const max = Math.max(1, ...values);
    return dates.map((date, index) => {
      const hours = values[index];
      const height = hours ? Math.max(8, (hours / max) * 100) : 2;
      const showLabel = index === 0 || index === dates.length - 1 || (visibleDays <= 14 && index % 3 === 0);
      return `
        <button class="histogram-bar" data-open-day="${escapeAttr(date)}" title="${escapeAttr(date)} · ${hours.toFixed(2)} h" type="button">
          <i style="height:${height}%"></i>
          <span>${showLabel ? escapeHtml(date.slice(5)) : ""}</span>
        </button>
      `;
    }).join("");
  }

  function distributionRows(items, density = "wide") {
    if (!items.length) return `<p class="muted-copy">暂无投入记录。</p>`;
    const total = Math.max(1, sumHours(items));
    return items.map(({ project, hours }) => {
      const percent = Math.round((hours / total) * 100);
      return `
        <button class="distribution-row ${escapeAttr(density)}" data-open-project="${escapeAttr(project.id)}" type="button">
          <span class="distribution-label">
            <strong>${escapeHtml(project.projectNo)}</strong>
            <small>${escapeHtml(project.name)}</small>
          </span>
          <span class="distribution-meter"><i style="width:${Math.max(5, percent)}%"></i></span>
          <b>${hours.toFixed(1)} h</b>
        </button>
      `;
    }).join("");
  }

  function weeklyTrendCard() {
    const points = Array.from({ length: 5 }, (_, index) => {
      const end = addDays(today, -(4 - index) * 7);
      const start = addDays(end, -6);
      const hours = sumHours(state.timeEntries.filter((entry) => {
        const date = parseDate(entry.date);
        return date >= start && date <= end;
      }));
      return { label: toIsoDate(end).slice(5), hours };
    });
    const max = Math.max(1, ...points.map((point) => point.hours));
    const coords = points.map((point, index) => {
      const x = 18 + index * 76;
      const y = 92 - (point.hours / max) * 64;
      return `${x},${y}`;
    }).join(" ");
    return `
      <div class="mini-head">
        <strong>周累计趋势</strong>
        <span>${points[points.length - 1].hours.toFixed(1)} h 本周</span>
      </div>
      <svg class="trend-line" viewBox="0 0 340 112" role="img" aria-label="最近五周工时趋势">
        <polyline points="${coords}" fill="none"></polyline>
        ${points.map((point, index) => {
          const [x, y] = coords.split(" ")[index].split(",");
          return `<circle cx="${x}" cy="${y}" r="4"><title>${escapeHtml(point.label)} · ${point.hours.toFixed(1)} h</title></circle>`;
        }).join("")}
      </svg>
      <div class="trend-labels">${points.map((point) => `<span>${escapeHtml(point.label)}</span>`).join("")}</div>
    `;
  }

  function dashboardTaskRow(task) {
    const project = projectById(task.projectId);
    return `
      <article class="dashboard-task-row">
        <input data-task-check="${escapeAttr(task.id)}" type="checkbox" ${task.status === "done" ? "checked" : ""}>
        <button class="dashboard-row-main" data-open-task="${escapeAttr(task.id)}" type="button">
          <strong>${escapeHtml(task.title)}</strong>
          <span>${escapeHtml(project.projectNo)} · ${escapeHtml(project.name)}</span>
        </button>
        <span class="status ${escapeAttr(task.status === "in_progress" ? "needs_review" : "")}">${statusLabel(task.status)}</span>
        <span class="badge ${escapeAttr(task.priority)}">${priorityLabel(task.priority)}</span>
        <span class="due-pill ${daysUntil(task.due) <= 2 ? "urgent" : ""}">${relativeDay(task.due)}</span>
        <span class="row-actions dashboard-task-actions">
          <button class="ghost-button compact" data-edit-task="${escapeAttr(task.id)}" type="button">编辑</button>
          <button class="ghost-button compact danger-button" data-delete-task="${escapeAttr(task.id)}" type="button">删除</button>
        </span>
      </article>
    `;
  }

  function deadlineRadarRow(deadline) {
    const project = projectById(deadline.projectId);
    const distance = daysUntil(deadline.date);
    const tone = distance <= 3 || deadline.risk === "high" ? "urgent" : deadline.risk;
    return `
      <button class="radar-row ${escapeAttr(tone)}" data-open-deadline="${escapeAttr(deadline.id)}" type="button">
        <span class="radar-dot"></span>
        <span class="radar-main">
          <strong>${escapeHtml(deadline.title)}</strong>
          <small>${escapeHtml(project.projectNo)} · ${escapeHtml(project.name)} · ${escapeHtml(deadline.kind || "节点")}</small>
        </span>
        <span class="due-pill ${distance <= 3 ? "urgent" : ""}">${relativeDay(deadline.date)}</span>
        <span class="row-arrow">›</span>
      </button>
    `;
  }

  function dashboardObjectiveCard(objective) {
    const project = projectById(objective.projectId);
    const keyResults = state.keyResults.filter((kr) => kr.objectiveId === objective.id);
    return `
      <button class="dashboard-objective-row" data-open-objective="${escapeAttr(objective.id)}" type="button">
        <span class="okr-score ${escapeAttr(objective.status)}">${objective.progress}%</span>
        <span class="dashboard-row-main">
          <strong>${escapeHtml(objective.title)}</strong>
          <span>${escapeHtml(project.projectNo)} · ${escapeHtml(objective.quarter || "目标")} · ${escapeHtml(objective.owner || "Pontnova")}</span>
          <span>${keyResults.slice(0, 2).map((kr) => `${escapeHtml(kr.label)} ${kr.progress}%`).join(" / ") || escapeHtml(objective.signal || "暂无关键结果")}</span>
        </span>
        <span class="row-arrow">›</span>
      </button>
    `;
  }

  function rangeLabel(range) {
    if (range === "all") return "全部";
    if (range === "365") return "1 年";
    return `${range} 天`;
  }

  function renderPrograms() {
    const cards = typeOptions.map(([type, label, prefix]) => {
      const projects = state.projects.filter((project) => project.type === type);
      const active = projects.filter((project) => !["complete", "paused"].includes(project.stage)).length;
      const taskCount = state.tasks.filter((task) => projects.some((project) => project.id === task.projectId) && task.status !== "done").length;
      const deadlineCount = state.deadlines.filter((deadline) => projects.some((project) => project.id === deadline.projectId) && daysUntil(deadline.date) >= 0 && daysUntil(deadline.date) <= 30).length;
      const info = programInfo(type);
      return `
        <button class="program-card atom-program-card" data-open-program="${escapeAttr(type)}" style="--program-accent:${escapeAttr(info.accent)}" type="button">
          <span class="program-card-head">
            <span class="program-icon">${escapeHtml(prefix)}</span>
            <span class="status">Active</span>
          </span>
          <span class="program-card-title">
            <strong>${escapeHtml(info.title)}</strong>
            <span class="row-arrow">›</span>
          </span>
          <span class="program-card-copy">${escapeHtml(info.description)}</span>
          <span class="program-card-stats">
            <span><em>项目</em><b>${projects.length}</b></span>
            <span><em>活跃</em><b>${active}</b></span>
            <span><em>期限</em><b>${deadlineCount}</b></span>
          </span>
          <span class="sr-only">${taskCount} 个未完成任务</span>
        </button>
      `;
    }).join("");
    const programGrid = document.getElementById("programGrid");
    const dashboardPrograms = document.getElementById("dashboardPrograms");
    if (programGrid) programGrid.innerHTML = cards;
    if (dashboardPrograms) dashboardPrograms.innerHTML = cards;
  }

  function openProgram(type) {
    const info = programInfo(type);
    if (!info) return;
    closeDrawerIfOpen();
    activeProgramType = type;
    renderProgramDetailPage(type);
    setView("programDetail");
    setDetailTitle(info.title);
  }

  function renderProgramDetailPage(type) {
    const container = document.getElementById("programDetailPage");
    if (!container) return;
    if (!type) {
      container.innerHTML = "";
      return;
    }
    const info = programInfo(type);
    if (!info) {
      container.innerHTML = "";
      return;
    }
    const projects = state.projects
      .filter((project) => project.type === type)
      .sort((a, b) => String(b.openedAt || "").localeCompare(String(a.openedAt || "")));
    const projectIds = new Set(projects.map((project) => project.id));
    const active = projects.filter((project) => !["complete", "paused"].includes(project.stage)).length;
    const deadlines = state.deadlines.filter((deadline) => projectIds.has(deadline.projectId));
    const openDeadlines = deadlines.filter((deadline) => !deadline.done && daysUntil(deadline.date) >= 0);
    const hours = sumHours(state.timeEntries.filter((entry) => projectIds.has(entry.projectId)));
    container.innerHTML = `
      <div class="atom-program-page">
        <div class="atom-breadcrumb">
          <button class="ghost-button compact" data-view-jump="projects" type="button">← 返回项目组合</button>
          <span>/</span>
          <strong>${escapeHtml(info.title)}</strong>
        </div>

        <section class="atom-program-hero" style="--program-accent:${escapeAttr(info.accent)}">
          <div class="atom-program-stripe" aria-hidden="true"></div>
          <div class="atom-program-hero-body">
            <div class="atom-program-main">
              <div class="program-hero-icon">${escapeHtml(info.prefix)}</div>
              <div>
                <p class="atom-program-kicker">${escapeHtml(info.kicker)}</p>
                <h2>${escapeHtml(info.title)}</h2>
                <p>${escapeHtml(info.description)}</p>
              </div>
            </div>
            <div class="atom-program-actions">
              <button class="icon-button quiet" data-filter-program="${escapeAttr(type)}" type="button" aria-label="筛选项目">✎</button>
              <button class="primary-button small" data-new-program-project="${escapeAttr(type)}" type="button">+ 新建项目</button>
            </div>
            <div class="atom-program-metrics">
              <article><span>项目总数</span><strong>${projects.length}</strong></article>
              <article><span>活跃</span><strong class="forest">${active}</strong></article>
              <article><span>待办期限</span><strong class="${openDeadlines.length ? "signal" : ""}">${openDeadlines.length}</strong></article>
              <article><span>累计工时</span><strong>${hours.toFixed(1)}<small>h</small></strong></article>
            </div>
          </div>
        </section>

        <section class="atom-case-panel">
          <div class="atom-case-panel-head">
            <div>
              <p class="atom-program-kicker">Projects</p>
              <h3>项目列表</h3>
            </div>
            <span>按开启时间倒序</span>
          </div>
          ${projects.length ? programProjectTable(projects) : `
            <div class="atom-empty-panel">
              <strong>还没有项目</strong>
              <span>点击右上角「新建项目」开始第一个项目档案。</span>
            </div>
          `}
        </section>
      </div>
    `;
    if (currentView === "programDetail") setDetailTitle(info.title);
  }

  function programProjectTable(projects) {
    return `
      <div class="atom-table-scroll">
        <table class="atom-case-table">
          <thead>
            <tr>
              <th>项目号</th>
              <th>标题 / 类型</th>
              <th>状态</th>
              <th>下一期限</th>
              <th>风险</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map((project) => programProjectRow(project)).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function programProjectRow(project) {
    const nextDeadline = state.deadlines
      .filter((deadline) => deadline.projectId === project.id && deadline.date && daysUntil(deadline.date) >= 0)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
    const risk = programRiskTone(project);
    return `
      <tr>
        <td><button class="table-link atom-mono" data-open-project="${escapeAttr(project.id)}" type="button">${escapeHtml(project.projectNo)}</button></td>
        <td>
          <strong>${escapeHtml(project.name)}</strong>
          <small>${escapeHtml(typeLabel(project.type))}${project.client ? ` · ${escapeHtml(project.client)}` : ""}</small>
        </td>
        <td><span class="atom-status ${escapeAttr(project.stage)}">${stageLabel(project.stage)}</span></td>
        <td>
          ${nextDeadline ? `
            <strong class="${daysUntil(nextDeadline.date) <= 5 ? "signal" : ""}">${escapeHtml(relativeDay(nextDeadline.date))}</strong>
            <small>${escapeHtml(nextDeadline.kind || "节点")}：${escapeHtml(nextDeadline.title)}</small>
          ` : `<span class="muted-copy">—</span>`}
        </td>
        <td><span class="risk-dot ${escapeAttr(risk)}" title="${escapeAttr(healthLabel(project.health))}"></span></td>
        <td>
          <span class="table-actions">
            <button class="ghost-button compact" data-open-project="${escapeAttr(project.id)}" type="button">打开</button>
            <button class="ghost-button compact" data-edit-project="${escapeAttr(project.id)}" type="button">编辑</button>
            <button class="ghost-button compact danger-button" data-delete-project="${escapeAttr(project.id)}" type="button">删除</button>
          </span>
        </td>
      </tr>
    `;
  }

  function renderProjects() {
    const grid = document.getElementById("projectGrid");
    const list = filteredProjects();
    grid.innerHTML = list.length ? list.map(projectCard).join("") : "";
    if (!list.length) renderEmpty(grid);
  }

  function projectCard(project) {
    const rel = related(project.id);
    const nextDeadline = rel.deadlines.filter((deadline) => deadline.date).sort((a, b) => a.date.localeCompare(b.date))[0];
    const hours = sumHours(rel.timeEntries);
    return `
      <article class="project-card project-record-card">
        <header>
          <div>
            <span class="case-number">${escapeHtml(project.projectNo)}</span>
            <h3>${escapeHtml(project.name)}</h3>
          </div>
          <span class="badge ${escapeAttr(project.priority)}">${priorityLabel(project.priority)}</span>
        </header>
        <button class="project-card-body" data-open-project="${escapeAttr(project.id)}" type="button">
          <span class="project-card-copy">${escapeHtml(project.summary || "暂无项目说明。")}</span>
          <span class="progress"><span style="width:${project.progress}%"></span></span>
          <span class="meta-row">
            <span class="status">${typeLabel(project.type)}</span>
            <span class="status">${stageLabel(project.stage)}</span>
            <span class="status ${escapeAttr(project.health)}">${healthLabel(project.health)}</span>
            <span class="status">${escapeHtml(project.client || "未设客户")}</span>
          </span>
          <span class="project-card-footer">
            <span>${rel.tasks.filter((task) => task.status !== "done").length} 个未完成任务 · ${hours.toFixed(1)} h</span>
            <span>${nextDeadline ? `${relativeDay(nextDeadline.date)} · ${escapeHtml(nextDeadline.title)}` : "暂无关键节点"}</span>
          </span>
          <span class="project-next"><strong>下一步：</strong>${escapeHtml(project.next || "待补充")}</span>
        </button>
        <div class="record-actions">
          <button class="ghost-button compact" data-open-project="${escapeAttr(project.id)}" type="button">打开</button>
          <button class="ghost-button compact" data-edit-project="${escapeAttr(project.id)}" type="button">编辑</button>
          <button class="ghost-button compact danger-button" data-delete-project="${escapeAttr(project.id)}" type="button">删除</button>
        </div>
      </article>
    `;
  }

  function renderTasks() {
    const table = document.getElementById("taskTable");
    const tasks = filteredTasks().sort(sortTasks);
    table.innerHTML = tasks.map((task) => {
      const project = projectById(task.projectId);
      return `
        <tr>
          <td><input data-task-check="${escapeAttr(task.id)}" type="checkbox" ${task.status === "done" ? "checked" : ""}></td>
          <td><button class="table-link" data-open-task="${escapeAttr(task.id)}" type="button">${escapeHtml(task.title)}</button><br><span class="status">${statusLabel(task.status)}</span></td>
          <td><button class="table-link muted" data-open-project="${escapeAttr(project.id)}" type="button"><span class="case-number inline">${escapeHtml(project.projectNo)}</span><br>${escapeHtml(project.name)}</button></td>
          <td>${escapeHtml(task.owner || "—")}</td>
          <td>${escapeHtml(task.due || "未设定")}</td>
          <td><span class="badge ${escapeAttr(task.priority)}">${priorityLabel(task.priority)}</span></td>
          <td>
            <span class="table-actions">
              <button class="ghost-button compact" data-open-task="${escapeAttr(task.id)}" type="button">打开</button>
              <button class="ghost-button compact" data-edit-task="${escapeAttr(task.id)}" type="button">编辑</button>
              <button class="ghost-button compact danger-button" data-delete-task="${escapeAttr(task.id)}" type="button">删除</button>
            </span>
          </td>
        </tr>
      `;
    }).join("");
    if (!tasks.length) table.innerHTML = `<tr><td colspan="7">暂无任务。</td></tr>`;
  }

  function taskCard(task) {
    const project = projectById(task.projectId);
    return `
      <article class="task-card ${task.status === "done" ? "done" : ""}">
        <input data-task-check="${escapeAttr(task.id)}" type="checkbox" ${task.status === "done" ? "checked" : ""}>
        <button class="task-card-main" data-open-task="${escapeAttr(task.id)}" type="button">
          <strong>${escapeHtml(task.title)}</strong>
          <span>${escapeHtml(project.projectNo)} · ${escapeHtml(project.name)}</span>
          <span class="meta-row">
            <span class="status">${statusLabel(task.status)}</span>
            <span class="badge ${escapeAttr(task.priority)}">${priorityLabel(task.priority)}</span>
            <span>${relativeDay(task.due)}</span>
          </span>
        </button>
      </article>
    `;
  }

  function renderDeadlines() {
    const dash = document.getElementById("dashboardTimeline");
    const deadlines = filteredDeadlines()
      .filter((deadline) => deadline.date && daysUntil(deadline.date) >= -1)
      .sort((a, b) => a.date.localeCompare(b.date));
    dash.innerHTML = deadlines.slice(0, 8).map(deadlineRadarRow).join("");
    if (!deadlines.length) renderEmpty(dash);
  }

  function renderDeadlinesView() {
    const target = document.getElementById("deadlineList");
    if (!target) return;
    const deadlines = filteredDeadlines()
      .filter((deadline) => !deadline.done)
      .sort((a, b) => String(a.date || "9999-12-31").localeCompare(String(b.date || "9999-12-31")));
    target.innerHTML = deadlines.length ? deadlines.map(deadlineRadarRow).join("") : "";
    if (!deadlines.length) renderEmpty(target);
  }

  function deadlineRow(deadline) {
    const project = projectById(deadline.projectId);
    return `
      <button class="deadline-row clickable-row" data-open-deadline="${escapeAttr(deadline.id)}" type="button">
        <strong>${escapeHtml(deadline.title)}</strong>
        <span>${escapeHtml(deadline.date || "未设日期")} · ${relativeDay(deadline.date)}</span>
        <span class="meta-row">
          <span class="status">${escapeHtml(project.projectNo)}</span>
          <span class="status">${escapeHtml(deadline.kind || "节点")}</span>
          <span class="badge ${escapeAttr(deadline.risk)}">${priorityLabel(deadline.risk)}</span>
        </span>
      </button>
    `;
  }

  function renderDocuments() {
    const documents = filteredDocuments();
    const grid = document.getElementById("documentGrid");
    grid.innerHTML = documents.map((documentItem) => {
      const project = projectById(documentItem.projectId);
      return `
        <button class="document-card clickable-card" data-open-document="${escapeAttr(documentItem.id)}" type="button">
          <header>
            <div>
              <span class="case-number">${escapeHtml(project.projectNo)}</span>
              <h3>${escapeHtml(documentItem.title)}</h3>
            </div>
            <span class="badge">${escapeHtml(documentItem.type || "资料")}</span>
          </header>
          <p>${escapeHtml(documentItem.note || "")}</p>
          <p class="doc-path">${escapeHtml(documentItem.path || "未设置路径")}</p>
        </button>
      `;
    }).join("");
    if (!documents.length) renderEmpty(grid);
  }

  function renderObjectives() {
    const grid = document.getElementById("objectiveGrid");
    const objectives = state.objectives.filter((objective) => matches([objective.title, objective.owner, objective.quarter, objective.signal, projectById(objective.projectId).projectNo].join(" ")));
    grid.innerHTML = objectives.map(objectiveCard).join("");
    if (!objectives.length) renderEmpty(grid);
  }

  function objectiveCard(objective) {
    const project = projectById(objective.projectId);
    const keyResults = state.keyResults.filter((kr) => kr.objectiveId === objective.id);
    return `
      <button class="objective-card clickable-card" data-open-objective="${escapeAttr(objective.id)}" type="button">
        <header>
          <div>
            <span class="case-number">${escapeHtml(objective.quarter || "目标")}</span>
            <h3>${escapeHtml(objective.title)}</h3>
          </div>
          <span class="okr-score ${escapeAttr(objective.status)}">${objective.progress}%</span>
        </header>
        <p>${escapeHtml(objective.signal || "暂无目标信号。")}</p>
        <div class="progress large"><span style="width:${objective.progress}%"></span></div>
        <div class="linked-list mini">
          ${keyResults.slice(0, 3).map((kr) => `<span>${escapeHtml(kr.label)} · ${kr.progress}%</span>`).join("")}
        </div>
        <span class="muted-copy">${escapeHtml(project.projectNo)} · ${escapeHtml(project.name)} · ${escapeHtml(objective.owner || "未设负责人")}</span>
      </button>
    `;
  }

  function renderWorkload() {
    const timer = document.getElementById("timerWorkbench");
    const chart = document.getElementById("workloadChart");
    const table = document.getElementById("timeEntryTable");
    const rows = state.timeEntries
      .filter((entry) => matches([entry.description, entry.tags, projectById(entry.projectId).projectNo, projectById(entry.projectId).name].join(" ")))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const totals = state.projects.map((project) => ({ project, hours: sumHours(state.timeEntries.filter((entry) => entry.projectId === project.id)) })).filter((item) => item.hours > 0);
    const max = Math.max(1, ...totals.map((item) => item.hours));
    if (timer) timer.innerHTML = timerWorkbenchCard(rows, totals);
    chart.innerHTML = totals.length ? totals.map(({ project, hours }) => `
      <button class="workload-bar" data-open-project="${escapeAttr(project.id)}" type="button">
        <span><strong>${escapeHtml(project.projectNo)}</strong>${escapeHtml(project.name)}</span>
        <i style="width:${Math.max(8, (hours / max) * 100)}%"></i>
        <b>${hours.toFixed(1)} h</b>
      </button>
    `).join("") : `<p class="muted-copy">暂无投入记录。</p>`;
    table.innerHTML = rows.map((entry) => {
      const project = projectById(entry.projectId);
      return `
        <tr>
          <td>${escapeHtml(entry.date)}</td>
          <td><button class="table-link muted" data-open-project="${escapeAttr(project.id)}" type="button">${escapeHtml(project.projectNo)}</button></td>
          <td><button class="table-link" data-open-time="${escapeAttr(entry.id)}" type="button">${escapeHtml(entry.description || "未命名投入")}</button></td>
          <td>${Number(entry.hours || 0).toFixed(2)}</td>
          <td>${escapeHtml(entry.tags || "—")}</td>
        </tr>
      `;
    }).join("");
    if (!rows.length) table.innerHTML = `<tr><td colspan="5">暂无投入记录。</td></tr>`;
  }

  function timerWorkbenchCard(rows, totals) {
    const todayRows = rows.filter((entry) => entry.date === toIsoDate(today));
    const todayHours = sumHours(todayRows);
    const top = totals.slice().sort((a, b) => b.hours - a.hours)[0];
    const currentTask = state.tasks.filter((task) => task.status !== "done").sort(sortTasks)[0];
    return `
      <section class="timer-card">
        <div>
          <p class="section-kicker">Focus Timer</p>
          <h3>先选项目号，再记录投入</h3>
          <p>按项目号、任务和标签记录每一段投入，方便复盘交付成本和注意力分布。</p>
        </div>
        <div class="timer-readout">
          <strong>${todayHours.toFixed(1)} h</strong>
          <span>今日已记录</span>
        </div>
        <div class="timer-actions">
          <button class="primary-button small" data-add-related="time" data-project-id="${escapeAttr(top?.project?.id || state.projects[0]?.id || "")}" type="button">记录投入</button>
          ${currentTask ? `<button class="ghost-button compact" data-open-task="${escapeAttr(currentTask.id)}" type="button">继续当前任务</button>` : ""}
        </div>
      </section>
    `;
  }

  function renderActivity() {
    const feed = document.getElementById("activityFeed");
    if (!feed) return;
    const activities = sortedActivities().filter((activity) => matches([activity.title, activity.note, activity.actor, projectById(activity.projectId).projectNo].join(" ")));
    feed.innerHTML = activities.map(activityRow).join("");
    if (!activities.length) renderEmpty(feed);
  }

  function activityRow(activity) {
    const project = projectById(activity.projectId);
    return `
      <button class="activity-item" data-open-activity="${escapeAttr(activity.id)}" type="button">
        <span class="activity-dot ${escapeAttr(activity.action)}"></span>
        <span>
          <strong>${escapeHtml(activity.title)}</strong>
          <small>${escapeHtml(activity.date)} · ${escapeHtml(activity.actor)} · ${escapeHtml(project.projectNo || "全局")}</small>
          <em>${escapeHtml(activity.note || "")}</em>
        </span>
      </button>
    `;
  }

  function sortedActivities() {
    return [...state.activities].sort((a, b) => String(b.date).localeCompare(String(a.date)));
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
    const gridStart = addDays(first, -first.getDay());
    const cells = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
    return `
      <div class="calendar-weekdays">${["日", "一", "二", "三", "四", "五", "六"].map((day) => `<span>周${day}</span>`).join("")}</div>
      <div class="calendar-grid">${cells.map((date) => calendarCell(date, date.getMonth() === calendarAnchor.getMonth())).join("")}</div>
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
        <article class="agenda-day">
          <button class="agenda-date" data-open-day="${key}" type="button">
            <strong>${date.getDate()}</strong>
            <span>${formatLongDate(key)}</span>
          </button>
          <div class="agenda-events">
            ${events.length ? events.map(calendarEventRow).join("") : `<p class="muted-copy">当天没有任务或节点。</p>`}
          </div>
        </article>
      `;
    }).join("")}</div>`;
  }

  function calendarEventRow(event) {
    const project = projectById(event.projectId);
    return `
      <button class="agenda-event ${event.kind}" ${event.kind === "task" ? `data-open-task="${escapeAttr(event.id)}"` : `data-open-deadline="${escapeAttr(event.id)}"`} type="button">
        <strong>${escapeHtml(event.title)}</strong>
        <span>${escapeHtml(project.projectNo)} · ${escapeHtml(project.name)}</span>
      </button>
    `;
  }

  function eventsForDate(date) {
    const taskEvents = state.tasks
      .filter((task) => task.due === date)
      .map((task) => ({ ...task, kind: "task", date: task.due }));
    const deadlineEvents = state.deadlines
      .filter((deadline) => deadline.date === date)
      .map((deadline) => ({ ...deadline, kind: "deadline" }));
    return [...deadlineEvents, ...taskEvents];
  }

  function renderMap() {
    const target = document.getElementById("projectMap");
    const rows = state.projects.map((project, index) => {
      const rel = related(project.id);
      return { project, y: 78 + index * 120, rel };
    });
    const width = 1120;
    const height = Math.max(560, 90 + rows.length * 120);
    const projectX = 42;
    const taskX = 360;
    const targetX = 610;
    const resourceX = 850;
    target.innerHTML = `
      <svg class="relationship-map" viewBox="0 0 ${width} ${height}" role="img" aria-label="Pontnova 项目关系图谱">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L0,10 L10,5 z" fill="#51748c"></path>
          </marker>
        </defs>
        <text x="${projectX}" y="28" class="map-label">项目档案</text>
        <text x="${taskX}" y="28" class="map-label">任务</text>
        <text x="${targetX}" y="28" class="map-label">目标 / 节点</text>
        <text x="${resourceX}" y="28" class="map-label">资料 / 投入</text>
        ${rows.map(({ project, y }) => `
          <path class="map-link" d="M${projectX + 230},${y} C${projectX + 282},${y} ${taskX - 48},${y} ${taskX},${y}" marker-end="url(#arrow)"></path>
          <path class="map-link" d="M${taskX + 160},${y} C${taskX + 212},${y} ${targetX - 48},${y} ${targetX},${y}" marker-end="url(#arrow)"></path>
          <path class="map-link" d="M${targetX + 170},${y} C${targetX + 222},${y} ${resourceX - 48},${y} ${resourceX},${y}" marker-end="url(#arrow)"></path>
          <g class="map-node project-node" data-open-project="${escapeAttr(project.id)}" tabindex="0" role="button">
            <rect x="${projectX}" y="${y - 38}" width="230" height="76" rx="8"></rect>
            <text x="${projectX + 14}" y="${y - 14}" class="map-title">${escapeSvg(project.projectNo)}</text>
            <text x="${projectX + 14}" y="${y + 8}" class="map-meta">${escapeSvg(project.name).slice(0, 26)}</text>
            <text x="${projectX + 14}" y="${y + 28}" class="map-meta">${typeLabel(project.type)} · ${stageLabel(project.stage)} · ${healthLabel(project.health)}</text>
          </g>
        `).join("")}
        ${rows.map(({ y, rel }) => mapPill(taskX, y, `${rel.tasks.filter((task) => task.status !== "done").length}`, "未完成任务")).join("")}
        ${rows.map(({ y, rel }) => mapPill(targetX, y, `${rel.objectives.length} / ${rel.deadlines.length}`, "目标 / 节点")).join("")}
        ${rows.map(({ y, rel }) => mapPill(resourceX, y, `${rel.documents.length} / ${sumHours(rel.timeEntries).toFixed(1)}h`, "资料 / 投入")).join("")}
      </svg>
    `;
  }

  function mapPill(x, y, value, label) {
    return `
      <g class="map-node stat-node">
        <rect x="${x}" y="${y - 31}" width="170" height="62" rx="8"></rect>
        <text x="${x + 14}" y="${y - 4}" class="map-title">${escapeSvg(value)}</text>
        <text x="${x + 14}" y="${y + 16}" class="map-meta">${escapeSvg(label)}</text>
      </g>
    `;
  }

  function setView(view) {
    currentView = view;
    if (view !== "programDetail") activeProgramType = "";
    if (!["projectDetail", "taskDetail"].includes(view)) {
      activeDetail = null;
      delete document.body.dataset.detailKind;
      delete document.body.dataset.detailId;
    }
    document.body.dataset.view = view;
    Object.entries(views).forEach(([name, element]) => element?.classList.toggle("is-active", name === view));
    const navView = view === "projectDetail" || view === "programDetail" ? "projects" : view === "taskDetail" ? "tasks" : view;
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.view === navView));
    document.getElementById("viewTitle").textContent = titles[view];
    if (["projectDetail", "taskDetail"].includes(view)) restoreDetailTitle();
    window.scrollTo({ top: 0, behavior: "auto" });
    if (view === "dashboard") renderDashboard();
    if (view === "programDetail") renderProgramDetailPage(activeProgramType);
    if (view === "deadlines") renderDeadlinesView();
    if (view === "calendar") renderCalendar();
    if (view === "map") renderMap();
  }

  function openDialog(kind, defaults = {}) {
    const dialog = document.getElementById("entryDialog");
    const form = document.getElementById("entryForm");
    const fields = document.getElementById("formFields");
    form.dataset.kind = kind;
    form.dataset.mode = "create";
    form.dataset.editId = "";
    form.dataset.projectId = defaults.projectId || "";
    document.getElementById("saveEntryButton").textContent = "保存";
    document.getElementById("dialogTitle").textContent = {
      project: "新增项目档案",
      task: "新增任务",
      deadline: "新增节点",
      document: "新增资料",
      objective: "新增目标",
      time: "新增投入",
      activity: "新增动态"
    }[kind];
    document.getElementById("dialogKicker").textContent = defaults.projectId ? projectById(defaults.projectId).projectNo : "Pontnova";
    fields.innerHTML = formFor(kind, defaults);
    dialog.showModal();
  }

  function openEditDialog(kind, id) {
    const item = kind === "project"
      ? state.projects.find((project) => project.id === id)
      : state.tasks.find((task) => task.id === id);
    if (!item) return;
    const dialog = document.getElementById("entryDialog");
    const form = document.getElementById("entryForm");
    const fields = document.getElementById("formFields");
    form.dataset.kind = kind;
    form.dataset.mode = "edit";
    form.dataset.editId = id;
    form.dataset.projectId = item.projectId || id;
    document.getElementById("dialogTitle").textContent = kind === "project" ? "编辑项目档案" : "编辑任务";
    document.getElementById("dialogKicker").textContent = kind === "project" ? item.projectNo : projectById(item.projectId).projectNo;
    document.getElementById("saveEntryButton").textContent = kind === "project" ? "保存项目" : "保存任务";
    fields.innerHTML = formFor(kind, item);
    dialog.showModal();
  }

  function closeEntryDialog() {
    const dialog = document.getElementById("entryDialog");
    const form = document.getElementById("entryForm");
    if (dialog.open) dialog.close("cancel");
    form.reset();
    form.dataset.mode = "create";
    form.dataset.editId = "";
    document.getElementById("saveEntryButton").textContent = "保存";
    restoreDetailTitle();
    window.setTimeout(restoreDetailTitle, 0);
  }

  function formFor(kind, defaults) {
    if (kind === "project") return `
      ${field("projectNo", "项目号", "text", defaults.projectNo || nextProjectNo(defaults.type || "consulting"))}
      ${field("name", "项目名称", "text", defaults.name || "", true)}
      ${selectField("type", "业务线", typeOptions.map(([value, label]) => [value, label]), defaults.type || "consulting")}
      ${selectField("stage", "状态", stageOptions, defaults.stage || "planning")}
      ${selectField("priority", "优先级", [["high", "高"], ["medium", "中"], ["low", "低"]], defaults.priority || "medium")}
      ${selectField("health", "健康度", healthOptions, defaults.health || "on_track")}
      ${field("progress", "进度", "number", defaults.progress ?? "0")}
      ${field("client", "客户 / 委托方", "text", defaults.client || "")}
      ${field("contact", "客户联系人", "text", defaults.contact || "")}
      ${field("owner", "负责人", "text", defaults.owner || "Pontnova")}
      ${field("openedAt", "开启日期", "date", defaults.openedAt || toIsoDate(today))}
      ${field("dueDate", "目标完成日", "date", defaults.dueDate || "")}
      ${field("budget", "项目包 / 预算", "text", defaults.budget || "", false, "full")}
      ${textareaField("goal", "项目目标", defaults.goal || "")}
      ${textareaField("summary", "项目说明", defaults.summary || "")}
      ${field("next", "下一步", "text", defaults.next || "", false, "full")}
    `;
    if (kind === "task") return `
      ${selectField("projectId", "项目", projectOptions(), defaults.projectId)}
      ${field("title", "任务", "text", defaults.title || "", true, "full")}
      ${field("owner", "负责人", "text", defaults.owner || "Pontnova")}
      ${field("due", "截止日期", "date", defaults.due || "")}
      ${selectField("priority", "优先级", [["high", "高"], ["medium", "中"], ["low", "低"]], defaults.priority || "medium")}
      ${selectField("status", "状态", [["next", "下一步"], ["in_progress", "进行中"], ["waiting", "等待"], ["done", "完成"]], defaults.status || "next")}
      ${textareaField("notes", "备注", defaults.notes || "")}
    `;
    if (kind === "deadline") return `
      ${selectField("projectId", "项目", projectOptions(), defaults.projectId)}
      ${field("title", "节点名称", "text", "", true)}
      ${field("date", "日期", "date", "")}
      ${field("kind", "类型", "text", "交付")}
      ${selectField("risk", "风险", [["high", "高"], ["medium", "中"], ["low", "低"]], "medium")}
    `;
    if (kind === "document") return `
      ${selectField("projectId", "项目", projectOptions(), defaults.projectId)}
      ${field("title", "资料名称", "text", "", true)}
      ${field("type", "类型", "text", "note")}
      ${field("path", "Dropbox 路径 / 链接", "text", "", false, "full")}
      ${textareaField("note", "备注", "")}
    `;
    if (kind === "objective") return `
      ${selectField("projectId", "关联项目", [["", "全局目标"], ...projectOptions()], defaults.projectId || "")}
      ${field("title", "目标", "text", "", true, "full")}
      ${field("owner", "负责人", "text", "Pontnova")}
      ${field("quarter", "季度", "text", "2026 Q2")}
      ${field("progress", "进度", "number", "0")}
      ${selectField("status", "状态", objectiveStatusOptions, "on_track")}
      ${textareaField("signal", "目标信号", "")}
    `;
    if (kind === "time") return `
      ${selectField("projectId", "项目", projectOptions(), defaults.projectId)}
      ${selectField("taskId", "任务", [["", "不关联任务"], ...taskOptions(defaults.projectId)], defaults.taskId || "")}
      ${field("description", "投入内容", "text", "", true, "full")}
      ${field("date", "日期", "date", toIsoDate(today))}
      ${field("hours", "小时", "number", "1")}
      ${field("tags", "标签", "text", "")}
    `;
    return `
      ${selectField("projectId", "关联项目", [["", "全局动态"], ...projectOptions()], defaults.projectId || "")}
      ${field("title", "动态标题", "text", "", true, "full")}
      ${field("actor", "记录人", "text", "Pontnova")}
      ${field("date", "日期", "date", toIsoDate(today))}
      ${selectField("entity", "对象", [["Project", "项目"], ["Task", "任务"], ["Deadline", "节点"], ["Document", "资料"], ["Objective", "目标"], ["TimeEntry", "投入"]], "Project")}
      ${selectField("action", "动作", [["create", "新增"], ["update", "更新"], ["complete", "完成"], ["review", "复核"], ["note", "备注"]], "update")}
      ${textareaField("note", "说明", "")}
    `;
  }

  function field(name, label, type, value = "", required = false, klass = "") {
    return `<div class="form-field ${klass}"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${escapeAttr(value)}" ${required ? "required" : ""}></div>`;
  }

  function textareaField(name, label, value = "") {
    return `<div class="form-field full"><label for="${name}">${label}</label><textarea id="${name}" name="${name}">${escapeHtml(value)}</textarea></div>`;
  }

  function selectField(name, label, options, selected = "") {
    return `<div class="form-field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map(([value, labelText]) => `<option value="${escapeAttr(value)}" ${String(value) === String(selected) ? "selected" : ""}>${escapeHtml(labelText)}</option>`).join("")}</select></div>`;
  }

  function handleCreate(kind, form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const id = `${kind}-${Date.now()}`;
    if (kind === "project") {
      const project = normalizeState({ projects: [{ id, ...data }], tasks: [], deadlines: [], documents: [], objectives: [], keyResults: [], timeEntries: [], activities: [] }).projects[0];
      state.projects.unshift(project);
      trackActivity({ projectId: project.id, entity: "Project", entityId: project.id, action: "create", title: `新增项目档案 ${project.projectNo}`, note: project.name });
    }
    if (kind === "task") {
      state.tasks.unshift({ id, projectId: data.projectId, title: data.title, owner: data.owner, due: data.due, priority: data.priority, status: data.status, notes: data.notes });
      trackActivity({ projectId: data.projectId, entity: "Task", entityId: id, action: "create", title: `新增任务：${data.title}` });
    }
    if (kind === "deadline") {
      state.deadlines.unshift({ id, projectId: data.projectId, title: data.title, date: data.date, kind: data.kind, risk: data.risk });
      trackActivity({ projectId: data.projectId, entity: "Deadline", entityId: id, action: "create", title: `新增节点：${data.title}` });
    }
    if (kind === "document") {
      state.documents.unshift({ id, projectId: data.projectId, title: data.title, type: data.type, path: data.path, note: data.note });
      trackActivity({ projectId: data.projectId, entity: "Document", entityId: id, action: "create", title: `新增资料：${data.title}` });
    }
    if (kind === "objective") {
      state.objectives.unshift({ id, projectId: data.projectId, title: data.title, owner: data.owner, quarter: data.quarter, progress: clamp(Number(data.progress) || 0, 0, 100), status: data.status, signal: data.signal });
      trackActivity({ projectId: data.projectId, entity: "Objective", entityId: id, action: "create", title: `新增目标：${data.title}` });
    }
    if (kind === "time") {
      state.timeEntries.unshift({ id, projectId: data.projectId, taskId: data.taskId, description: data.description, date: data.date, hours: Number(data.hours) || 0, billable: true, tags: data.tags });
      trackActivity({ projectId: data.projectId, entity: "TimeEntry", entityId: id, action: "create", title: `记录投入：${data.description}` });
    }
    if (kind === "activity") {
      state.activities.unshift({ id, projectId: data.projectId, entity: data.entity, entityId: data.projectId, action: data.action, title: data.title, actor: data.actor, date: data.date, note: data.note });
    }
    replaceState(state);
    saveState();
    renderAll();
  }

  function handleEdit(kind, id, form) {
    const data = Object.fromEntries(new FormData(form).entries());
    if (kind === "project") {
      const project = state.projects.find((item) => item.id === id);
      if (!project) return;
      project.projectNo = text(data.projectNo) || project.projectNo;
      project.name = text(data.name) || project.name;
      project.type = choice(data.type, typeOptions.map(([value]) => value), project.type);
      project.stage = choice(data.stage, stageOptions.map(([value]) => value), project.stage);
      project.priority = choice(data.priority, ["high", "medium", "low"], project.priority);
      project.health = choice(data.health, healthOptions.map(([value]) => value), project.health);
      project.progress = clamp(Number(data.progress) || 0, 0, 100);
      project.client = text(data.client);
      project.contact = text(data.contact);
      project.owner = text(data.owner);
      project.openedAt = validDate(data.openedAt);
      project.dueDate = validDate(data.dueDate);
      project.budget = text(data.budget);
      project.goal = text(data.goal);
      project.summary = text(data.summary);
      project.next = text(data.next);
      trackActivity({ projectId: project.id, entity: "Project", entityId: project.id, action: "update", title: `更新项目档案 ${project.projectNo}`, note: project.name });
    }
    if (kind === "task") {
      const task = state.tasks.find((item) => item.id === id);
      if (!task) return;
      task.projectId = data.projectId || task.projectId;
      task.title = text(data.title) || task.title;
      task.owner = text(data.owner);
      task.due = validDate(data.due);
      task.priority = choice(data.priority, ["high", "medium", "low"], task.priority);
      task.status = choice(data.status, ["next", "in_progress", "waiting", "done"], task.status);
      task.notes = text(data.notes);
      trackActivity({ projectId: task.projectId, entity: "Task", entityId: task.id, action: task.status === "done" ? "complete" : "update", title: `更新任务：${task.title}` });
    }
    replaceState(state);
    saveState();
    renderAll();
  }

  function openProject(id) {
    const project = state.projects.find((item) => item.id === id);
    if (!project) return;
    closeDrawerIfOpen();
    activeDetail = { kind: "project", id };
    document.body.dataset.detailKind = "project";
    document.body.dataset.detailId = id;
    renderProjectDetailPage(id);
    setView("projectDetail");
    setDetailTitle(project.projectNo, project.name);
  }

  function renderProjectDetailPage(id) {
    const project = state.projects.find((item) => item.id === id);
    const container = document.getElementById("projectDetailPage");
    if (!project || !container) {
      activeDetail = null;
      setView("projects");
      return;
    }
    const rel = related(id);
    const openTasks = rel.tasks.filter((task) => task.status !== "done");
    const upcomingDeadlines = rel.deadlines.filter((deadline) => daysUntil(deadline.date) >= 0).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const info = programInfo(project.type);
    container.innerHTML = `
      <div class="detail-page">
        <div class="atom-breadcrumb">
          <button class="ghost-button compact" data-open-program="${escapeAttr(project.type)}" type="button">← 返回 ${escapeHtml(info.title)}</button>
          <span>/</span>
          <strong class="atom-mono">${escapeHtml(project.projectNo)}</strong>
        </div>

        <section class="atom-program-hero atom-record-hero" style="--program-accent:${escapeAttr(info.accent)}">
          <div class="atom-program-stripe" aria-hidden="true"></div>
          <div class="atom-program-hero-body">
            <div class="atom-record-head">
              <div class="atom-program-main">
                <div class="program-hero-icon">${escapeHtml(info.prefix)}</div>
                <div>
                  <p class="atom-program-kicker">${escapeHtml(project.projectNo)} · ${escapeHtml(typeLabel(project.type))}</p>
                  <h2>${escapeHtml(project.name)}</h2>
                  <p>${escapeHtml(project.summary || "暂无项目说明。")}</p>
                  <div class="atom-record-badges">
                    <span class="atom-status ${escapeAttr(project.stage)}">${stageLabel(project.stage)}</span>
                    <span class="atom-status ${escapeAttr(project.health)}">${healthLabel(project.health)}</span>
                    <span>${priorityLabel(project.priority)}优先级</span>
                    ${project.client ? `<span>客户 ${escapeHtml(project.client)}</span>` : ""}
                  </div>
                </div>
              </div>
              <div class="atom-program-actions">
                <button class="ghost-button compact" data-add-related="task" data-project-id="${escapeAttr(id)}" type="button">新增任务</button>
                <button class="ghost-button compact" data-add-related="deadline" data-project-id="${escapeAttr(id)}" type="button">新增节点</button>
                <button class="primary-button small" data-edit-project="${escapeAttr(id)}" type="button">编辑项目</button>
                <button class="ghost-button compact danger-button" data-delete-project="${escapeAttr(id)}" type="button">删除项目</button>
              </div>
            </div>
            <div class="atom-program-metrics">
              <article><span>任务</span><strong>${openTasks.length}<small>/ ${rel.tasks.length}</small></strong></article>
              <article><span>期限</span><strong>${upcomingDeadlines.length}<small>/ ${rel.deadlines.length}</small></strong></article>
              <article><span>资料</span><strong>${rel.documents.length}</strong></article>
              <article><span>工时</span><strong>${sumHours(rel.timeEntries).toFixed(1)}<small>h</small></strong></article>
            </div>
          </div>
        </section>

        <div class="project-workspace">
          ${projectTasksPanel(rel.tasks.sort(sortTasks), id)}
          ${projectBriefPanel(project)}
        </div>

        <div class="project-section-grid">
          ${projectDeadlinesPanel(upcomingDeadlines, id)}
          ${projectDocumentsPanel(rel.documents, id)}
          ${projectObjectivesPanel(rel.objectives, id)}
          ${projectTimePanel(rel.timeEntries, id)}
        </div>
      </div>
    `;
    if (currentView === "projectDetail") setDetailTitle(project.projectNo, project.name);
  }

  function projectTasksPanel(tasks, projectId) {
    const openCount = tasks.filter((task) => task.status !== "done").length;
    return `
      <section class="project-panel project-panel-primary">
        <div class="project-panel-head">
          <div>
            <p class="atom-program-kicker">Tasks</p>
            <h3>任务推进</h3>
            <span>${openCount} 个未完成 · 按状态和期限排序</span>
          </div>
          <button class="primary-button small" data-add-related="task" data-project-id="${escapeAttr(projectId)}" type="button">新增任务</button>
        </div>
        <div class="project-task-list">
          ${tasks.length ? tasks.map((task) => projectTaskRow(task)).join("") : `<p class="muted-copy">暂无任务。先新增一个可执行动作。</p>`}
        </div>
      </section>
    `;
  }

  function projectTaskRow(task) {
    return `
      <article class="project-task-row">
        <button class="project-row-open" data-open-task="${escapeAttr(task.id)}" type="button">
          <span class="task-main">
            <strong>${escapeHtml(task.title)}</strong>
            <small>${escapeHtml(task.notes || "暂无备注。")}</small>
          </span>
          <span class="task-meta">
            <span class="atom-status ${escapeAttr(task.status)}">${statusLabel(task.status)}</span>
            <span class="due-pill ${daysUntil(task.due) <= 3 ? "urgent" : ""}">${escapeHtml(relativeDay(task.due))}</span>
            <span>${priorityLabel(task.priority)}</span>
          </span>
        </button>
        <div class="project-row-actions">
          <button class="ghost-button compact" data-open-task="${escapeAttr(task.id)}" type="button">打开</button>
          <button class="ghost-button compact" data-edit-task="${escapeAttr(task.id)}" type="button">编辑</button>
          <button class="ghost-button compact danger-button" data-delete-task="${escapeAttr(task.id)}" type="button">删除</button>
        </div>
      </article>
    `;
  }

  function projectBriefPanel(project) {
    return `
      <aside class="project-panel project-brief-panel">
        <div class="project-panel-head compact">
          <div>
            <p class="atom-program-kicker">Project Brief</p>
            <h3>项目摘要</h3>
          </div>
          <button class="ghost-button compact" data-edit-project="${escapeAttr(project.id)}" type="button">编辑</button>
        </div>
        <div class="brief-progress">
          <span>进度</span>
          <strong>${project.progress}%</strong>
          <div class="progress large"><span style="width:${project.progress}%"></span></div>
        </div>
        <div class="project-brief-grid">
          ${briefItem("负责人", project.owner || "未设置")}
          ${briefItem("客户", project.client || "未设置")}
          ${briefItem("联系人", project.contact || "未设置")}
          ${briefItem("目标日", project.dueDate || "未设置")}
          ${briefItem("项目包", project.budget || "未设置", "full")}
          ${briefItem("项目目标", project.goal || "暂无项目目标。", "full")}
          ${briefItem("下一步", project.next || "暂无下一步。", "full highlight")}
        </div>
      </aside>
    `;
  }

  function briefItem(label, value, klass = "") {
    return `
      <article class="brief-item ${klass}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value || "—")}</strong>
      </article>
    `;
  }

  function projectDeadlinesPanel(deadlines, projectId) {
    return `
      <section class="project-panel">
        <div class="project-panel-head">
          <div>
            <p class="atom-program-kicker">Deadlines</p>
            <h3>关键节点</h3>
          </div>
          <button class="ghost-button compact" data-add-related="deadline" data-project-id="${escapeAttr(projectId)}" type="button">新增节点</button>
        </div>
        <div class="project-list">
          ${deadlines.length ? deadlines.map((deadline) => `
            <button class="project-list-row" data-open-deadline="${escapeAttr(deadline.id)}" type="button">
              <span>
                <strong>${escapeHtml(deadline.title)}</strong>
                <small>${escapeHtml(deadline.kind || "节点")} · ${escapeHtml(deadline.date || "未设日期")}</small>
              </span>
              <span class="due-pill ${daysUntil(deadline.date) <= 3 ? "urgent" : ""}">${escapeHtml(relativeDay(deadline.date))}</span>
            </button>
          `).join("") : `<p class="muted-copy">暂无关键节点。</p>`}
        </div>
      </section>
    `;
  }

  function projectDocumentsPanel(documents, projectId) {
    return `
      <section class="project-panel">
        <div class="project-panel-head">
          <div>
            <p class="atom-program-kicker">Documents</p>
            <h3>资料</h3>
          </div>
          <button class="ghost-button compact" data-add-related="document" data-project-id="${escapeAttr(projectId)}" type="button">新增资料</button>
        </div>
        <div class="project-list">
          ${documents.length ? documents.map((documentItem) => `
            <button class="project-list-row" data-open-document="${escapeAttr(documentItem.id)}" type="button">
              <span>
                <strong>${escapeHtml(documentItem.title)}</strong>
                <small>${escapeHtml(documentItem.type || "资料")} · ${escapeHtml(documentItem.note || documentItem.path || "未补充说明")}</small>
              </span>
              <span class="row-arrow">›</span>
            </button>
          `).join("") : `<p class="muted-copy">暂无资料。</p>`}
        </div>
      </section>
    `;
  }

  function projectObjectivesPanel(objectives, projectId) {
    return `
      <section class="project-panel">
        <div class="project-panel-head">
          <div>
            <p class="atom-program-kicker">OKR</p>
            <h3>目标</h3>
          </div>
          <button class="ghost-button compact" data-add-related="objective" data-project-id="${escapeAttr(projectId)}" type="button">新增目标</button>
        </div>
        <div class="project-list">
          ${objectives.length ? objectives.map((objective) => `
            <button class="project-list-row objective-row" data-open-objective="${escapeAttr(objective.id)}" type="button">
              <span>
                <strong>${escapeHtml(objective.title)}</strong>
                <small>${escapeHtml(objective.quarter || "目标")} · ${escapeHtml(objective.signal || "暂无信号")}</small>
              </span>
              <span class="okr-score ${escapeAttr(objective.status)}">${objective.progress}%</span>
            </button>
          `).join("") : `<p class="muted-copy">暂无目标。</p>`}
        </div>
      </section>
    `;
  }

  function projectTimePanel(entries, projectId) {
    const total = sumHours(entries);
    return `
      <section class="project-panel project-time-panel">
        <div class="project-panel-head">
          <div>
            <p class="atom-program-kicker">Time</p>
            <h3>投入记录</h3>
            <span>累计 ${total.toFixed(1)} h · 最近 ${Math.min(entries.length, 6)} 条</span>
          </div>
          <button class="ghost-button compact" data-add-related="time" data-project-id="${escapeAttr(projectId)}" type="button">记录投入</button>
        </div>
        <div class="project-list">
          ${entries.length ? entries.slice(0, 6).map((entry) => `
            <button class="project-list-row" data-open-time="${escapeAttr(entry.id)}" type="button">
              <span>
                <strong>${escapeHtml(entry.description || "投入记录")}</strong>
                <small>${escapeHtml(entry.date)} · ${escapeHtml(entry.tags || "未设标签")}</small>
              </span>
              <span>${Number(entry.hours || 0).toFixed(1)} h</span>
            </button>
          `).join("") : `<p class="muted-copy">暂无投入记录。</p>`}
        </div>
      </section>
    `;
  }

  function readField(label, value, klass = "") {
    return `
      <article class="read-field ${klass}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value || "—")}</strong>
      </article>
    `;
  }

  function linkedList(title, items, kind) {
    return `
      <section class="drawer-section">
        <h3>${title}</h3>
        <div class="linked-list">
          ${items.length ? items.map((item) => `
            <button class="linked-item" data-open-${kind}="${escapeAttr(item.id)}" type="button">
              <span>
                <strong>${escapeHtml(item.title || item.name)}</strong>
                <span>${escapeHtml(item.date || item.due || item.type || item.quarter || item.kind || "")}</span>
              </span>
              <span>${kind === "objective" ? `${item.progress}%` : "打开"}</span>
            </button>
          `).join("") : `<p class="muted-copy">暂无${title}。</p>`}
        </div>
      </section>
    `;
  }

  function timeList(items) {
    return `
      <section class="drawer-section">
        <h3>投入</h3>
        <div class="linked-list">
          ${items.length ? items.slice(0, 6).map((item) => `
            <button class="linked-item" data-open-time="${escapeAttr(item.id)}" type="button">
              <span><strong>${escapeHtml(item.description || "投入记录")}</strong><span>${escapeHtml(item.date)} · ${escapeHtml(item.tags || "")}</span></span>
              <span>${Number(item.hours || 0).toFixed(1)} h</span>
            </button>
          `).join("") : `<p class="muted-copy">暂无投入记录。</p>`}
        </div>
      </section>
    `;
  }

  function openTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    closeDrawerIfOpen();
    activeDetail = { kind: "task", id };
    document.body.dataset.detailKind = "task";
    document.body.dataset.detailId = id;
    renderTaskDetailPage(id);
    setView("taskDetail");
    setDetailTitle("任务", task.title);
  }

  function renderTaskDetailPage(id) {
    const task = state.tasks.find((item) => item.id === id);
    const container = document.getElementById("taskDetailPage");
    if (!task || !container) {
      activeDetail = null;
      setView("tasks");
      return;
    }
    const project = projectById(task.projectId);
    const taskTime = state.timeEntries.filter((entry) => entry.taskId === task.id);
    const taskActivities = state.activities.filter((activity) => activity.entityId === task.id || activity.title.includes(task.title)).slice(0, 8);
    container.innerHTML = `
      <div class="detail-page">
        <div class="detail-toolbar">
          <button class="ghost-button compact" data-open-project="${escapeAttr(project.id)}" type="button">← 返回 ${escapeHtml(project.projectNo)}</button>
          <div class="detail-actions">
            <button class="ghost-button compact" data-view-jump="tasks" type="button">任务清单</button>
            <button class="ghost-button compact" data-add-related="time" data-project-id="${escapeAttr(project.id)}" type="button">记录投入</button>
            <button class="primary-button small" data-edit-task="${escapeAttr(task.id)}" type="button">编辑任务</button>
            <button class="ghost-button compact danger-button" data-delete-task="${escapeAttr(task.id)}" type="button">删除任务</button>
          </div>
        </div>

        <section class="detail-hero detail-page-hero">
          <div>
            <span class="case-number">${escapeHtml(project.projectNo)}</span>
            <h2>${escapeHtml(task.title)}</h2>
            <p>${escapeHtml(task.notes || project.name)}</p>
          </div>
          <span class="badge ${escapeAttr(task.priority)}">${priorityLabel(task.priority)}</span>
          <div class="meta-row">
            <span class="status">${statusLabel(task.status)}</span>
            <span class="status">${relativeDay(task.due)}</span>
            <span class="status">${escapeHtml(task.owner || "未设负责人")}</span>
          </div>
        </section>

        <section class="detail-metrics">
          <article class="metric"><span>状态</span><strong>${statusLabel(task.status)}</strong><small>${task.status === "done" ? "已完成" : "待推进"}</small></article>
          <article class="metric"><span>截止</span><strong>${escapeHtml(relativeDay(task.due))}</strong><small>${escapeHtml(task.due || "未设日期")}</small></article>
          <article class="metric"><span>优先级</span><strong>${priorityLabel(task.priority)}</strong><small>任务权重</small></article>
          <article class="metric"><span>投入</span><strong>${sumHours(taskTime).toFixed(1)} h</strong><small>${taskTime.length} 条记录</small></article>
        </section>

        <section class="detail-section">
          <div class="section-title-row">
            <div>
              <p class="eyebrow">Task Fields</p>
              <h3>固定任务内容</h3>
            </div>
            <span class="status">${escapeHtml(project.projectNo)}</span>
          </div>
          <div class="read-grid">
            ${readField("任务", task.title, "full")}
            ${readField("项目", `${project.projectNo} · ${project.name}`, "full")}
            ${readField("负责人", task.owner || "未设置")}
            ${readField("截止日期", task.due || "未设置")}
            ${readField("状态", statusLabel(task.status))}
            ${readField("优先级", priorityLabel(task.priority))}
            ${readField("备注", task.notes || "暂无备注。", "full")}
          </div>
        </section>

        <div class="detail-columns">
          ${timeList(taskTime)}
          ${activityList("任务动态", taskActivities)}
        </div>
      </div>
    `;
    if (currentView === "taskDetail") setDetailTitle("任务", task.title);
  }

  function activityList(title, items) {
    return `
      <section class="drawer-section">
        <h3>${title}</h3>
        <div class="linked-list">
          ${items.length ? items.map((item) => `
            <button class="linked-item" data-open-activity="${escapeAttr(item.id)}" type="button">
              <span><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.date)} · ${escapeHtml(item.actor || "Pontnova")}</span></span>
              <span>打开</span>
            </button>
          `).join("") : `<p class="muted-copy">暂无${title}。</p>`}
        </div>
      </section>
    `;
  }

  function openDeadline(id) {
    const deadline = state.deadlines.find((item) => item.id === id);
    if (!deadline) return;
    const project = projectById(deadline.projectId);
    activeDrawer = { kind: "deadline", id };
    setDrawer("关键节点", deadline.title, `
      <section class="detail-hero">
        <span class="case-number">${escapeHtml(project.projectNo)}</span>
        <h3>${escapeHtml(deadline.title)}</h3>
        <p>${escapeHtml(deadline.date || "未设日期")} · ${relativeDay(deadline.date)}</p>
      </section>
      <section class="drawer-section">
        <div class="form-grid">
          ${field("drawerDeadlineTitle", "节点名称", "text", deadline.title, true, "full")}
          ${selectField("drawerDeadlineProject", "项目", projectOptions(), deadline.projectId)}
          ${field("drawerDeadlineKind", "类型", "text", deadline.kind || "")}
          ${field("drawerDeadlineDate", "日期", "date", deadline.date || "")}
          ${selectField("drawerDeadlineRisk", "风险", [["high", "高"], ["medium", "中"], ["low", "低"]], deadline.risk)}
        </div>
        <div class="drawer-actions">
          <button class="ghost-button" data-open-project="${escapeAttr(project.id)}" type="button">打开项目</button>
          <button class="primary-button small" data-save-deadline="${escapeAttr(deadline.id)}" type="button">保存节点</button>
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
      <section class="detail-hero">
        <span class="case-number">${escapeHtml(project.projectNo)}</span>
        <h3>${escapeHtml(documentItem.title)}</h3>
        <p>${escapeHtml(documentItem.note || "暂无备注。")}</p>
      </section>
      <section class="drawer-section">
        <div class="form-grid">
          ${field("drawerDocumentTitle", "资料名称", "text", documentItem.title, true, "full")}
          ${selectField("drawerDocumentProject", "项目", projectOptions(), documentItem.projectId)}
          ${field("drawerDocumentType", "类型", "text", documentItem.type || "")}
          ${field("drawerDocumentPath", "路径 / 链接", "text", documentItem.path || "", false, "full")}
          ${textareaField("drawerDocumentNote", "备注", documentItem.note || "")}
        </div>
        <div class="drawer-actions">
          <button class="ghost-button" data-open-project="${escapeAttr(project.id)}" type="button">打开项目</button>
          <button class="primary-button small" data-save-document="${escapeAttr(documentItem.id)}" type="button">保存资料</button>
        </div>
      </section>
    `);
  }

  function openObjective(id) {
    const objective = state.objectives.find((item) => item.id === id);
    if (!objective) return;
    const project = projectById(objective.projectId);
    const keyResults = state.keyResults.filter((kr) => kr.objectiveId === id);
    activeDrawer = { kind: "objective", id };
    setDrawer("OKR / 目标", objective.title, `
      <section class="detail-hero">
        <span class="case-number">${escapeHtml(objective.quarter)}</span>
        <h3>${escapeHtml(objective.title)}</h3>
        <p>${escapeHtml(objective.signal || "暂无目标信号。")}</p>
        <div class="progress large"><span style="width:${objective.progress}%"></span></div>
      </section>
      <section class="drawer-section">
        <div class="form-grid">
          ${field("drawerObjectiveTitle", "目标", "text", objective.title, true, "full")}
          ${selectField("drawerObjectiveProject", "关联项目", [["", "全局目标"], ...projectOptions()], objective.projectId)}
          ${field("drawerObjectiveOwner", "负责人", "text", objective.owner || "")}
          ${field("drawerObjectiveQuarter", "季度", "text", objective.quarter || "")}
          ${field("drawerObjectiveProgress", "进度", "number", objective.progress || 0)}
          ${selectField("drawerObjectiveStatus", "状态", objectiveStatusOptions, objective.status)}
          ${textareaField("drawerObjectiveSignal", "目标信号", objective.signal || "")}
        </div>
        <div class="drawer-actions">
          <button class="ghost-button" data-open-project="${escapeAttr(project.id)}" type="button">打开项目</button>
          <button class="primary-button small" data-save-objective="${escapeAttr(objective.id)}" type="button">保存目标</button>
        </div>
      </section>
      <section class="drawer-section">
        <h3>关键结果</h3>
        <div class="linked-list">
          ${keyResults.length ? keyResults.map((kr) => `
            <div class="linked-item">
              <span><strong>${escapeHtml(kr.label)}</strong><span>${escapeHtml(kr.current || "0")} / ${escapeHtml(kr.target || "—")} ${escapeHtml(kr.unit || "")}</span></span>
              <span>${kr.progress}%</span>
            </div>
          `).join("") : `<p class="muted-copy">暂无关键结果。</p>`}
        </div>
      </section>
    `);
  }

  function openTime(id) {
    const entry = state.timeEntries.find((item) => item.id === id);
    if (!entry) return;
    const project = projectById(entry.projectId);
    activeDrawer = { kind: "time", id };
    setDrawer("投入 / 工时", entry.description || "投入记录", `
      <section class="detail-hero">
        <span class="case-number">${escapeHtml(project.projectNo)}</span>
        <h3>${escapeHtml(entry.description || "投入记录")}</h3>
        <p>${escapeHtml(entry.date)} · ${Number(entry.hours || 0).toFixed(2)} h</p>
      </section>
      <section class="drawer-section">
        <div class="form-grid">
          ${selectField("drawerTimeProject", "项目", projectOptions(), entry.projectId)}
          ${selectField("drawerTimeTask", "任务", [["", "不关联任务"], ...taskOptions(entry.projectId)], entry.taskId || "")}
          ${field("drawerTimeDescription", "投入内容", "text", entry.description || "", true, "full")}
          ${field("drawerTimeDate", "日期", "date", entry.date || "")}
          ${field("drawerTimeHours", "小时", "number", entry.hours || 0)}
          ${field("drawerTimeTags", "标签", "text", entry.tags || "")}
        </div>
        <div class="drawer-actions">
          <button class="ghost-button" data-open-project="${escapeAttr(project.id)}" type="button">打开项目</button>
          <button class="primary-button small" data-save-time="${escapeAttr(entry.id)}" type="button">保存投入</button>
        </div>
      </section>
    `);
  }

  function openActivity(id) {
    const activity = state.activities.find((item) => item.id === id);
    if (!activity) return;
    const project = projectById(activity.projectId);
    activeDrawer = { kind: "activity", id };
    setDrawer("活动日志", activity.title, `
      <section class="detail-hero">
        <span class="case-number">${escapeHtml(project.projectNo || "全局")}</span>
        <h3>${escapeHtml(activity.title)}</h3>
        <p>${escapeHtml(activity.date)} · ${escapeHtml(activity.actor)} · ${escapeHtml(activity.action)}</p>
      </section>
      <section class="drawer-section">
        <p>${escapeHtml(activity.note || "暂无说明。")}</p>
        <div class="drawer-actions">
          ${activity.projectId ? `<button class="ghost-button" data-open-project="${escapeAttr(activity.projectId)}" type="button">打开项目</button>` : ""}
        </div>
      </section>
    `);
  }

  function openDay(date) {
    activeDrawer = { kind: "day", id: date };
    const events = eventsForDate(date);
    setDrawer("日历", formatLongDate(date), `
      <section class="drawer-section">
        <div class="agenda-events">
          ${events.length ? events.map(calendarEventRow).join("") : `<p class="muted-copy">当天没有任务或节点。</p>`}
        </div>
        <div class="drawer-actions">
          <button class="ghost-button" data-add-related="task" type="button">新增任务</button>
          <button class="ghost-button" data-add-related="deadline" type="button">新增节点</button>
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
    document.querySelector(".shell")?.setAttribute("inert", "");
    document.getElementById("closeDrawerButton")?.focus();
  }

  function closeDrawerIfOpen() {
    const drawer = document.getElementById("detailDrawer");
    if (drawer?.classList.contains("is-open")) closeDrawer();
  }

  function closeDrawer() {
    const drawer = document.getElementById("detailDrawer");
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.querySelector(".shell")?.removeAttribute("inert");
    activeDrawer = null;
  }

  function setDetailTitle(primary, secondary) {
    document.getElementById("viewTitle").textContent = secondary ? `${primary} · ${secondary}` : primary;
  }

  function restoreDetailTitle() {
    const detail = activeDetail || (document.body.dataset.detailKind && document.body.dataset.detailId
      ? { kind: document.body.dataset.detailKind, id: document.body.dataset.detailId }
      : null);
    if (!detail) return;
    if (detail.kind === "project") {
      const project = state.projects.find((item) => item.id === detail.id);
      if (project) setDetailTitle(project.projectNo, project.name);
    }
    if (detail.kind === "task") {
      const task = state.tasks.find((item) => item.id === detail.id);
      if (task) setDetailTitle("任务", task.title);
    }
  }

  function refreshDetailPage() {
    if (!activeDetail) return;
    if (activeDetail.kind === "project") renderProjectDetailPage(activeDetail.id);
    if (activeDetail.kind === "task") renderTaskDetailPage(activeDetail.id);
    restoreDetailTitle();
  }

  function refreshDrawer() {
    if (!activeDrawer) return;
    if (activeDrawer.kind === "deadline") openDeadline(activeDrawer.id);
    if (activeDrawer.kind === "document") openDocument(activeDrawer.id);
    if (activeDrawer.kind === "objective") openObjective(activeDrawer.id);
    if (activeDrawer.kind === "time") openTime(activeDrawer.id);
    if (activeDrawer.kind === "activity") openActivity(activeDrawer.id);
    if (activeDrawer.kind === "day") openDay(activeDrawer.id);
  }

  function saveProject(id) {
    const project = state.projects.find((item) => item.id === id);
    if (!project) return;
    project.projectNo = valueOf("drawerProjectNo") || project.projectNo;
    project.name = valueOf("drawerProjectName") || project.name;
    project.type = valueOf("drawerProjectType");
    project.stage = valueOf("drawerProjectStage");
    project.priority = valueOf("drawerProjectPriority");
    project.health = valueOf("drawerProjectHealth");
    project.progress = clamp(Number(valueOf("drawerProjectProgress")) || 0, 0, 100);
    project.owner = valueOf("drawerProjectOwner");
    project.client = valueOf("drawerProjectClient");
    project.contact = valueOf("drawerProjectContact");
    project.openedAt = valueOf("drawerProjectOpenedAt");
    project.dueDate = valueOf("drawerProjectDueDate");
    project.budget = valueOf("drawerProjectBudget");
    project.goal = valueOf("drawerProjectGoal");
    project.next = valueOf("drawerProjectNext");
    trackActivity({ projectId: id, entity: "Project", entityId: id, action: "update", title: `更新项目档案 ${project.projectNo}`, note: project.name });
    saveAndRender();
  }

  function saveTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    const title = requiredValueOf("drawerTaskTitle");
    if (!title) {
      showDrawerSaveStatus("请填写任务标题", "warn");
      return;
    }
    task.title = title;
    task.projectId = valueOf("drawerTaskProject") || task.projectId;
    task.owner = valueOf("drawerTaskOwner");
    task.due = valueOf("drawerTaskDue");
    task.status = valueOf("drawerTaskStatus");
    task.priority = valueOf("drawerTaskPriority");
    task.notes = valueOf("drawerTaskNotes");
    trackActivity({ projectId: task.projectId, entity: "Task", entityId: id, action: task.status === "done" ? "complete" : "update", title: `更新任务：${task.title}` });
    saveAndRender();
    showDrawerSaveStatus("任务已保存，正在同步云端");
  }

  function saveDeadline(id) {
    const deadline = state.deadlines.find((item) => item.id === id);
    if (!deadline) return;
    deadline.title = valueOf("drawerDeadlineTitle") || deadline.title;
    deadline.projectId = valueOf("drawerDeadlineProject") || deadline.projectId;
    deadline.kind = valueOf("drawerDeadlineKind");
    deadline.date = valueOf("drawerDeadlineDate");
    deadline.risk = valueOf("drawerDeadlineRisk");
    trackActivity({ projectId: deadline.projectId, entity: "Deadline", entityId: id, action: "update", title: `更新节点：${deadline.title}` });
    saveAndRender();
  }

  function saveDocument(id) {
    const documentItem = state.documents.find((item) => item.id === id);
    if (!documentItem) return;
    documentItem.title = valueOf("drawerDocumentTitle") || documentItem.title;
    documentItem.projectId = valueOf("drawerDocumentProject") || documentItem.projectId;
    documentItem.type = valueOf("drawerDocumentType");
    documentItem.path = valueOf("drawerDocumentPath");
    documentItem.note = valueOf("drawerDocumentNote");
    trackActivity({ projectId: documentItem.projectId, entity: "Document", entityId: id, action: "update", title: `更新资料：${documentItem.title}` });
    saveAndRender();
  }

  function saveObjective(id) {
    const objective = state.objectives.find((item) => item.id === id);
    if (!objective) return;
    objective.title = valueOf("drawerObjectiveTitle") || objective.title;
    objective.projectId = valueOf("drawerObjectiveProject");
    objective.owner = valueOf("drawerObjectiveOwner");
    objective.quarter = valueOf("drawerObjectiveQuarter");
    objective.progress = clamp(Number(valueOf("drawerObjectiveProgress")) || 0, 0, 100);
    objective.status = valueOf("drawerObjectiveStatus");
    objective.signal = valueOf("drawerObjectiveSignal");
    trackActivity({ projectId: objective.projectId, entity: "Objective", entityId: id, action: "update", title: `更新目标：${objective.title}` });
    saveAndRender();
  }

  function saveTime(id) {
    const entry = state.timeEntries.find((item) => item.id === id);
    if (!entry) return;
    entry.projectId = valueOf("drawerTimeProject") || entry.projectId;
    entry.taskId = valueOf("drawerTimeTask");
    entry.description = valueOf("drawerTimeDescription") || entry.description;
    entry.date = valueOf("drawerTimeDate");
    entry.hours = Number(valueOf("drawerTimeHours")) || 0;
    entry.tags = valueOf("drawerTimeTags");
    trackActivity({ projectId: entry.projectId, entity: "TimeEntry", entityId: id, action: "update", title: `更新投入：${entry.description}` });
    saveAndRender();
  }

  function deleteProject(id) {
    const project = state.projects.find((item) => item.id === id);
    if (!project) return;
    const rel = related(id);
    const confirmed = window.confirm(`确定删除项目 ${project.projectNo} · ${project.name}？\n\n将同时删除该项目下的 ${rel.tasks.length} 个任务、${rel.deadlines.length} 个节点、${rel.documents.length} 份资料、${rel.objectives.length} 个目标和 ${rel.timeEntries.length} 条投入记录。`);
    if (!confirmed) return;

    const objectiveIds = rel.objectives.map((objective) => objective.id);
    state.projects = state.projects.filter((item) => item.id !== id);
    state.tasks = state.tasks.filter((task) => task.projectId !== id);
    state.deadlines = state.deadlines.filter((deadline) => deadline.projectId !== id);
    state.documents = state.documents.filter((documentItem) => documentItem.projectId !== id);
    state.objectives = state.objectives.filter((objective) => objective.projectId !== id);
    state.keyResults = state.keyResults.filter((kr) => kr.projectId !== id && !objectiveIds.includes(kr.objectiveId));
    state.timeEntries = state.timeEntries.filter((entry) => entry.projectId !== id);
    state.activities = state.activities.filter((activity) => activity.projectId !== id);
    trackActivity({ projectId: "", entity: "Project", entityId: id, action: "delete", title: `删除项目档案 ${project.projectNo}`, note: project.name });

    if (activeDetail?.kind === "project" && activeDetail.id === id) activeDetail = null;
    if (activeDrawer) closeDrawerIfOpen();
    saveAndRender();
    if (currentView === "projectDetail") setView("projects");
    setSyncStatus("项目已删除，正在同步云端", "pending");
  }

  function deleteTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    const project = projectById(task.projectId);
    const confirmed = window.confirm(`确定删除任务「${task.title}」？\n\n已有工时记录会保留，但不再关联到这个任务。`);
    if (!confirmed) return;

    state.tasks = state.tasks.filter((item) => item.id !== id);
    state.timeEntries.forEach((entry) => {
      if (entry.taskId === id) entry.taskId = "";
    });
    trackActivity({ projectId: task.projectId, entity: "Task", entityId: id, action: "delete", title: `删除任务：${task.title}`, note: project.projectNo });

    const shouldReturnProject = currentView === "taskDetail" && activeDetail?.kind === "task" && activeDetail.id === id && project.id;
    if (activeDetail?.kind === "task" && activeDetail.id === id) activeDetail = null;
    if (activeDrawer) closeDrawerIfOpen();
    saveAndRender();
    if (shouldReturnProject) openProject(project.id);
    if (currentView === "taskDetail" && !shouldReturnProject) setView("tasks");
    setSyncStatus("任务已删除，正在同步云端", "pending");
  }

  function valueOf(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  function requiredValueOf(id) {
    const field = document.getElementById(id);
    const value = field?.value?.trim() || "";
    if (!value) {
      field?.focus();
      field?.reportValidity?.();
    }
    return value;
  }

  function showDrawerSaveStatus(message, tone = "ok") {
    const status = document.getElementById("drawerSaveStatus");
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function saveAndRender() {
    replaceState(state);
    saveState();
    renderAll();
  }

  function trackActivity({ projectId = "", entity = "Project", entityId = "", action = "update", title = "工作台更新", note = "" }) {
    state.activities.unshift({
      id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      projectId,
      entity,
      entityId,
      action,
      title,
      actor: "Pontnova",
      date: toIsoDate(today),
      note
    });
    state.activities = state.activities.slice(0, 300);
  }

  function moveCalendar(direction) {
    if (calendarMode === "month") calendarAnchor = new Date(calendarAnchor.getFullYear(), calendarAnchor.getMonth() + direction, 1);
    if (calendarMode === "week") calendarAnchor = addDays(calendarAnchor, direction * 7);
    if (calendarMode === "day") calendarAnchor = addDays(calendarAnchor, direction);
    renderCalendar();
  }

  function projectOptions() {
    return state.projects.map((project) => [project.id, `${project.projectNo} · ${project.name}`]);
  }

  function taskOptions(projectId) {
    return state.tasks
      .filter((task) => !projectId || task.projectId === projectId)
      .map((task) => [task.id, task.title]);
  }

  function nextProjectNo(type) {
    const count = state.projects.filter((project) => project.type === type).length + 1;
    return buildProjectNo(type, count - 1);
  }

  function buildProjectNo(type, index) {
    const prefix = Object.fromEntries(typeOptions.map(([value, , code]) => [value, code]))[type] || "OPS";
    return `PN-${prefix}-2026-${String(index + 1).padStart(3, "0")}`;
  }

  function sortTasks(a, b) {
    const statusWeight = { in_progress: 0, next: 1, waiting: 2, done: 3 };
    const priorityWeight = { high: 0, medium: 1, low: 2 };
    return (statusWeight[a.status] ?? 9) - (statusWeight[b.status] ?? 9)
      || (priorityWeight[a.priority] ?? 9) - (priorityWeight[b.priority] ?? 9)
      || String(a.due || "9999-12-31").localeCompare(String(b.due || "9999-12-31"));
  }

  function typeLabel(value) {
    return labelFrom(typeOptions, value, "运营");
  }

  function programInfo(type) {
    const found = typeOptions.find(([value]) => value === type) || typeOptions.find(([value]) => value === "operations");
    if (!found) return null;
    const [value, label, prefix, accent, kicker, title, description] = found;
    return { type: value, label, prefix, accent, kicker, title, description };
  }

  function programRiskTone(project) {
    if (project.health === "blocked" || project.health === "at_risk") return "high";
    if (project.health === "needs_review" || project.priority === "high") return "medium";
    return "low";
  }

  function stageLabel(value) {
    return labelFrom(stageOptions, value, "规划");
  }

  function healthLabel(value) {
    return labelFrom(healthOptions, value, "正常");
  }

  function priorityLabel(value) {
    return { high: "高", medium: "中", low: "低" }[value] || "中";
  }

  function statusLabel(value) {
    return { next: "下一步", in_progress: "进行中", waiting: "等待", done: "完成" }[value] || value;
  }

  function labelFrom(options, value, fallback) {
    return (options.find(([item]) => item === value) || [null, fallback])[1];
  }

  function relativeDay(date) {
    if (!date) return "未设日期";
    const diff = daysUntil(date);
    if (diff === 0) return "今天";
    if (diff === 1) return "明天";
    if (diff === -1) return "昨天";
    if (diff > 1) return `${diff} 天后`;
    return `${Math.abs(diff)} 天前`;
  }

  function daysUntil(date) {
    if (!date) return 9999;
    return Math.round((parseDate(date).getTime() - today.getTime()) / dayMs);
  }

  function parseDate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  function weekStart(date) {
    return addDays(startOfDay(date), -date.getDay());
  }

  function formatLongDate(value) {
    if (!value) return "未设日期";
    return new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" }).format(parseDate(value));
  }

  function sumHours(entries) {
    return entries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
  }

  function text(value) {
    return String(value ?? "").trim();
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function choice(value, choices, fallback) {
    return choices.includes(value) ? value : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function validDate(value) {
    const next = text(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(next) ? next : "";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function escapeSvg(value) {
    return escapeHtml(value).replace(/&quot;/g, "'");
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
  document.querySelectorAll("[data-dashboard-range]").forEach((button) => {
    button.addEventListener("click", () => {
      dashboardRange = button.dataset.dashboardRange;
      renderDashboard();
    });
  });
  document.getElementById("searchInput").addEventListener("input", (event) => {
    query = event.target.value.trim();
    renderAll();
  });
  document.getElementById("newProjectButton").addEventListener("click", () => openDialog("project"));
  document.getElementById("newProjectButtonSidebar")?.addEventListener("click", () => openDialog("project"));
  document.getElementById("newProjectButtonSecondary").addEventListener("click", () => openDialog("project"));
  document.getElementById("newTaskButton").addEventListener("click", () => openDialog("task"));
  document.getElementById("newTaskButtonSecondary").addEventListener("click", () => openDialog("task"));
  document.getElementById("newDeadlineButton").addEventListener("click", () => openDialog("deadline"));
  document.getElementById("newDeadlineButtonSecondary").addEventListener("click", () => openDialog("deadline"));
  document.getElementById("newDeadlineButtonTertiary")?.addEventListener("click", () => openDialog("deadline"));
  document.getElementById("newDocumentButton").addEventListener("click", () => openDialog("document"));
  document.getElementById("newObjectiveButton").addEventListener("click", () => openDialog("objective"));
  document.getElementById("newTimeEntryButton").addEventListener("click", () => openDialog("time"));
  document.getElementById("newActivityButton").addEventListener("click", () => openDialog("activity"));
  document.getElementById("calendarPrevButton").addEventListener("click", () => moveCalendar(-1));
  document.getElementById("calendarNextButton").addEventListener("click", () => moveCalendar(1));
  document.getElementById("calendarTodayButton").addEventListener("click", () => {
    calendarAnchor = startOfDay(new Date());
    renderCalendar();
  });
  document.getElementById("entryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      closeEntryDialog();
      return;
    }
    const form = event.currentTarget;
    if (form.dataset.mode === "edit") {
      handleEdit(form.dataset.kind, form.dataset.editId, form);
    } else {
      handleCreate(form.dataset.kind, form);
    }
    document.getElementById("entryDialog").close();
    form.reset();
    form.dataset.mode = "create";
    form.dataset.editId = "";
    document.getElementById("saveEntryButton").textContent = "保存";
  });
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", closeEntryDialog));
  document.getElementById("entryDialog").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeEntryDialog();
  });
  document.body.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-task-check]");
    if (!checkbox) return;
    const task = state.tasks.find((item) => item.id === checkbox.dataset.taskCheck);
    if (!task) return;
    task.status = checkbox.checked ? "done" : "next";
    trackActivity({ projectId: task.projectId, entity: "Task", entityId: task.id, action: checkbox.checked ? "complete" : "update", title: `${checkbox.checked ? "完成" : "重开"}任务：${task.title}` });
    saveAndRender();
  });
  document.body.addEventListener("click", (event) => {
    const target = event.target.closest("[data-open-program], [data-open-project], [data-open-task], [data-open-deadline], [data-open-document], [data-open-objective], [data-open-time], [data-open-activity], [data-open-day], [data-add-related], [data-new-program-project], [data-filter-program], [data-edit-project], [data-edit-task], [data-delete-project], [data-delete-task], [data-view-jump], [data-save-project], [data-save-task], [data-save-deadline], [data-save-document], [data-save-objective], [data-save-time], [data-filter-jump]");
    if (!target) return;
    if (target.dataset.viewJump) setView(target.dataset.viewJump);
    if (target.dataset.openProgram) openProgram(target.dataset.openProgram);
    if (target.dataset.openProject) openProject(target.dataset.openProject);
    if (target.dataset.openTask) openTask(target.dataset.openTask);
    if (target.dataset.openDeadline) openDeadline(target.dataset.openDeadline);
    if (target.dataset.openDocument) openDocument(target.dataset.openDocument);
    if (target.dataset.openObjective) openObjective(target.dataset.openObjective);
    if (target.dataset.openTime) openTime(target.dataset.openTime);
    if (target.dataset.openActivity) openActivity(target.dataset.openActivity);
    if (target.dataset.openDay) openDay(target.dataset.openDay);
    if (target.dataset.addRelated) openDialog(target.dataset.addRelated, { projectId: target.dataset.projectId || "" });
    if (target.dataset.newProgramProject) openDialog("project", { type: target.dataset.newProgramProject });
    if (target.dataset.filterProgram) {
      currentFilter = target.dataset.filterProgram;
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item.dataset.filter === currentFilter));
      setView("projects");
      renderProjects();
    }
    if (target.dataset.editProject) openEditDialog("project", target.dataset.editProject);
    if (target.dataset.editTask) openEditDialog("task", target.dataset.editTask);
    if (target.dataset.deleteProject) deleteProject(target.dataset.deleteProject);
    if (target.dataset.deleteTask) deleteTask(target.dataset.deleteTask);
    if (target.dataset.saveProject) saveProject(target.dataset.saveProject);
    if (target.dataset.saveTask) saveTask(target.dataset.saveTask);
    if (target.dataset.saveDeadline) saveDeadline(target.dataset.saveDeadline);
    if (target.dataset.saveDocument) saveDocument(target.dataset.saveDocument);
    if (target.dataset.saveObjective) saveObjective(target.dataset.saveObjective);
    if (target.dataset.saveTime) saveTime(target.dataset.saveTime);
    if (target.dataset.filterJump) {
      currentFilter = target.dataset.filterJump;
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item.dataset.filter === currentFilter));
      setView("projects");
      renderProjects();
    }
  });
  document.getElementById("closeDrawerButton").addEventListener("click", closeDrawer);
  document.querySelector("[data-close-drawer]").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (document.getElementById("entryDialog")?.open) return;
    const drawer = document.getElementById("detailDrawer");
    if (drawer.classList.contains("is-open")) closeDrawer();
  });
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
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported || typeof imported !== "object") throw new Error("Invalid workbench JSON");
      replaceState(imported);
      trackActivity({ title: "导入 JSON 数据", entity: "Project", action: "update" });
      saveState();
      renderAll();
      setSyncStatus("已导入并保存，正在同步云端", "ok");
    } catch (error) {
      setSyncStatus("导入失败：文件不是有效的工作台 JSON", "warn");
    } finally {
      event.target.value = "";
    }
  });

  replaceState(loadLocalState());
  renderAll();
  loadCloudState();
})();
