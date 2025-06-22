export interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  address: string
  linkedIn?: string
  website?: string
  profileImage?: string
}

export interface Experience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  achievements: string[]
}

export interface Education {
  id: string
  degree: string
  institution: string
  location: string
  startDate: string
  endDate?: string
  current: boolean
  gpa?: string
  description?: string
}

export interface Skill {
  id: string
  name: string
  level: "beginner" | "intermediate" | "advanced" | "expert"
  category: "technical" | "soft" | "language" | "other"
}

export interface Project {
  id: string
  name: string
  description: string
  technologies: string[]
  url?: string
  startDate: string
  endDate?: string
  current: boolean
}

export interface CVData {
  id?: string
  title: string
  personalInfo: PersonalInfo
  summary: string
  experience: Experience[]
  education: Education[]
  skills: Skill[]
  projects: Project[]
  languages?: Language[]
  certifications?: Certification[]
}

export interface Language {
  id: string
  name: string
  level: "basic" | "conversational" | "fluent" | "native"
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  url?: string
}

export interface CVTemplate {
  id: string
  name: string
  category: "traditional" | "modern" | "creative"
  previewImage: string
  isPremium: boolean
  styles: CVStyles
}

export interface CVStyles {
  fontFamily: string
  fontSize: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  headerStyle: "simple" | "modern" | "creative" | "tech"
  sectionSpacing: "compact" | "medium" | "large"
  layout: "single-column" | "two-column" | "sidebar-left" | "sidebar-right" | "timeline"
  sectionStyle: "minimal" | "boxed" | "underlined" | "bordered"
  headerPosition: "top" | "center" | "left"
}
