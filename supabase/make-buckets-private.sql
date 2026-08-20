-- S1.1: 把 exports 和 statements bucket 改为 private
-- 公开 URL 不再生效，必须用 signed URL 访问
UPDATE storage.buckets
SET public = false
WHERE name IN ('exports', 'statements');

-- 验证
SELECT name, public FROM storage.buckets WHERE name IN ('exports', 'statements');
