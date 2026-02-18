-- ============================================================
-- Phase 3: Supabase Schema for Registre d'Émargement Digital
-- Police Municipale — Gestion des machines et signatures
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ORGANISATIONS
-- ============================================================
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  nom             TEXT NOT NULL DEFAULT '',
  matricule       TEXT DEFAULT '',
  telephone       TEXT DEFAULT '',
  role            TEXT NOT NULL DEFAULT 'agent'
                  CHECK (role IN ('agent', 'armurier', 'chef', 'responsable', 'admin')),
  pin_hash        TEXT,           -- bcrypt hash for agent PIN auth
  is_asvp         BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- CATEGORIES DE MATERIEL
-- ============================================================
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nom             TEXT NOT NULL,
  emoji           TEXT DEFAULT '🔧',
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_org ON categories(organization_id);

-- ============================================================
-- MACHINES / MATERIEL
-- ============================================================
CREATE TABLE machines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  nom             TEXT NOT NULL DEFAULT '',
  reference       TEXT DEFAULT '',
  sort_order      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_machines_org ON machines(organization_id);
CREATE INDEX idx_machines_cat ON machines(category_id);

-- ============================================================
-- REGISTRES JOURNALIERS
-- ============================================================
CREATE TABLE daily_registers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  -- Info du jour
  entreprise      TEXT DEFAULT '',
  ref_chantier    TEXT DEFAULT '',
  responsable     TEXT DEFAULT '',
  adresse         TEXT DEFAULT '',
  page_number     INTEGER DEFAULT 1,
  -- Visa responsable (signatures base64 PNG)
  visa_matin      TEXT,          -- base64 signature
  visa_matin_signer JSONB,      -- {label, nom}
  visa_soir       TEXT,          -- base64 signature
  visa_soir_signer  JSONB,      -- {label, nom}
  -- Présents verrouillés
  locked_matin_presents UUID[] DEFAULT '{}',
  locked_soir_presents  UUID[] DEFAULT '{}',
  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  -- One register per org per day
  UNIQUE(organization_id, date)
);

CREATE INDEX idx_registers_org_date ON daily_registers(organization_id, date);

-- ============================================================
-- ÉMARGEMENTS (signatures individuelles des agents)
-- ============================================================
CREATE TABLE emargements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  register_id     UUID NOT NULL REFERENCES daily_registers(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period          TEXT NOT NULL CHECK (period IN ('matin', 'soir')),
  -- Signature
  signature       TEXT,          -- base64 PNG or Storage path
  heure           TEXT,          -- "08:15"
  -- Machines (matin: machines prises, soir: machines rendues)
  machines        JSONB DEFAULT '[]',
  -- Soir: retours détaillés
  returns         JSONB DEFAULT '{}',
  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  -- One entry per agent per period per register
  UNIQUE(register_id, profile_id, period)
);

CREATE INDEX idx_emargements_register ON emargements(register_id);
CREATE INDEX idx_emargements_profile ON emargements(profile_id);

-- ============================================================
-- COMPTES-RENDUS DE MISSION (vocal reports)
-- ============================================================
CREATE TABLE vocal_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date            DATE NOT NULL,
  heure           TEXT,
  lieu            TEXT DEFAULT '',
  objet           TEXT DEFAULT '',
  contenu         TEXT NOT NULL DEFAULT '',
  agent_name      TEXT DEFAULT '',
  matricule       TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocal_org_date ON vocal_reports(organization_id, date);

-- ============================================================
-- SUPABASE STORAGE: Bucket pour les signatures PNG
-- ============================================================
-- Note: Execute this via Supabase Dashboard or API:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('signatures', 'signatures', false);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emargements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocal_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: Organizations
-- ============================================================
-- Users can see their own organization
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Only admins can update their organization
CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- RLS POLICIES: Profiles
-- ============================================================
-- Users can see profiles in their organization
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Chef/admin can update profiles in their org
CREATE POLICY "profiles_update_chef" ON profiles
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('chef', 'admin', 'responsable')
    )
  );

-- Chef/admin can insert profiles in their org
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('chef', 'admin', 'responsable')
    )
  );

-- ============================================================
-- RLS POLICIES: Categories
-- ============================================================
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "categories_manage" ON categories
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('chef', 'admin', 'responsable', 'armurier')
    )
  );

-- ============================================================
-- RLS POLICIES: Machines
-- ============================================================
CREATE POLICY "machines_select" ON machines
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "machines_manage" ON machines
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('chef', 'admin', 'responsable', 'armurier')
    )
  );

-- ============================================================
-- RLS POLICIES: Daily Registers
-- ============================================================
CREATE POLICY "registers_select" ON daily_registers
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "registers_manage" ON daily_registers
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('chef', 'admin', 'responsable', 'armurier')
    )
  );

-- ============================================================
-- RLS POLICIES: Emargements
-- ============================================================
-- All org members can see emargements
CREATE POLICY "emargements_select" ON emargements
  FOR SELECT USING (
    register_id IN (
      SELECT id FROM daily_registers
      WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Agents can create their own emargements
CREATE POLICY "emargements_insert_self" ON emargements
  FOR INSERT WITH CHECK (
    profile_id = auth.uid()
  );

-- Chef/armurier can manage all emargements in their org
CREATE POLICY "emargements_manage" ON emargements
  FOR ALL USING (
    register_id IN (
      SELECT id FROM daily_registers
      WHERE organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid() AND role IN ('chef', 'admin', 'responsable', 'armurier')
      )
    )
  );

-- ============================================================
-- RLS POLICIES: Vocal Reports
-- ============================================================
CREATE POLICY "vocal_select" ON vocal_reports
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "vocal_insert" ON vocal_reports
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "vocal_update_own" ON vocal_reports
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "vocal_delete_own" ON vocal_reports
  FOR DELETE USING (
    author_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('chef', 'admin', 'responsable')
    )
  );

-- ============================================================
-- RLS POLICIES: Storage (signatures bucket)
-- ============================================================
-- Note: Apply these via Supabase Dashboard > Storage > Policies
-- SELECT: org members can read
-- INSERT: authenticated users can upload to their org path
-- DELETE: chef/admin only

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_registers_updated
  BEFORE UPDATE ON daily_registers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vocal_updated
  BEFORE UPDATE ON vocal_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
