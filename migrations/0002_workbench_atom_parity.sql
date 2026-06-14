PRAGMA foreign_keys = ON;

ALTER TABLE projects ADD COLUMN project_no TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN opened_at TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN due_date TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN budget TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN contact TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN goal TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN health TEXT NOT NULL DEFAULT 'on_track';

CREATE TABLE IF NOT EXISTS objectives (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  title TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  quarter TEXT NOT NULL DEFAULT '',
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'on_track',
  signal TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS key_results (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  project_id TEXT,
  label TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  current TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'on_track',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_id TEXT,
  description TEXT NOT NULL DEFAULT '',
  entry_date TEXT NOT NULL DEFAULT '',
  hours REAL NOT NULL DEFAULT 0,
  billable INTEGER NOT NULL DEFAULT 1,
  tags TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  entity TEXT NOT NULL DEFAULT 'Project',
  entity_id TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT 'update',
  title TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'Pontnova',
  activity_date TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_project_no ON projects(project_no);
CREATE INDEX IF NOT EXISTS idx_projects_health ON projects(health);
CREATE INDEX IF NOT EXISTS idx_objectives_project ON objectives(project_id);
CREATE INDEX IF NOT EXISTS idx_key_results_objective ON key_results(objective_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_date ON time_entries(project_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_activities_project_date ON activities(project_id, activity_date);

UPDATE projects
SET
  project_no = CASE id
    WHEN 'pn-consult-001' THEN 'PN-CONS-2026-001'
    WHEN 'pn-fund-002' THEN 'PN-FUND-2026-001'
    WHEN 'pn-train-003' THEN 'PN-TRN-2026-001'
    WHEN 'pn-ws-004' THEN 'PN-WS-2026-001'
    ELSE project_no
  END,
  opened_at = CASE WHEN opened_at = '' THEN date('now', '-14 days') ELSE opened_at END,
  due_date = CASE id
    WHEN 'pn-consult-001' THEN date('now', '+21 days')
    WHEN 'pn-fund-002' THEN date('now', '+28 days')
    WHEN 'pn-train-003' THEN date('now', '+35 days')
    WHEN 'pn-ws-004' THEN date('now', '+42 days')
    ELSE due_date
  END,
  budget = CASE id
    WHEN 'pn-consult-001' THEN 'Strategy sprint'
    WHEN 'pn-fund-002' THEN 'Investor readiness'
    WHEN 'pn-train-003' THEN 'Half-day training'
    WHEN 'pn-ws-004' THEN 'Public workshop'
    ELSE budget
  END,
  contact = CASE id
    WHEN 'pn-consult-001' THEN 'Head of IP'
    WHEN 'pn-fund-002' THEN 'CEO / CTO'
    WHEN 'pn-train-003' THEN 'Legal manager'
    WHEN 'pn-ws-004' THEN 'Pontnova audience'
    ELSE contact
  END,
  goal = CASE id
    WHEN 'pn-consult-001' THEN '形成客户可执行的欧洲进入策略和风险地图'
    WHEN 'pn-fund-002' THEN '把技术壁垒转化为投资人可理解的尽调叙事'
    WHEN 'pn-train-003' THEN '让管理层建立可执行的 IP 管理动作清单'
    WHEN 'pn-ws-004' THEN '完成一场高质量出海 IP workshop 的策划与发布'
    ELSE goal
  END,
  health = CASE id
    WHEN 'pn-consult-001' THEN 'on_track'
    WHEN 'pn-fund-002' THEN 'needs_review'
    WHEN 'pn-train-003' THEN 'on_track'
    WHEN 'pn-ws-004' THEN 'at_risk'
    ELSE health
  END
WHERE project_no = '';

INSERT OR IGNORE INTO objectives (id, project_id, title, owner, quarter, progress, status, signal, sort_order) VALUES
  ('okr-1', 'pn-consult-001', '建立 Pontnova 咨询项目交付标准', 'Edmond', '2026 Q2', 62, 'on_track', '每个咨询项目都能沉淀为可复用方法论', 0),
  ('okr-2', 'pn-fund-002', '形成投融资技术尽调产品包', 'Pontnova', '2026 Q2', 48, 'needs_review', '让投资材料同时经得起技术与商业追问', 1),
  ('okr-3', 'pn-ws-004', '把 Workshop 变成稳定获客入口', 'Pontnova', '2026 Q2', 35, 'at_risk', '主题、嘉宾、报名与复盘形成闭环', 2);

INSERT OR IGNORE INTO key_results (id, objective_id, project_id, label, target, current, unit, progress, status, sort_order) VALUES
  ('kr-1', 'okr-1', 'pn-consult-001', '完成 3 套咨询交付模板', '3', '2', '套', 66, 'on_track', 0),
  ('kr-2', 'okr-1', 'pn-consult-001', '每个项目沉淀 1 张风险地图', '4', '2', '张', 50, 'needs_review', 1),
  ('kr-3', 'okr-2', 'pn-fund-002', '完成技术尽调 Q&A 数据库', '60', '25', '题', 42, 'needs_review', 0),
  ('kr-4', 'okr-3', 'pn-ws-004', '确认 workshop 嘉宾与报名页', '100', '35', '%', 35, 'at_risk', 0);

INSERT OR IGNORE INTO time_entries (id, project_id, task_id, description, entry_date, hours, billable, tags, sort_order) VALUES
  ('time-1', 'pn-consult-001', 'task-1', '竞品专利族初筛和摘要', date('now', '-2 days'), 2.5, 1, 'research;strategy', 0),
  ('time-2', 'pn-fund-002', 'task-2', '技术尽调问题树整理', date('now', '-1 days'), 1.75, 1, 'fundraising;dd', 1),
  ('time-3', 'pn-train-003', 'task-3', '培训案例结构设计', date('now'), 1.25, 1, 'training', 2);

INSERT OR IGNORE INTO activities (id, project_id, entity, entity_id, action, title, actor, activity_date, note, sort_order) VALUES
  ('act-1', 'pn-consult-001', 'Project', 'pn-consult-001', 'update', '更新竞争格局风险图谱', 'Edmond', date('now', '-1 days'), '补充竞品专利族和市场进入风险。', 0),
  ('act-2', 'pn-fund-002', 'Task', 'task-2', 'create', '创建技术尽调问题清单任务', 'Pontnova', date('now', '-2 days'), '为投资人预演准备问答。', 1),
  ('act-3', 'pn-ws-004', 'Deadline', 'due-3', 'update', '报名页上线节点进入风险观察', 'Pontnova', date('now'), '嘉宾和页面材料尚待确认。', 2);
