PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'consulting',
  client TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'planning',
  priority TEXT NOT NULL DEFAULT 'medium',
  progress INTEGER NOT NULL DEFAULT 0,
  next_action TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'next',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deadlines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT '',
  risk TEXT NOT NULL DEFAULT 'medium',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_status ON tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_deadlines_project_due ON deadlines(project_id, due_date);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);

INSERT OR IGNORE INTO projects (id, name, type, client, owner, stage, priority, progress, next_action, summary, sort_order) VALUES
  ('pn-consult-001', '中欧 IP 市场进入策略', 'consulting', '医疗科技客户', 'Edmond', 'active', 'high', 68, '完成竞争格局和自由实施风险图谱', '面向欧洲上市路径的知识产权、监管和商业风险咨询。', 0),
  ('pn-fund-002', '投融资技术尽调支持', 'fundraising', '硬科技团队', 'Pontnova', 'active', 'high', 52, '整理投资人问答和技术壁垒材料', '把专利资产、技术路线、市场叙事整理成投资人可读材料。', 1),
  ('pn-train-003', '企业 IP 管理培训', 'training', '制造业客户', 'Edmond', 'planning', 'medium', 35, '确认培训大纲和案例清单', '两小时管理层课程，聚焦研发记录、商业秘密和海外布局。', 2),
  ('pn-ws-004', 'UPC / SEP Workshop', 'workshop', '开放报名', 'Pontnova', 'planning', 'medium', 28, '确认嘉宾、页面和报名表', '面向中国出海企业的欧洲争议解决和许可策略工作坊。', 3);

INSERT OR IGNORE INTO tasks (id, project_id, title, owner, due_date, priority, status, sort_order) VALUES
  ('task-1', 'pn-consult-001', '补齐三家竞品欧洲专利族摘要', 'Edmond', date('now', '+2 days'), 'high', 'next', 0),
  ('task-2', 'pn-fund-002', '生成技术尽调问题清单', 'Pontnova', date('now', '+4 days'), 'high', 'in_progress', 1),
  ('task-3', 'pn-train-003', '设计培训案例和互动题', 'Edmond', date('now', '+7 days'), 'medium', 'next', 2),
  ('task-4', 'pn-ws-004', 'Workshop 页面文案第一版', 'Pontnova', date('now', '+10 days'), 'medium', 'waiting', 3);

INSERT OR IGNORE INTO deadlines (id, project_id, title, due_date, kind, risk, sort_order) VALUES
  ('due-1', 'pn-consult-001', '客户策略简报', date('now', '+3 days'), '交付', 'high', 0),
  ('due-2', 'pn-fund-002', '投资人材料预演', date('now', '+6 days'), '会议', 'medium', 1),
  ('due-3', 'pn-ws-004', '报名页上线', date('now', '+12 days'), '发布', 'medium', 2);

INSERT OR IGNORE INTO documents (id, project_id, title, type, path, note, sort_order) VALUES
  ('doc-1', 'pn-consult-001', '客户访谈纪要', 'meeting-note', 'Dropbox / Pontnova / Consulting / interviews', '访谈问题、结论和后续信息缺口。', 0),
  ('doc-2', 'pn-fund-002', '融资 deck 草稿', 'deck', 'Dropbox / Pontnova / Fundraising / deck', '投资人版本，待补商业化证据。', 1),
  ('doc-3', 'pn-ws-004', 'Workshop 选题池', 'outline', 'Dropbox / Pontnova / Workshop / topics', 'UPC、SEP、EUIPO、反假冒四条线。', 2);
