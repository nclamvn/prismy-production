-- ============================================
-- ENHANCED SECURITY SETUP
-- Multi-tenant isolation, audit logging, and advanced RLS
-- ============================================

-- Create organizations table for multi-tenant support
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'standard', 'premium', 'enterprise')),
  max_members INTEGER DEFAULT 5,
  security_settings JSONB DEFAULT '{}',
  billing_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions TEXT[] DEFAULT ARRAY['read'],
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create security audit logs table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  operation TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  user_role TEXT,
  subscription_tier TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table for team collaboration
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  team_members UUID[] DEFAULT ARRAY[]::UUID[],
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'organization', 'public')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create billing records table
CREATE TABLE IF NOT EXISTS public.billing_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  subscription_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  billing_period_start DATE,
  billing_period_end DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add organization_id to existing tables
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'organization', 'public'));

ALTER TABLE public.translations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

ALTER TABLE public.usage_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON public.organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user ON public.organization_members(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON public.organization_members(status);

CREATE INDEX IF NOT EXISTS idx_security_audit_user ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_org ON public.security_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_operation ON public.security_audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON public.projects(visibility);

CREATE INDEX IF NOT EXISTS idx_billing_user ON public.billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_org ON public.billing_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON public.billing_records(status);

CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON public.documents(visibility);
CREATE INDEX IF NOT EXISTS idx_translations_org ON public.translations(organization_id);
CREATE INDEX IF NOT EXISTS idx_translations_project ON public.translations(project_id);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Organization owners can update" ON public.organizations
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- RLS policies for organization members
CREATE POLICY "Users can view organization members" ON public.organization_members
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members om2
      WHERE om2.organization_id = organization_members.organization_id
      AND om2.user_id = auth.uid()
      AND om2.status = 'active'
    )
  );

CREATE POLICY "Organization admins can manage members" ON public.organization_members
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- RLS policies for security audit logs
CREATE POLICY "Users can view own audit logs" ON public.security_audit_logs
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view org audit logs" ON public.security_audit_logs
  FOR SELECT 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = security_audit_logs.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "System can insert audit logs" ON public.security_audit_logs
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- RLS policies for projects
CREATE POLICY "Users can view accessible projects" ON public.projects
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    auth.uid() = ANY(team_members) OR
    (organization_id IS NOT NULL AND visibility IN ('organization', 'public') AND
     EXISTS (
       SELECT 1 FROM public.organization_members 
       WHERE organization_id = projects.organization_id 
       AND user_id = auth.uid() 
       AND status = 'active'
     )) OR
    visibility = 'public'
  );

CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Team members can update projects" ON public.projects
  FOR UPDATE 
  USING (auth.uid() = ANY(team_members));

-- RLS policies for billing records
CREATE POLICY "Users can view own billing" ON public.billing_records
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Organization billing access" ON public.billing_records
  FOR SELECT 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = billing_records.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "System can manage billing" ON public.billing_records
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Enhanced RLS policies for existing tables with organization support
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Enhanced document access" ON public.documents
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND visibility IN ('organization', 'public') AND
     EXISTS (
       SELECT 1 FROM public.organization_members 
       WHERE organization_id = documents.organization_id 
       AND user_id = auth.uid() 
       AND status = 'active'
     )) OR
    visibility = 'public'
  );

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Enhanced document creation" ON public.documents
  FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND
    (organization_id IS NULL OR
     EXISTS (
       SELECT 1 FROM public.organization_members 
       WHERE organization_id = documents.organization_id 
       AND user_id = auth.uid() 
       AND status = 'active'
       AND 'write' = ANY(permissions)
     ))
  );

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Enhanced document updates" ON public.documents
  FOR UPDATE 
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND
     EXISTS (
       SELECT 1 FROM public.organization_members 
       WHERE organization_id = documents.organization_id 
       AND user_id = auth.uid() 
       AND status = 'active'
       AND role IN ('admin', 'owner')
     ))
  );

-- Enhanced translation policies
DROP POLICY IF EXISTS "Users can view own translations" ON public.translations;
CREATE POLICY "Enhanced translation access" ON public.translations
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND
     EXISTS (
       SELECT 1 FROM public.organization_members 
       WHERE organization_id = translations.organization_id 
       AND user_id = auth.uid() 
       AND status = 'active'
     )) OR
    (project_id IS NOT NULL AND
     EXISTS (
       SELECT 1 FROM public.projects 
       WHERE id = translations.project_id 
       AND (user_id = auth.uid() OR auth.uid() = ANY(team_members))
     ))
  );

-- Functions for security management
CREATE OR REPLACE FUNCTION public.get_user_organizations(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  user_role TEXT,
  subscription_tier TEXT,
  member_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    om.role,
    o.subscription_tier,
    (SELECT COUNT(*) FROM public.organization_members om2 
     WHERE om2.organization_id = o.id AND om2.status = 'active')
  FROM public.organizations o
  JOIN public.organization_members om ON o.id = om.organization_id
  WHERE om.user_id = p_user_id AND om.status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.create_organization(
  p_name TEXT,
  p_domain TEXT DEFAULT NULL,
  p_subscription_tier TEXT DEFAULT 'free'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Create organization
  INSERT INTO public.organizations (name, domain, subscription_tier)
  VALUES (p_name, p_domain, p_subscription_tier)
  RETURNING id INTO org_id;

  -- Add creator as owner
  INSERT INTO public.organization_members (
    organization_id, 
    user_id, 
    role, 
    permissions,
    status,
    joined_at
  )
  VALUES (
    org_id, 
    auth.uid(), 
    'owner', 
    ARRAY['read', 'write', 'delete', 'admin'],
    'active',
    NOW()
  );

  RETURN org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_organization_member(
  p_organization_id UUID,
  p_user_email TEXT,
  p_role TEXT DEFAULT 'member',
  p_permissions TEXT[] DEFAULT ARRAY['read']
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inviter_id UUID := auth.uid();
  target_user_id UUID;
  invitation_id UUID;
BEGIN
  -- Validate inviter permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = p_organization_id 
    AND user_id = inviter_id 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to invite members';
  END IF;

  -- Find target user
  SELECT au.id INTO target_user_id
  FROM auth.users au
  WHERE au.email = p_user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_user_email;
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = p_organization_id 
    AND user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this organization';
  END IF;

  -- Create invitation
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    permissions,
    invited_by,
    status
  )
  VALUES (
    p_organization_id,
    target_user_id,
    p_role,
    p_permissions,
    inviter_id,
    'pending'
  )
  RETURNING id INTO invitation_id;

  RETURN invitation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_organization_invitation(
  p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.organization_members
  SET 
    status = 'active',
    joined_at = NOW(),
    updated_at = NOW()
  WHERE organization_id = p_organization_id
    AND user_id = auth.uid()
    AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_security_audit_logs()
RETURNS void AS $$
BEGIN
  -- Delete audit logs older than 90 days
  DELETE FROM public.security_audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_organizations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_organization_member(UUID, TEXT, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_organization_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_security_audit_logs() TO service_role;

-- Create scheduled cleanup job (if pg_cron is available)
-- SELECT cron.schedule('cleanup-security-audit', '0 3 * * *', 'SELECT public.cleanup_security_audit_logs();');

-- Sample data for development
INSERT INTO public.organizations (name, domain, subscription_tier) 
VALUES 
  ('Prismy Demo Org', 'demo.prismy.com', 'premium'),
  ('Enterprise Corp', 'enterprise.example.com', 'enterprise')
ON CONFLICT DO NOTHING;