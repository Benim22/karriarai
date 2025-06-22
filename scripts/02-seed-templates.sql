-- Insert default CV templates
INSERT INTO cv_templates (name, category, preview_image, is_premium, styles) VALUES
(
  'Klassisk Professionell',
  'traditional',
  '/templates/classic-professional.png',
  false,
  '{
    "fontFamily": "Inter",
    "fontSize": "14px",
    "primaryColor": "#1f2937",
    "secondaryColor": "#6b7280",
    "accentColor": "#3b82f6",
    "backgroundColor": "#ffffff",
    "headerStyle": "simple",
    "sectionSpacing": "medium"
  }'
),
(
  'Modern Minimalist',
  'modern',
  '/templates/modern-minimalist.png',
  false,
  '{
    "fontFamily": "Inter",
    "fontSize": "14px",
    "primaryColor": "#111827",
    "secondaryColor": "#6b7280",
    "accentColor": "#10b981",
    "backgroundColor": "#ffffff",
    "headerStyle": "modern",
    "sectionSpacing": "large"
  }'
),
(
  'Kreativ Designer',
  'creative',
  '/templates/creative-designer.png',
  true,
  '{
    "fontFamily": "Inter",
    "fontSize": "14px",
    "primaryColor": "#7c3aed",
    "secondaryColor": "#a78bfa",
    "accentColor": "#f59e0b",
    "backgroundColor": "#fefefe",
    "headerStyle": "creative",
    "sectionSpacing": "medium"
  }'
),
(
  'Teknisk Expert',
  'modern',
  '/templates/tech-expert.png',
  true,
  '{
    "fontFamily": "JetBrains Mono",
    "fontSize": "13px",
    "primaryColor": "#0f172a",
    "secondaryColor": "#475569",
    "accentColor": "#0ea5e9",
    "backgroundColor": "#ffffff",
    "headerStyle": "tech",
    "sectionSpacing": "compact"
  }'
);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
