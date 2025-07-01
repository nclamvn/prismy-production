-- ============================================
-- INTERNATIONALIZATION (i18n) DATABASE SETUP
-- User language preferences and localization support
-- ============================================

-- Add language column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN (
  'en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'pt', 'ru', 'vi'
));

-- Add timezone column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add locale preferences to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'en' CHECK (default_language IN (
  'en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'pt', 'ru', 'vi'
));

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS supported_languages JSONB DEFAULT '["en"]';

-- Create translations table for dynamic content
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN (
    'en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'pt', 'ru', 'vi'
  )),
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(namespace, key, language)
);

-- Create user language preferences table
CREATE TABLE IF NOT EXISTS public.user_language_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN (
    'en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'pt', 'ru', 'vi'
  )),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  date_format TEXT DEFAULT 'MM/dd/yyyy',
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  number_format TEXT DEFAULT 'US' CHECK (number_format IN ('US', 'EU', 'IN')),
  currency_code TEXT DEFAULT 'USD',
  rtl_preference BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create organization language settings table
CREATE TABLE IF NOT EXISTS public.organization_language_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  default_language TEXT NOT NULL CHECK (default_language IN (
    'en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'pt', 'ru', 'vi'
  )),
  supported_languages JSONB NOT NULL DEFAULT '["en"]',
  auto_translate BOOLEAN DEFAULT false,
  translation_service TEXT DEFAULT 'openai' CHECK (translation_service IN ('openai', 'google', 'azure', 'custom')),
  enforce_language BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Create locale data table for formatting
CREATE TABLE IF NOT EXISTS public.locale_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  language_code TEXT NOT NULL UNIQUE,
  native_name TEXT NOT NULL,
  english_name TEXT NOT NULL,
  rtl BOOLEAN DEFAULT false,
  date_format TEXT NOT NULL,
  time_format TEXT NOT NULL,
  number_format JSONB NOT NULL DEFAULT '{}',
  currency_format JSONB NOT NULL DEFAULT '{}',
  plural_rules JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_translations_namespace_language ON public.translations(namespace, language);
CREATE INDEX IF NOT EXISTS idx_translations_key ON public.translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_language ON public.translations(language);
CREATE INDEX IF NOT EXISTS idx_user_language_preferences_user_id ON public.user_language_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_language_settings_org_id ON public.organization_language_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_locale_data_language_code ON public.locale_data(language_code);
CREATE INDEX IF NOT EXISTS idx_locale_data_enabled ON public.locale_data(enabled);

-- Enable RLS on all i18n tables
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_language_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locale_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for translations
CREATE POLICY "Anyone can read translations" ON public.translations
  FOR SELECT 
  TO public
  USING (true);

CREATE POLICY "System can manage translations" ON public.translations
  FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for user language preferences
CREATE POLICY "Users can manage own language preferences" ON public.user_language_preferences
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "System can manage language preferences" ON public.user_language_preferences
  FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for organization language settings
CREATE POLICY "Organization members can view language settings" ON public.organization_language_settings
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = organization_language_settings.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Organization admins can manage language settings" ON public.organization_language_settings
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = organization_language_settings.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- RLS policies for locale data
CREATE POLICY "Anyone can read enabled locale data" ON public.locale_data
  FOR SELECT 
  TO public
  USING (enabled = true);

CREATE POLICY "System can manage locale data" ON public.locale_data
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Function to get user language preference
CREATE OR REPLACE FUNCTION public.get_user_language(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_lang TEXT;
BEGIN
  -- First check user_language_preferences
  SELECT language INTO user_lang
  FROM public.user_language_preferences
  WHERE user_id = p_user_id;
  
  -- If not found, check user_profiles
  IF user_lang IS NULL THEN
    SELECT language INTO user_lang
    FROM public.user_profiles
    WHERE user_id = p_user_id;
  END IF;
  
  -- Default to English if still null
  RETURN COALESCE(user_lang, 'en');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user language preference
CREATE OR REPLACE FUNCTION public.set_user_language(
  p_user_id UUID,
  p_language TEXT,
  p_timezone TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Validate language code
  IF p_language NOT IN ('en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'pt', 'ru', 'vi') THEN
    RAISE EXCEPTION 'Invalid language code: %', p_language;
  END IF;

  -- Update or insert language preferences
  INSERT INTO public.user_language_preferences (
    user_id, language, timezone, updated_at
  )
  VALUES (
    p_user_id, p_language, COALESCE(p_timezone, 'UTC'), NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    language = EXCLUDED.language,
    timezone = COALESCE(EXCLUDED.timezone, user_language_preferences.timezone),
    updated_at = NOW();

  -- Also update user_profiles for backward compatibility
  UPDATE public.user_profiles
  SET 
    language = p_language,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization supported languages
CREATE OR REPLACE FUNCTION public.get_organization_languages(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
  supported_langs JSONB;
BEGIN
  SELECT supported_languages INTO supported_langs
  FROM public.organization_language_settings
  WHERE organization_id = p_organization_id;
  
  -- Default to English if not found
  RETURN COALESCE(supported_langs, '["en"]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get translation
CREATE OR REPLACE FUNCTION public.get_translation(
  p_namespace TEXT,
  p_key TEXT,
  p_language TEXT DEFAULT 'en'
)
RETURNS TEXT AS $$
DECLARE
  translation_value TEXT;
BEGIN
  -- Try to get translation in requested language
  SELECT value INTO translation_value
  FROM public.translations
  WHERE namespace = p_namespace
    AND key = p_key
    AND language = p_language;
  
  -- If not found, try English as fallback
  IF translation_value IS NULL AND p_language != 'en' THEN
    SELECT value INTO translation_value
    FROM public.translations
    WHERE namespace = p_namespace
      AND key = p_key
      AND language = 'en';
  END IF;
  
  -- Return the key if no translation found
  RETURN COALESCE(translation_value, p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_language(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_language(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_languages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_translation(TEXT, TEXT, TEXT) TO authenticated;

-- Insert default locale data
INSERT INTO public.locale_data (
  language_code, native_name, english_name, rtl, date_format, time_format,
  number_format, currency_format, plural_rules
) VALUES 
  ('en', 'English', 'English', false, 'MM/dd/yyyy', '12h', 
   '{"decimal": ".", "thousands": ","}', '{"symbol": "$", "position": "before"}', 
   '{"zero": "other", "one": "one", "two": "other", "few": "other", "many": "other", "other": "other"}'),
  ('es', 'Español', 'Spanish', false, 'dd/MM/yyyy', '24h',
   '{"decimal": ",", "thousands": "."}', '{"symbol": "€", "position": "after"}',
   '{"zero": "other", "one": "one", "two": "other", "few": "other", "many": "other", "other": "other"}'),
  ('fr', 'Français', 'French', false, 'dd/MM/yyyy', '24h',
   '{"decimal": ",", "thousands": " "}', '{"symbol": "€", "position": "after"}',
   '{"zero": "one", "one": "one", "two": "other", "few": "other", "many": "other", "other": "other"}'),
  ('de', 'Deutsch', 'German', false, 'dd.MM.yyyy', '24h',
   '{"decimal": ",", "thousands": "."}', '{"symbol": "€", "position": "after"}',
   '{"zero": "other", "one": "one", "two": "other", "few": "other", "many": "other", "other": "other"}'),
  ('zh', '中文', 'Chinese', false, 'yyyy/MM/dd', '24h',
   '{"decimal": ".", "thousands": ","}', '{"symbol": "¥", "position": "before"}',
   '{"zero": "other", "one": "other", "two": "other", "few": "other", "many": "other", "other": "other"}'),
  ('ja', '日本語', 'Japanese', false, 'yyyy/MM/dd', '24h',
   '{"decimal": ".", "thousands": ","}', '{"symbol": "¥", "position": "before"}',
   '{"zero": "other", "one": "other", "two": "other", "few": "other", "many": "other", "other": "other"}'),
  ('ko', '한국어', 'Korean', false, 'yyyy. MM. dd.', '24h',
   '{"decimal": ".", "thousands": ","}', '{"symbol": "₩", "position": "before"}',
   '{"zero": "other", "one": "other", "two": "other", "few": "other", "many": "other", "other": "other"}'),
  ('ar', 'العربية', 'Arabic', true, 'dd/MM/yyyy', '12h',
   '{"decimal": ".", "thousands": ","}', '{"symbol": "ر.س", "position": "before"}',
   '{"zero": "zero", "one": "one", "two": "two", "few": "few", "many": "many", "other": "other"}'),
  ('pt', 'Português', 'Portuguese', false, 'dd/MM/yyyy', '24h',
   '{"decimal": ",", "thousands": "."}', '{"symbol": "R$", "position": "before"}',
   '{"zero": "other", "one": "one", "two": "other", "few": "other", "many": "other", "other": "other"}'),
  ('ru', 'Русский', 'Russian', false, 'dd.MM.yyyy', '24h',
   '{"decimal": ",", "thousands": " "}', '{"symbol": "₽", "position": "after"}',
   '{"zero": "many", "one": "one", "two": "few", "few": "few", "many": "many", "other": "other"}'),
  ('vi', 'Tiếng Việt', 'Vietnamese', false, 'dd/MM/yyyy', '24h',
   '{"decimal": ",", "thousands": "."}', '{"symbol": "₫", "position": "after"}',
   '{"zero": "other", "one": "other", "two": "other", "few": "other", "many": "other", "other": "other"}')
ON CONFLICT (language_code) DO UPDATE SET
  native_name = EXCLUDED.native_name,
  english_name = EXCLUDED.english_name,
  updated_at = NOW();

-- Insert some sample translations for common UI elements
INSERT INTO public.translations (namespace, key, language, value) VALUES
  ('common', 'welcome', 'en', 'Welcome'),
  ('common', 'welcome', 'es', 'Bienvenido'),
  ('common', 'welcome', 'fr', 'Bienvenue'),
  ('common', 'welcome', 'de', 'Willkommen'),
  ('common', 'welcome', 'zh', '欢迎'),
  ('common', 'welcome', 'ja', 'ようこそ'),
  ('common', 'welcome', 'ko', '환영합니다'),
  ('common', 'welcome', 'ar', 'مرحبا'),
  ('common', 'welcome', 'pt', 'Bem-vindo'),
  ('common', 'welcome', 'ru', 'Добро пожаловать'),
  ('common', 'welcome', 'vi', 'Chào mừng'),
  
  ('common', 'loading', 'en', 'Loading...'),
  ('common', 'loading', 'es', 'Cargando...'),
  ('common', 'loading', 'fr', 'Chargement...'),
  ('common', 'loading', 'de', 'Laden...'),
  ('common', 'loading', 'zh', '加载中...'),
  ('common', 'loading', 'ja', '読み込み中...'),
  ('common', 'loading', 'ko', '로딩 중...'),
  ('common', 'loading', 'ar', 'جاري التحميل...'),
  ('common', 'loading', 'pt', 'Carregando...'),
  ('common', 'loading', 'ru', 'Загрузка...'),
  ('common', 'loading', 'vi', 'Đang tải...')
ON CONFLICT (namespace, key, language) DO NOTHING;