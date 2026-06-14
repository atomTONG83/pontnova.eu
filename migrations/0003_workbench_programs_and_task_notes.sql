PRAGMA foreign_keys = ON;

ALTER TABLE tasks ADD COLUMN notes TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS programs (
  type TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  prefix TEXT NOT NULL DEFAULT '',
  accent TEXT NOT NULL DEFAULT '',
  kicker TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  mark TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO programs (type, label, prefix, accent, kicker, title, description, mark, sort_order) VALUES
  ('consulting', '咨询', 'CONS', '#1d6b5e', 'CONS · CONSULTING', '咨询项目', '市场进入、竞争风险、IP 策略与跨境业务判断。', '咨', 0),
  ('fundraising', '投融资', 'FUND', '#547a9b', 'FUND · FINANCE', '投融资项目', '技术尽调、投资人材料、商业叙事和壁垒表达。', '融', 1),
  ('training', '培训', 'TRN', '#8b6f2f', 'TRN · TRAINING', '培训项目', '管理层课程、案例设计、内部 IP 能力建设。', '训', 2),
  ('workshop', 'Workshop', 'WS', '#7f466d', 'WS · WORKSHOP', 'Workshop 项目', '公开活动、主题策划、嘉宾协同和报名转化。', '坊', 3),
  ('operations', '运营', 'OPS', '#667d51', 'OPS · OPERATIONS', '运营项目', '内部运营、资料建设、流程优化和长期维护。', '营', 4);
