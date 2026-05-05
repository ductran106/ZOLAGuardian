-- Hai nhóm hay có tin — bật watch + tên mẫu (sửa name trên WebUI nếu cần)
INSERT INTO watch_groups (group_id, name, admin_ids, alert_group_id, enabled)
VALUES
  ('2718828458346611005', 'Nhom hot 1', '[]', '', 1),
  ('8912027696462383403', 'Nhom hot 2', '[]', '', 1)
ON CONFLICT(group_id) DO UPDATE SET
  enabled = 1,
  name = excluded.name;
