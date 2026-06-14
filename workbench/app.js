(function () {
  const storageKey = "pontnova-workbench-v1";
  const today = new Date();
  const day = 24 * 60 * 60 * 1000;
  const isoDate = (offset) => new Date(today.getTime() + offset * day).toISOString().slice(0, 10);

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

  const state = loadState();
  let currentView = "dashboard";
  let currentFilter = "all";
  let query = "";

  const views = {
    dashboard: document.getElementById("dashboardView"),
    projects: document.getElementById("projectsView"),
    tasks: document.getElementById("tasksView"),
    calendar: document.getElementById("calendarView"),
    documents: document.getElementById("documentsView")
  };
  const titles = {
    dashboard: "项目总览",
    projects: "项目组合",
    tasks: "任务清单",
    calendar: "关键日程",
    documents: "资料索引"
  };

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "");
      if (stored && Array.isArray(stored.projects)) return stored;
    } catch (error) {
      // Ignore malformed local data and fall back to seed records.
    }
    localStorage.setItem(storageKey, JSON.stringify(seed));
    return structuredClone(seed);
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function matches(text) {
    return String(text || "").toLowerCase().includes(query.toLowerCase());
  }

  function projectById(id) {
    return state.projects.find((project) => project.id === id) || { name: "未绑定项目", type: "consulting" };
  }

  function typeLabel(type) {
    return {
      consulting: "咨询",
      fundraising: "投融资",
      training: "培训",
      workshop: "Workshop",
      operations: "运营"
    }[type] || type;
  }

  function stageLabel(stage) {
    return {
      planning: "规划",
      active: "推进中",
      waiting: "等待",
      complete: "完成"
    }[stage] || stage;
  }

  function priorityLabel(priority) {
    return { high: "高", medium: "中", low: "低" }[priority] || priority;
  }

  function statusLabel(status) {
    return {
      next: "下一步",
      in_progress: "进行中",
      waiting: "等待",
      done: "完成"
    }[status] || status;
  }

  function dueLabel(date) {
    if (!date) return "未定";
    const diff = Math.ceil((new Date(`${date}T00:00:00`) - new Date(today.toDateString())) / day);
    if (diff < 0) return `逾期 ${Math.abs(diff)} 天`;
    if (diff === 0) return "今天";
    if (diff === 1) return "明天";
    return `${diff} 天后`;
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
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function filteredDocuments() {
    return state.documents.filter((document) => {
      const project = projectById(document.projectId);
      return !query || matches([document.title, document.path, document.note, project.name].join(" "));
    });
  }

  function emptyNode() {
    return document.getElementById("emptyTemplate").content.cloneNode(true);
  }

  function renderMetrics() {
    const activeProjects = state.projects.filter((project) => project.stage !== "complete").length;
    const nextTasks = state.tasks.filter((task) => task.status !== "done").length;
    const nearDeadlines = state.deadlines.filter((deadline) => new Date(deadline.date) - today <= 14 * day).length;
    const highPriority = state.tasks.filter((task) => task.priority === "high" && task.status !== "done").length;
    document.getElementById("metricGrid").innerHTML = [
      ["活跃项目", activeProjects],
      ["未完成任务", nextTasks],
      ["14 天内节点", nearDeadlines],
      ["高优先级动作", highPriority]
    ].map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`).join("");
  }

  function projectCard(project) {
    return `
      <article class="project-card">
        <header>
          <div>
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.summary || "")}</p>
          </div>
          <span class="badge ${project.priority}">${priorityLabel(project.priority)}</span>
        </header>
        <div class="progress" aria-label="项目进度 ${project.progress}%"><span style="width:${Number(project.progress) || 0}%"></span></div>
        <div class="meta-row">
          <span class="badge">${typeLabel(project.type)}</span>
          <span class="badge">${stageLabel(project.stage)}</span>
          <span class="badge">${escapeHtml(project.client || "内部")}</span>
        </div>
        <p><strong>下一步：</strong>${escapeHtml(project.next || "待确认")}</p>
      </article>
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
          <input type="checkbox" data-toggle-task="${task.id}" ${task.status === "done" ? "checked" : ""} aria-label="标记任务完成">
          <div>
            <h3>${escapeHtml(task.title)}</h3>
            <div class="meta-row">
              <span class="badge">${escapeHtml(project.name)}</span>
              <span class="badge">${statusLabel(task.status)}</span>
              <span class="badge ${task.priority}">${priorityLabel(task.priority)}</span>
              <span class="badge">${dueLabel(task.due)}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderTasks() {
    const tasks = filteredTasks().sort((a, b) => (a.status === "done") - (b.status === "done") || a.due.localeCompare(b.due));
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
          <td><input type="checkbox" data-toggle-task="${task.id}" ${task.status === "done" ? "checked" : ""}></td>
          <td>${escapeHtml(task.title)}<br><span class="status">${statusLabel(task.status)}</span></td>
          <td>${escapeHtml(project.name)}</td>
          <td>${escapeHtml(task.owner || "")}</td>
          <td>${escapeHtml(task.due || "未定")}<br><span class="status">${dueLabel(task.due)}</span></td>
          <td><span class="badge ${task.priority}">${priorityLabel(task.priority)}</span></td>
        </tr>
      `;
    }).join("");
  }

  function renderDeadlines() {
    const deadlines = filteredDeadlines();
    const dash = document.getElementById("dashboardTimeline");
    const calendar = document.getElementById("calendarList");
    dash.innerHTML = "";
    calendar.innerHTML = "";
    if (!deadlines.length) {
      dash.appendChild(emptyNode());
      calendar.appendChild(emptyNode());
      return;
    }
    const html = deadlines.map((deadline) => {
      const project = projectById(deadline.projectId);
      return `
        <article class="deadline-row">
          <div>
            <h3>${escapeHtml(deadline.title)}</h3>
            <div class="meta-row">
              <span class="badge">${escapeHtml(deadline.date)}</span>
              <span class="badge">${dueLabel(deadline.date)}</span>
              <span class="badge">${escapeHtml(project.name)}</span>
              <span class="badge">${escapeHtml(deadline.kind || "节点")}</span>
            </div>
          </div>
          <span class="badge ${deadline.risk}">${priorityLabel(deadline.risk)}</span>
        </article>
      `;
    }).join("");
    dash.innerHTML = html;
    calendar.innerHTML = html;
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
        <article class="document-card">
          <header>
            <h3>${escapeHtml(document.title)}</h3>
            <span class="badge">${escapeHtml(document.type || "资料")}</span>
          </header>
          <p>${escapeHtml(document.note || "")}</p>
          <div class="meta-row">
            <span class="badge">${escapeHtml(project.name)}</span>
          </div>
          <p><a href="${escapeAttr(document.path || "#")}" target="_blank" rel="noreferrer">${escapeHtml(document.path || "未设置路径")}</a></p>
        </article>
      `;
    }).join("");
  }

  function render() {
    renderMetrics();
    renderProjects();
    renderTasks();
    renderDeadlines();
    renderDocuments();
  }

  function setView(view) {
    currentView = view;
    Object.entries(views).forEach(([key, element]) => element.classList.toggle("is-active", key === view));
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
    document.getElementById("viewTitle").textContent = titles[view];
  }

  function openDialog(kind) {
    const dialog = document.getElementById("entryDialog");
    const form = document.getElementById("entryForm");
    const fields = document.getElementById("formFields");
    form.dataset.kind = kind;
    fields.innerHTML = fieldMarkup(kind);
    document.getElementById("dialogTitle").textContent = {
      project: "新增项目",
      task: "新增任务",
      deadline: "新增节点",
      document: "新增资料"
    }[kind];
    document.getElementById("dialogKicker").textContent = "Pontnova";
    dialog.showModal();
  }

  function projectOptions() {
    return state.projects.map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join("");
  }

  function fieldMarkup(kind) {
    if (kind === "project") {
      return `
        ${field("name", "项目名称", "text", "", true)}
        ${field("client", "客户 / 对象", "text")}
        ${selectField("type", "类型", [["consulting", "咨询"], ["fundraising", "投融资"], ["training", "培训"], ["workshop", "Workshop"], ["operations", "运营"]])}
        ${selectField("priority", "优先级", [["high", "高"], ["medium", "中"], ["low", "低"]])}
        ${selectField("stage", "状态", [["planning", "规划"], ["active", "推进中"], ["waiting", "等待"], ["complete", "完成"]])}
        ${field("owner", "负责人", "text", "Pontnova")}
        ${field("progress", "进度 0-100", "number", "10")}
        ${field("next", "下一步", "text", "", false, "full")}
        ${textareaField("summary", "项目说明")}
      `;
    }
    if (kind === "task") {
      return `
        ${field("title", "任务", "text", "", true, "full")}
        ${selectField("projectId", "项目", state.projects.map((p) => [p.id, p.name]))}
        ${field("owner", "负责人", "text", "Pontnova")}
        ${field("due", "截止日期", "date", isoDate(7))}
        ${selectField("priority", "优先级", [["high", "高"], ["medium", "中"], ["low", "低"]])}
        ${selectField("status", "状态", [["next", "下一步"], ["in_progress", "进行中"], ["waiting", "等待"], ["done", "完成"]])}
      `;
    }
    if (kind === "deadline") {
      return `
        ${field("title", "节点名称", "text", "", true, "full")}
        ${selectField("projectId", "项目", state.projects.map((p) => [p.id, p.name]))}
        ${field("kind", "类型", "text", "交付")}
        ${field("date", "日期", "date", isoDate(7))}
        ${selectField("risk", "风险", [["high", "高"], ["medium", "中"], ["low", "低"]])}
      `;
    }
    return `
      ${field("title", "资料名称", "text", "", true, "full")}
      ${selectField("projectId", "项目", state.projects.map((p) => [p.id, p.name]))}
      ${field("type", "类型", "text", "note")}
      ${field("path", "Dropbox 路径 / 链接", "text", "", false, "full")}
      ${textareaField("note", "备注")}
    `;
  }

  function field(name, label, type, value = "", required = false, klass = "") {
    return `<div class="form-field ${klass}"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${escapeAttr(value)}" ${required ? "required" : ""}></div>`;
  }

  function selectField(name, label, options) {
    return `<div class="form-field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map(([value, text]) => `<option value="${escapeAttr(value)}">${escapeHtml(text)}</option>`).join("")}</select></div>`;
  }

  function textareaField(name, label) {
    return `<div class="form-field full"><label for="${name}">${label}</label><textarea id="${name}" name="${name}"></textarea></div>`;
  }

  function saveEntry(form) {
    const kind = form.dataset.kind;
    const data = Object.fromEntries(new FormData(form).entries());
    const id = `${kind}-${Date.now().toString(36)}`;
    if (kind === "project") {
      state.projects.unshift({ id, ...data, progress: Math.max(0, Math.min(100, Number(data.progress) || 0)) });
    }
    if (kind === "task") state.tasks.unshift({ id, ...data });
    if (kind === "deadline") state.deadlines.unshift({ id, ...data });
    if (kind === "document") state.documents.unshift({ id, ...data });
    saveState();
    render();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
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

  document.getElementById("searchInput").addEventListener("input", (event) => {
    query = event.target.value.trim();
    render();
  });

  document.getElementById("newProjectButton").addEventListener("click", () => openDialog("project"));
  document.getElementById("newTaskButton").addEventListener("click", () => openDialog("task"));
  document.getElementById("newTaskButtonSecondary").addEventListener("click", () => openDialog("task"));
  document.getElementById("newDeadlineButton").addEventListener("click", () => openDialog("deadline"));
  document.getElementById("newDeadlineButtonSecondary").addEventListener("click", () => openDialog("deadline"));
  document.getElementById("newDocumentButton").addEventListener("click", () => openDialog("document"));

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
    render();
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
    const file = event.target.files[0];
    if (!file) return;
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.projects) || !Array.isArray(imported.tasks)) {
      alert("JSON 结构不符合工作台格式。");
      return;
    }
    Object.assign(state, imported);
    saveState();
    render();
  });

  render();
})();
