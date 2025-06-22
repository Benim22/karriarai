import React from 'react'
import { CVStyles } from '@/types/cv'
import { CVTemplate } from '@/lib/cv-templates'

interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  summary: string
}

interface Experience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface Education {
  id: string
  degree: string
  school: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface Skill {
  id: string
  name: string
  level: 'Nybörjare' | 'Medel' | 'Avancerad' | 'Expert'
}

interface CVData {
  personalInfo: PersonalInfo
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
  languages: string[]
  certifications: string[]
}

interface CVTemplatePreviewProps {
  name?: string
  styles?: CVStyles
  template?: CVTemplate
  cvData?: CVData
  className?: string
}

export function CVTemplatePreview({ name, styles, template, cvData, className = "" }: CVTemplatePreviewProps) {
  // Use template styles if available, otherwise fall back to provided styles
  let templateStyles = template?.styles || styles
  
  if (!templateStyles) {
    // Default fallback styles
    const defaultStyles: CVStyles = {
      fontFamily: "Inter",
      fontSize: "14px",
      primaryColor: "#1f2937",
      secondaryColor: "#6b7280",
      accentColor: "#3b82f6",
      backgroundColor: "#ffffff",
      headerStyle: "simple",
      sectionSpacing: "medium",
      layout: "single-column",
      sectionStyle: "minimal",
      headerPosition: "top"
    }
    templateStyles = defaultStyles
  }

  const layout = templateStyles.layout || 'single-column'
  const sectionStyle = templateStyles.sectionStyle || 'minimal'
  const headerPosition = templateStyles.headerPosition || 'top'
  const headerStyle = templateStyles.headerStyle || 'simple'
  const spacing = templateStyles.sectionSpacing || 'medium'
  
  // Use real CV data if provided, otherwise use example data
  const displayName = cvData?.personalInfo.fullName || 'Anna Andersson'
  const displayEmail = cvData?.personalInfo.email || 'anna@email.com'
  const displayPhone = cvData?.personalInfo.phone || '+46 70 123 45 67'
  const displayLocation = cvData?.personalInfo.city || 'Stockholm'
  const displaySummary = cvData?.personalInfo.summary || 'Erfaren utvecklare med passion för att skapa innovativa lösningar...'
  
  // Render different layouts
  if (layout === 'two-column') {
    return renderTwoColumnLayout()
  } else if (layout === 'sidebar-left') {
    return renderSidebarLeftLayout()
  } else if (layout === 'sidebar-right') {
    return renderSidebarRightLayout()
  } else if (layout === 'timeline') {
    return renderTimelineLayout()
  } else {
    return renderSingleColumnLayout()
  }

  function renderSingleColumnLayout() {
    return (
      <div 
        className={`w-full h-full bg-white shadow-sm border rounded-lg overflow-hidden ${className}`}
        style={{ 
          fontFamily: templateStyles.fontFamily,
          fontSize: cvData ? '14px' : '8px',
          color: templateStyles.primaryColor,
          backgroundColor: templateStyles.backgroundColor 
        }}
      >
        {renderHeader()}
        <div className={`${cvData ? 'p-8' : 'p-3'} space-y-${spacing === 'large' ? '6' : spacing === 'compact' ? '3' : '4'}`}>
          {renderSections()}
        </div>
      </div>
    )
  }

  function renderTwoColumnLayout() {
    return (
      <div 
        className={`w-full h-full bg-white shadow-sm border rounded-lg overflow-hidden ${className}`}
        style={{ 
          fontFamily: templateStyles.fontFamily,
          fontSize: cvData ? '14px' : '8px',
          color: templateStyles.primaryColor,
          backgroundColor: templateStyles.backgroundColor 
        }}
      >
        {renderHeader()}
        <div className={`${cvData ? 'p-8' : 'p-3'} grid grid-cols-2 gap-6`}>
          <div className="space-y-4">
            {renderSummarySection()}
            {renderExperienceSection()}
          </div>
          <div className="space-y-4">
            {renderEducationSection()}
            {renderSkillsSection()}
          </div>
        </div>
      </div>
    )
  }

  function renderSidebarLeftLayout() {
    return (
      <div 
        className={`w-full h-full bg-white shadow-sm border rounded-lg overflow-hidden ${className} flex`}
        style={{ 
          fontFamily: templateStyles.fontFamily,
          fontSize: cvData ? '14px' : '8px',
          color: templateStyles.primaryColor,
          backgroundColor: templateStyles.backgroundColor 
        }}
      >
        {/* Sidebar */}
        <div 
          className={`${cvData ? 'w-1/3 p-6' : 'w-1/3 p-2'} bg-gray-50 space-y-4`}
          style={{ backgroundColor: templateStyles.accentColor + '10' }}
        >
          {renderPersonalInfo()}
          {renderSkillsSection()}
          {renderEducationSection()}
        </div>
        {/* Main content */}
        <div className={`flex-1 ${cvData ? 'p-8' : 'p-3'} space-y-4`}>
          {renderSummarySection()}
          {renderExperienceSection()}
        </div>
      </div>
    )
  }

  function renderSidebarRightLayout() {
    return (
      <div 
        className={`w-full h-full bg-white shadow-sm border rounded-lg overflow-hidden ${className} flex`}
        style={{ 
          fontFamily: templateStyles.fontFamily,
          fontSize: cvData ? '14px' : '8px',
          color: templateStyles.primaryColor,
          backgroundColor: templateStyles.backgroundColor 
        }}
      >
        {/* Main content */}
        <div className={`flex-1 ${cvData ? 'p-8' : 'p-3'} space-y-4`}>
          {renderHeader()}
          {renderSummarySection()}
          {renderExperienceSection()}
        </div>
        {/* Sidebar */}
        <div 
          className={`${cvData ? 'w-1/3 p-6' : 'w-1/3 p-2'} bg-gray-50 space-y-4`}
          style={{ backgroundColor: templateStyles.accentColor + '10' }}
        >
          {renderSkillsSection()}
          {renderEducationSection()}
        </div>
      </div>
    )
  }

  function renderTimelineLayout() {
    return (
      <div 
        className={`w-full h-full bg-white shadow-sm border rounded-lg overflow-hidden ${className}`}
        style={{ 
          fontFamily: templateStyles.fontFamily,
          fontSize: cvData ? '14px' : '8px',
          color: templateStyles.primaryColor,
          backgroundColor: templateStyles.backgroundColor 
        }}
      >
        {renderHeader()}
        <div className={`${cvData ? 'p-8' : 'p-3'} space-y-6`}>
          {renderSummarySection()}
          {/* Timeline Experience */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            {renderTimelineExperience()}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {renderEducationSection()}
            {renderSkillsSection()}
          </div>
        </div>
      </div>
    )
  }

  function renderHeader() {
    const headerClasses = `${cvData ? 'p-8' : 'p-3'} ${
      headerStyle === 'modern' ? 'bg-gradient-to-r from-blue-50 to-emerald-50' :
      headerStyle === 'creative' ? 'bg-gradient-to-r from-purple-50 to-pink-50' :
      headerStyle === 'tech' ? 'bg-gray-900 text-white' :
      'bg-gray-50'
    }`

    const headerStyleProps = {
      backgroundColor: headerStyle === 'tech' ? templateStyles.primaryColor : undefined,
      color: headerStyle === 'tech' ? templateStyles.backgroundColor : templateStyles.primaryColor
    }

    if (headerPosition === 'center') {
      return (
        <div className={headerClasses} style={headerStyleProps}>
          <div className="text-center">
            <div className={`${cvData ? 'w-16 h-16' : 'w-8 h-8'} rounded-full bg-gray-300 mx-auto mb-3`}></div>
            <div className={`font-bold ${cvData ? 'text-2xl' : 'text-xs'} mb-1`}>{displayName}</div>
            <div className={`${cvData ? 'text-lg' : 'text-xs'} opacity-75 mb-2`}>
              {cvData?.experiences.length > 0 ? cvData.experiences[0].title : 'Mjukvaruutvecklare'}
            </div>
            <div className={`${cvData ? 'text-base' : 'text-xs'} opacity-75`}>
              {displayEmail} • {displayPhone} • {displayLocation}
            </div>
          </div>
        </div>
      )
    } else if (headerPosition === 'left') {
      return (
        <div className={headerClasses} style={headerStyleProps}>
          <div className="flex items-start gap-4">
            <div className={`${cvData ? 'w-16 h-16' : 'w-8 h-8'} rounded-full bg-gray-300 flex-shrink-0`}></div>
            <div>
              <div className={`font-bold ${cvData ? 'text-2xl' : 'text-xs'} mb-1`}>{displayName}</div>
              <div className={`${cvData ? 'text-lg' : 'text-xs'} opacity-75 mb-2`}>
                {cvData?.experiences.length > 0 ? cvData.experiences[0].title : 'Mjukvaruutvecklare'}
              </div>
              <div className={`${cvData ? 'text-base' : 'text-xs'} opacity-75`}>
                {displayEmail}<br/>{displayPhone}<br/>{displayLocation}
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className={headerClasses} style={headerStyleProps}>
          <div className="flex items-center gap-3">
            <div className={`${cvData ? 'w-16 h-16' : 'w-8 h-8'} rounded-full bg-gray-300`}></div>
            <div>
              <div className={`font-bold ${cvData ? 'text-2xl' : 'text-xs'} mb-1`}>{displayName}</div>
              <div className={`${cvData ? 'text-lg' : 'text-xs'} opacity-75`}>
                {cvData?.experiences.length > 0 ? cvData.experiences[0].title : 'Mjukvaruutvecklare'}
              </div>
            </div>
          </div>
          <div className={`mt-3 ${cvData ? 'text-base' : 'text-xs'} opacity-75`}>
            {displayEmail} • {displayPhone} • {displayLocation}
          </div>
        </div>
      )
    }
  }

  function renderPersonalInfo() {
    return (
      <div>
        <div className={`${cvData ? 'w-16 h-16' : 'w-8 h-8'} rounded-full bg-gray-300 mx-auto mb-3`}></div>
        <div className={`font-bold ${cvData ? 'text-xl' : 'text-xs'} mb-1 text-center`}>{displayName}</div>
        <div className={`${cvData ? 'text-base' : 'text-xs'} opacity-75 text-center mb-2`}>
          {cvData?.experiences.length > 0 ? cvData.experiences[0].title : 'Mjukvaruutvecklare'}
        </div>
        <div className={`${cvData ? 'text-sm' : 'text-xs'} opacity-75 text-center space-y-1`}>
          <div>{displayEmail}</div>
          <div>{displayPhone}</div>
          <div>{displayLocation}</div>
        </div>
      </div>
    )
  }

  function renderSections() {
    return (
      <>
        {renderSummarySection()}
        {renderExperienceSection()}
        {renderEducationSection()}
        {renderSkillsSection()}
      </>
    )
  }

  function renderSummarySection() {
    if (!cvData?.personalInfo.summary && !displaySummary) return null

    return (
      <div>
        {renderSectionHeader('PROFIL')}
        <div className={`${cvData ? 'text-base' : 'text-xs'} leading-relaxed opacity-80`}>
          {displaySummary}
        </div>
      </div>
    )
  }

  function renderExperienceSection() {
    return (
      <div>
        {renderSectionHeader('ARBETSLIVSERFARENHET')}
        <div className="space-y-3">
          {cvData ? (
            cvData.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="font-medium text-base">{exp.title}</div>
                <div className="text-base opacity-75">{exp.company} {exp.location && `• ${exp.location}`}</div>
                <div className="text-sm opacity-75 mb-1">
                  {exp.startDate} - {exp.current ? 'Nuvarande' : exp.endDate}
                </div>
                {exp.description && (
                  <div className="text-base opacity-70 leading-relaxed">
                    {exp.description}
                  </div>
                )}
              </div>
            ))
          ) : (
            <>
              <div>
                <div className="font-medium text-xs">Senior Utvecklare</div>
                <div className="text-xs opacity-75">TechCorp AB • 2020-2024</div>
                <div className="text-xs opacity-70 leading-tight">
                  Utvecklade moderna webbapplikationer...
                </div>
              </div>
              <div>
                <div className="font-medium text-xs">Utvecklare</div>
                <div className="text-xs opacity-75">StartupXYZ • 2018-2020</div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  function renderTimelineExperience() {
    return (
      <div className="space-y-6">
        {cvData ? (
          cvData.experiences.map((exp, index) => (
            <div key={exp.id} className="relative pl-8">
              <div 
                className="absolute left-2 w-4 h-4 rounded-full border-2 bg-white"
                style={{ borderColor: templateStyles.accentColor }}
              ></div>
              <div className="font-medium text-base">{exp.title}</div>
              <div className="text-base opacity-75">{exp.company}</div>
              <div className="text-sm opacity-75 mb-1">
                {exp.startDate} - {exp.current ? 'Nuvarande' : exp.endDate}
              </div>
              {exp.description && (
                <div className="text-base opacity-70 leading-relaxed">
                  {exp.description}
                </div>
              )}
            </div>
          ))
        ) : (
          <>
            <div className="relative pl-8">
              <div 
                className="absolute left-2 w-4 h-4 rounded-full border-2 bg-white"
                style={{ borderColor: templateStyles.accentColor }}
              ></div>
              <div className="font-medium text-xs">Senior Utvecklare</div>
              <div className="text-xs opacity-75">TechCorp AB</div>
              <div className="text-xs opacity-75 mb-1">2020-2024</div>
            </div>
            <div className="relative pl-8">
              <div 
                className="absolute left-2 w-4 h-4 rounded-full border-2 bg-white"
                style={{ borderColor: templateStyles.accentColor }}
              ></div>
              <div className="font-medium text-xs">Utvecklare</div>
              <div className="text-xs opacity-75">StartupXYZ</div>
              <div className="text-xs opacity-75 mb-1">2018-2020</div>
            </div>
          </>
        )}
      </div>
    )
  }

  function renderEducationSection() {
    return (
      <div>
        {renderSectionHeader('UTBILDNING')}
        <div className="space-y-2">
          {cvData ? (
            cvData.education.map((edu) => (
              <div key={edu.id}>
                <div className="font-medium text-base">{edu.degree}</div>
                <div className="text-base opacity-75">{edu.school}</div>
                <div className="text-sm opacity-75">
                  {edu.startDate} - {edu.current ? 'Pågående' : edu.endDate}
                </div>
              </div>
            ))
          ) : (
            <>
              <div>
                <div className="font-medium text-xs">Civilingenjör Datateknik</div>
                <div className="text-xs opacity-75">KTH Royal Institute</div>
                <div className="text-xs opacity-75">2014-2018</div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  function renderSkillsSection() {
    return (
      <div>
        {renderSectionHeader('KOMPETENSER')}
        <div className="space-y-2">
          {cvData ? (
            cvData.skills.map((skill) => (
              <div key={skill.id} className="flex justify-between items-center">
                <span className="text-base">{skill.name}</span>
                <span className="text-sm opacity-75">{skill.level}</span>
              </div>
            ))
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs">React</span>
                <span className="text-xs opacity-75">Expert</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">TypeScript</span>
                <span className="text-xs opacity-75">Avancerad</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Node.js</span>
                <span className="text-xs opacity-75">Avancerad</span>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  function renderSectionHeader(title: string) {
    const baseClasses = `font-semibold ${cvData ? 'text-lg' : 'text-xs'} mb-2`
    
    if (sectionStyle === 'boxed') {
      return (
        <div 
          className={`${baseClasses} p-2 rounded`}
          style={{ 
            backgroundColor: templateStyles.accentColor + '20',
            color: templateStyles.accentColor
          }}
        >
          {title}
        </div>
      )
    } else if (sectionStyle === 'underlined') {
      return (
        <div 
          className={`${baseClasses} pb-1 border-b-2`}
          style={{ 
            color: templateStyles.accentColor,
            borderColor: templateStyles.accentColor
          }}
        >
          {title}
        </div>
      )
    } else if (sectionStyle === 'bordered') {
      return (
        <div 
          className={`${baseClasses} pb-1 border-l-4 pl-3`}
          style={{ 
            color: templateStyles.accentColor,
            borderColor: templateStyles.accentColor
          }}
        >
          {title}
        </div>
      )
    } else {
      return (
        <div 
          className={`${baseClasses} pb-1`}
          style={{ color: templateStyles.accentColor }}
        >
          {title}
        </div>
      )
    }
  }
}

// Compatibility exports for existing specific preview components
export function ClassicProfessionalPreview({ className }: { className?: string }) {
  return (
    <CVTemplatePreview 
      styles={{
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
      }}
      className={className}
    />
  )
}

export function ModernMinimalistPreview({ className }: { className?: string }) {
  return (
    <CVTemplatePreview 
      styles={{
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
      }}
      className={className}
    />
  )
}

export function CreativeDesignerPreview({ className }: { className?: string }) {
  return (
    <CVTemplatePreview 
      styles={{
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
      }}
      className={className}
    />
  )
}

export function TechExpertPreview({ className }: { className?: string }) {
  return (
    <CVTemplatePreview 
      styles={{
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
      }}
      className={className}
    />
  )
} 