-- ============================================================
-- RLS POLICIES — à exécuter après les migrations
-- ============================================================

-- ─── USERS ───────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ─── MODELS_3D ────────────────────────────────────────────────
ALTER TABLE public.models_3d ENABLE ROW LEVEL SECURITY;

CREATE POLICY "models_select_own"
  ON public.models_3d FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "models_insert_own"
  ON public.models_3d FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "models_update_own"
  ON public.models_3d FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "models_delete_own"
  ON public.models_3d FOR DELETE
  USING (auth.uid() = user_id);

-- Service role peut tout modifier (worker-ai)
CREATE POLICY "models_service_role_all"
  ON public.models_3d FOR ALL
  USING (auth.role() = 'service_role');

-- ─── AR_LINKS ─────────────────────────────────────────────────
ALTER TABLE public.ar_links ENABLE ROW LEVEL SECURITY;

-- Lecture publique des liens actifs
CREATE POLICY "ar_links_select_public"
  ON public.ar_links FOR SELECT
  USING (is_public = TRUE AND is_active = TRUE);

-- Lecture de ses propres liens (même inactifs)
CREATE POLICY "ar_links_select_own"
  ON public.ar_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ar_links_insert_own"
  ON public.ar_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ar_links_update_own"
  ON public.ar_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ar_links_delete_own"
  ON public.ar_links FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "ar_links_service_role_all"
  ON public.ar_links FOR ALL
  USING (auth.role() = 'service_role');

-- ─── ANALYTICS ────────────────────────────────────────────────
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut insérer un scan (public)
CREATE POLICY "analytics_insert_public"
  ON public.analytics FOR INSERT
  WITH CHECK (TRUE);

-- Lecture uniquement par le propriétaire du lien
CREATE POLICY "analytics_select_own"
  ON public.analytics FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.ar_links WHERE id = ar_link_id
    )
  );

CREATE POLICY "analytics_service_role_all"
  ON public.analytics FOR ALL
  USING (auth.role() = 'service_role');
