-- ============================================================
-- Push Subscriptions for Web Push Notifications
-- Stores browser push subscription endpoints per device
-- ============================================================

CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id   TEXT NOT NULL UNIQUE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by device_id
CREATE INDEX idx_push_subs_device ON push_subscriptions(device_id);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Permissive policies (cohérent avec app_data existant)
-- L'app utilise des rôles locaux, pas toujours des sessions Supabase Auth
CREATE POLICY "push_subs_select" ON push_subscriptions
  FOR SELECT USING (true);

CREATE POLICY "push_subs_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "push_subs_update" ON push_subscriptions
  FOR UPDATE USING (true);

CREATE POLICY "push_subs_delete" ON push_subscriptions
  FOR DELETE USING (true);

-- Auto-update timestamp trigger (réutilise la fonction existante)
CREATE TRIGGER trg_push_subs_updated
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
