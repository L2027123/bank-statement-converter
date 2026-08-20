-- ============================================================
--  S1 — Signed URL 上线迁移
--  作用：
--   1. exports / statements bucket 改为 private（公开URL失效）
--   2. 删除 exports 公开读 policy，防止匿名下载
--   3. 补充 exports 的 RLS（用户只能读/写自己文件夹下的文件）
--   4. /api/signed-url 接口使用 service role 发 5 分钟有效期签名链接
--
--  执行位置：Supabase Dashboard → SQL Editor → New query
--  执行顺序：先跑这个 SQL，再部署代码（代码已就绪）
-- ============================================================

-- ---------- 1. Buckets 改为 private ----------
UPDATE storage.buckets
SET public = false
WHERE name IN ('exports', 'statements');

-- ---------- 2. 删除 exports 公开读 policy（如果存在） ----------
DROP POLICY IF EXISTS "exports_storage_public_read" ON storage.objects;

-- ---------- 3. exports bucket 补齐 RLS 策略（幂等：用 DO 块处理 CREATE IF NOT EXISTS 语义） ----------
DO $$
BEGIN
  -- 3.1 read own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'exports_storage_read_own'
  ) THEN
    CREATE POLICY "exports_storage_read_own" ON storage.objects
      FOR SELECT USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- 3.2 write own (insert)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'exports_storage_write_own'
  ) THEN
    CREATE POLICY "exports_storage_write_own" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- 3.3 update own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'exports_storage_update_own'
  ) THEN
    CREATE POLICY "exports_storage_update_own" ON storage.objects
      FOR UPDATE USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- 3.4 delete own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'exports_storage_delete_own'
  ) THEN
    CREATE POLICY "exports_storage_delete_own" ON storage.objects
      FOR DELETE USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- 3.5 statements delete policy（以防之前漏了）
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'statements_storage_delete_own'
  ) THEN
    CREATE POLICY "statements_storage_delete_own" ON storage.objects
      FOR DELETE USING (bucket_id = 'statements' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

-- ---------- 4. 验证 ----------
-- 4.1 buckets 状态（exports & statements 都应该是 public=false）
SELECT name, public FROM storage.buckets WHERE name IN ('exports', 'statements');

-- 4.2 storage.objects 上关于两个 bucket 的 policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND (qual LIKE '%exports%' OR qual LIKE '%statements%'
    OR with_check LIKE '%exports%' OR with_check LIKE '%statements%')
ORDER BY policyname;
