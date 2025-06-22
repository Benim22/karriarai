import { supabase } from './supabase'
import { CVTemplate, CVStyles } from '@/types/cv'

export interface CVTemplateWithStats extends CVTemplate {
  downloads?: number
  rating?: number
  tags?: string[]
  industry?: string
}

// Hämta alla CV-mallar från databasen
export async function getCVTemplates(): Promise<CVTemplateWithStats[]> {
  console.log('🔍 getCVTemplates called')
  
  try {
    console.log('📡 Fetching from Supabase...')
    const { data, error } = await supabase
      .from('cv_templates')
      .select('*')
      .order('created_at', { ascending: true })

    console.log('📊 Supabase response:', { data: data?.length, error })

    if (error) {
      console.error('❌ Error fetching CV templates:', error)
      console.log('🔄 Falling back to default templates')
      return getDefaultTemplates()
    }

    if (!data || data.length === 0) {
      console.log('📭 No templates found in database, using defaults')
      return getDefaultTemplates()
    }

    console.log('✅ Processing', data.length, 'templates from database')
    
    const processedTemplates = data.map((template, index) => {
      console.log('🔧 Processing template:', template.name, template.category)
      return {
        id: template.id, // Använd UUID från databas
        name: template.name,
        category: mapDatabaseCategoryToAppCategory(template.category),
        previewImage: template.preview_image_url || '/placeholder.jpg',
        isPremium: template.is_premium || false,
        styles: convertTemplateDataToStyles(template.template_data),
        downloads: Math.floor(Math.random() * 3000) + 1000, // Mock data
        rating: 4.5 + Math.random() * 0.5, // Mock data
        tags: getTagsForTemplate(template.name, template.category),
        industry: getIndustryForCategory(mapDatabaseCategoryToAppCategory(template.category))
      }
    })

    console.log('🎉 Returning', processedTemplates.length, 'database templates')
    return processedTemplates

  } catch (error) {
    console.error('💥 Error in getCVTemplates:', error)
    console.log('🔄 Falling back to default templates')
    return getDefaultTemplates()
  }
}

// Hämta en specifik CV-mall
export async function getCVTemplate(id: string): Promise<CVTemplate | null> {
  console.log('🔍 getCVTemplate called with ID:', id)
  
  // Först, försök hitta i default templates (för bakåtkompatibilitet)
  const defaultTemplates = getDefaultTemplates()
  const defaultTemplate = defaultTemplates.find(t => t.id === id)
  
  if (defaultTemplate) {
    console.log('✅ Found template in defaults:', defaultTemplate.name)
    return {
      id: defaultTemplate.id,
      name: defaultTemplate.name,
      category: defaultTemplate.category,
      previewImage: defaultTemplate.previewImage,
      isPremium: defaultTemplate.isPremium,
      styles: defaultTemplate.styles
    }
  }
  
  // Om inte i defaults, försök databas (för UUID-baserade ID:n)
  try {
    const { data, error } = await supabase
      .from('cv_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching CV template from database:', error)
      console.log('❌ Template not found in database or defaults')
      return null
    }

    console.log('✅ Template found in database:', data.name)
    return {
      id: data.id,
      name: data.name,
      category: mapDatabaseCategoryToAppCategory(data.category),
      previewImage: data.preview_image_url || '/placeholder.jpg',
      isPremium: data.is_premium || false,
      styles: convertTemplateDataToStyles(data.template_data)
    }

  } catch (error) {
    console.error('Error in getCVTemplate:', error)
    return null
  }
}

// Fallback mallar som backup (använder enkla ID:n för kompatibilitet)
function getDefaultTemplates(): CVTemplateWithStats[] {
  console.log('🔄 Using default/fallback templates')
  return [
    {
      id: 'default-1',
      name: 'Klassisk Professionell',
      category: 'traditional',
      previewImage: '/templates/classic-professional.png',
      isPremium: false,
      styles: {
        fontFamily: "Inter",
        fontSize: "14px",
        primaryColor: "#1f2937",
        secondaryColor: "#6b7280",
        accentColor: "#3b82f6",
        backgroundColor: "#ffffff",
        headerStyle: "simple",
        sectionSpacing: "medium",
        layout: "single-column",
        sectionStyle: "underlined",
        headerPosition: "top"
      },
      downloads: 2847,
      rating: 4.9,
      tags: ["Klassisk", "Professionell", "ATS-vänlig"],
      industry: "Finans & Juridik"
    },
    {
      id: 'default-2',
      name: 'Modern Minimalist',
      category: 'modern',
      previewImage: '/templates/modern-minimalist.png',
      isPremium: false,
      styles: {
        fontFamily: "Inter",
        fontSize: "14px",
        primaryColor: "#111827",
        secondaryColor: "#6b7280",
        accentColor: "#10b981",
        backgroundColor: "#ffffff",
        headerStyle: "modern",
        sectionSpacing: "large",
        layout: "two-column",
        sectionStyle: "minimal",
        headerPosition: "center"
      },
      downloads: 1923,
      rating: 4.8,
      tags: ["Modern", "Minimalistisk", "Ren"],
      industry: "IT & Tech"
    },
    {
      id: 'default-3',
      name: 'Kreativ Designer',
      category: 'creative',
      previewImage: '/templates/creative-designer.png',
      isPremium: true,
      styles: {
        fontFamily: "Inter",
        fontSize: "14px",
        primaryColor: "#7c3aed",
        secondaryColor: "#a78bfa",
        accentColor: "#f59e0b",
        backgroundColor: "#fefefe",
        headerStyle: "creative",
        sectionSpacing: "medium",
        layout: "sidebar-left",
        sectionStyle: "boxed",
        headerPosition: "left"
      },
      downloads: 3421,
      rating: 4.9,
      tags: ["Kreativ", "Färgrik", "Unik"],
      industry: "Design & Media"
    },
    {
      id: 'default-4',
      name: 'Teknisk Expert',
      category: 'modern',
      previewImage: '/templates/tech-expert.png',
      isPremium: true,
      styles: {
        fontFamily: "JetBrains Mono",
        fontSize: "13px",
        primaryColor: "#0f172a",
        secondaryColor: "#475569",
        accentColor: "#0ea5e9",
        backgroundColor: "#ffffff",
        headerStyle: "tech",
        sectionSpacing: "compact",
        layout: "timeline",
        sectionStyle: "bordered",
        headerPosition: "top"
      },
      downloads: 1456,
      rating: 4.7,
      tags: ["Tech", "Monospace", "Kodare"],
      industry: "IT & Tech"
    },
    {
      id: 'default-5',
      name: 'Executive Premium',
      category: 'traditional',
      previewImage: '/templates/executive-premium.png',
      isPremium: true,
      styles: {
        fontFamily: "Georgia",
        fontSize: "14px",
        primaryColor: "#1a1a1a",
        secondaryColor: "#666666",
        accentColor: "#b8860b",
        backgroundColor: "#ffffff",
        headerStyle: "simple",
        sectionSpacing: "large",
        layout: "sidebar-right",
        sectionStyle: "minimal",
        headerPosition: "center"
      },
      downloads: 2156,
      rating: 4.8,
      tags: ["Executive", "Premium", "Elegant"],
      industry: "Ledning & Management"
    },
    {
      id: 'default-6',
      name: 'Startup Innovatör',
      category: 'modern',
      previewImage: '/templates/startup-innovator.png',
      isPremium: false,
      styles: {
        fontFamily: "Inter",
        fontSize: "14px",
        primaryColor: "#1e293b",
        secondaryColor: "#64748b",
        accentColor: "#06b6d4",
        backgroundColor: "#ffffff",
        headerStyle: "modern",
        sectionSpacing: "medium",
        layout: "two-column",
        sectionStyle: "boxed",
        headerPosition: "top"
      },
      downloads: 1834,
      rating: 4.6,
      tags: ["Startup", "Innovation", "Modern"],
      industry: "Entreprenörskap"
    }
  ]
}

// Hjälpfunktioner för att mappa databas-data till app-format
function mapDatabaseCategoryToAppCategory(dbCategory: string): 'traditional' | 'modern' | 'creative' {
  const categoryMap: Record<string, 'traditional' | 'modern' | 'creative'> = {
    'professional': 'traditional',
    'executive': 'traditional',
    'academic': 'traditional',
    'tech': 'modern',
    'sales': 'modern',
    'creative': 'creative'
  }
  
  return categoryMap[dbCategory] || 'modern'
}

function convertTemplateDataToStyles(templateData: any): CVStyles {
  // Konvertera databas template_data till CVStyles format
  if (!templateData) {
    return getDefaultStyles()
  }

  const colors = templateData.colors || ['#3b82f6', '#1f2937']
  const layout = templateData.layout || 'modern'

  return {
    fontFamily: "Inter",
    fontSize: "14px",
    primaryColor: colors[1] || "#1f2937",
    secondaryColor: "#6b7280",
    accentColor: colors[0] || "#3b82f6",
    backgroundColor: "#ffffff",
    headerStyle: mapLayoutToHeaderStyle(layout),
    sectionSpacing: "medium",
    layout: "single-column",
    sectionStyle: "minimal",
    headerPosition: "top"
  }
}

function mapLayoutToHeaderStyle(layout: string): 'simple' | 'modern' | 'creative' | 'tech' {
  const layoutMap: Record<string, 'simple' | 'modern' | 'creative' | 'tech'> = {
    'traditional': 'simple',
    'modern': 'modern',
    'creative': 'creative',
    'tech': 'tech'
  }
  
  return layoutMap[layout] || 'modern'
}

function getDefaultStyles(): CVStyles {
  return {
    fontFamily: "Inter",
    fontSize: "14px",
    primaryColor: "#1f2937",
    secondaryColor: "#6b7280",
    accentColor: "#3b82f6",
    backgroundColor: "#ffffff",
    headerStyle: "modern",
    sectionSpacing: "medium",
    layout: "single-column",
    sectionStyle: "minimal",
    headerPosition: "top"
  }
}

function getTagsForTemplate(name: string, category: string): string[] {
  const baseTags = {
    'traditional': ['Klassisk', 'Professionell', 'ATS-vänlig'],
    'modern': ['Modern', 'Minimalistisk', 'Ren'],
    'creative': ['Kreativ', 'Färgrik', 'Unik']
  }

  const tags = baseTags[category as keyof typeof baseTags] || ['Professionell']
  
  if (name.toLowerCase().includes('tech')) {
    tags.push('Tech', 'Kodare')
  }
  if (name.toLowerCase().includes('designer')) {
    tags.push('Designer', 'Visuell')
  }
  
  return tags
}

function getIndustryForCategory(category: string): string {
  const industries = {
    'traditional': 'Finans & Juridik',
    'modern': 'IT & Tech',
    'creative': 'Design & Media'
  }
  
  return industries[category as keyof typeof industries] || 'Alla branscher'
}

// Filtrera mallar baserat på bransch
export function filterTemplatesByIndustry(
  templates: CVTemplateWithStats[], 
  industry: string
): CVTemplateWithStats[] {
  if (industry === 'Alla') {
    return templates
  }
  
  return templates.filter(template => template.industry === industry)
}

// Sök mallar baserat på namn eller tags
export function searchTemplates(
  templates: CVTemplateWithStats[], 
  query: string
): CVTemplateWithStats[] {
  if (!query.trim()) {
    return templates
  }
  
  const lowercaseQuery = query.toLowerCase()
  
  return templates.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    template.industry?.toLowerCase().includes(lowercaseQuery)
  )
}

// Hämta anpassade mallar för Enterprise-användare
export async function getCustomTemplates(userId: string): Promise<CVTemplateWithStats[]> {
  console.log('🔍 getCustomTemplates called for user:', userId)
  
  try {
    // Kontrollera att användaren har Enterprise-prenumeration
    const { data: profile } = await supabase
      .from('karriar_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (profile?.subscription_tier !== 'enterprise') {
      console.log('❌ User does not have Enterprise subscription')
      return []
    }

    const { data, error } = await supabase
      .from('custom_cv_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching custom templates:', error)
      return []
    }

    if (!data || data.length === 0) {
      console.log('📭 No custom templates found')
      return []
    }

    console.log('✅ Processing', data.length, 'custom templates')
    
    const processedTemplates = data.map((template) => ({
      id: template.id,
      name: template.name,
      category: 'custom' as const,
      previewImage: template.preview_image_url || '/templates/custom-template.png',
      isPremium: true,
      styles: convertTemplateDataToStyles(template.template_data),
      downloads: 0, // Custom templates don't have downloads
      rating: 5.0, // Custom templates get max rating
      tags: ['Anpassad', 'Enterprise', 'Unik'],
      industry: 'Anpassad'
    }))

    console.log('🎉 Returning', processedTemplates.length, 'custom templates')
    return processedTemplates

  } catch (error) {
    console.error('💥 Error in getCustomTemplates:', error)
    return []
  }
}

// Skapa anpassad mall för Enterprise-användare
export async function createCustomTemplate(
  userId: string, 
  templateData: {
    name: string
    description?: string
    styles: CVStyles
    previewImageUrl?: string
  }
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  console.log('🔍 createCustomTemplate called for user:', userId)
  
  try {
    // Kontrollera att användaren har Enterprise-prenumeration
    const { data: profile } = await supabase
      .from('karriar_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (profile?.subscription_tier !== 'enterprise') {
      return { success: false, error: 'Enterprise subscription required' }
    }

    const { data, error } = await supabase
      .from('custom_cv_templates')
      .insert({
        user_id: userId,
        name: templateData.name,
        description: templateData.description || '',
        template_data: templateData.styles,
        preview_image_url: templateData.previewImageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating custom template:', error)
      return { success: false, error: 'Failed to create template' }
    }

    console.log('✅ Custom template created successfully:', data.id)
    return { success: true, templateId: data.id }

  } catch (error) {
    console.error('💥 Error in createCustomTemplate:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Uppdatera anpassad mall
export async function updateCustomTemplate(
  userId: string,
  templateId: string,
  templateData: {
    name?: string
    description?: string
    styles?: CVStyles
    previewImageUrl?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Kontrollera att mallen tillhör användaren
    const { data: existingTemplate } = await supabase
      .from('custom_cv_templates')
      .select('user_id')
      .eq('id', templateId)
      .single()

    if (!existingTemplate || existingTemplate.user_id !== userId) {
      return { success: false, error: 'Template not found or access denied' }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (templateData.name) updateData.name = templateData.name
    if (templateData.description) updateData.description = templateData.description
    if (templateData.styles) updateData.template_data = templateData.styles
    if (templateData.previewImageUrl) updateData.preview_image_url = templateData.previewImageUrl

    const { error } = await supabase
      .from('custom_cv_templates')
      .update(updateData)
      .eq('id', templateId)

    if (error) {
      console.error('❌ Error updating custom template:', error)
      return { success: false, error: 'Failed to update template' }
    }

    console.log('✅ Custom template updated successfully')
    return { success: true }

  } catch (error) {
    console.error('💥 Error in updateCustomTemplate:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Ta bort anpassad mall
export async function deleteCustomTemplate(
  userId: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Kontrollera att mallen tillhör användaren
    const { data: existingTemplate } = await supabase
      .from('custom_cv_templates')
      .select('user_id')
      .eq('id', templateId)
      .single()

    if (!existingTemplate || existingTemplate.user_id !== userId) {
      return { success: false, error: 'Template not found or access denied' }
    }

    const { error } = await supabase
      .from('custom_cv_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.error('❌ Error deleting custom template:', error)
      return { success: false, error: 'Failed to delete template' }
    }

    console.log('✅ Custom template deleted successfully')
    return { success: true }

  } catch (error) {
    console.error('💥 Error in deleteCustomTemplate:', error)
    return { success: false, error: 'Internal server error' }
  }
} 