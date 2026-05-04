-- ============================================================
-- STORAGE — buckets + policies
-- ============================================================

-- ─── Buckets ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('images',       'images',       FALSE, 10485760,   ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('models-glb',   'models-glb',   TRUE,  104857600,  ARRAY['model/gltf-binary','application/octet-stream']),
  ('models-usdz',  'models-usdz',  TRUE,  104857600,  ARRAY['model/vnd.usdz+zip','application/octet-stream']),
  ('qr-codes',     'qr-codes',     TRUE,  1048576,    ARRAY['image/png'])
ON CONFLICT (id) DO NOTHING;

-- ─── Storage Policies ─────────────────────────────────────────

-- images : upload par l'utilisateur authentifié dans son dossier
CREATE POLICY "images_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "images_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'images' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "images_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Service role peut tout faire sur images
CREATE POLICY "images_service_role"
  ON storage.objects FOR ALL
  USING (bucket_id = 'images' AND auth.role() = 'service_role');

-- models-glb : lecture publique, upload par service_role uniquement
CREATE POLICY "models_glb_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'models-glb');

CREATE POLICY "models_glb_service_role"
  ON storage.objects FOR ALL
  USING (bucket_id = 'models-glb' AND auth.role() = 'service_role');

-- models-usdz : lecture publique, upload par service_role
CREATE POLICY "models_usdz_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'models-usdz');

CREATE POLICY "models_usdz_service_role"
  ON storage.objects FOR ALL
  USING (bucket_id = 'models-usdz' AND auth.role() = 'service_role');

-- qr-codes : lecture publique, upload par service_role
CREATE POLICY "qr_codes_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qr-codes');

CREATE POLICY "qr_codes_service_role"
  ON storage.objects FOR ALL
  USING (bucket_id = 'qr-codes' AND auth.role() = 'service_role');
