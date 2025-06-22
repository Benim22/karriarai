import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export interface AIImprovementContext {
  title?: string
  company?: string
  degree?: string
  school?: string
  jobTitle?: string
}

export async function improveTextWithAI(
  text: string,
  type: 'summary' | 'experience' | 'education' | 'bio' | 'job_title' | 'message' | 'search_query',
  context?: AIImprovementContext
): Promise<string> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.warn('Google Gemini API key is not configured')
    return text
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    let systemPrompt = ''
    
    switch (type) {
      case 'summary':
        systemPrompt = `Du är en professionell CV-skrivare som specialiserar dig på att skapa övertygande professionella sammanfattningar för svenska CV:n. 

Din uppgift är att förbättra den givna texten så att den:
- Är professionell och engagerande
- Använder kraftfulla, aktiva verb
- Framhäver unika värdepropositioner
- Är optimerad för ATS (Applicant Tracking Systems)
- Är skriven på svenska
- Är mellan 2-4 meningar lång
- Fokuserar på resultat och prestationer

Förbättra följande professionella sammanfattning:`

        break

      case 'experience':
        systemPrompt = `Du är en professionell CV-skrivare som specialiserar dig på att skriva imponerande arbetserfarenhets-beskrivningar för svenska CV:n.

Din uppgift är att förbättra den givna texten så att den:
- Börjar med kraftfulla aktionsverb
- Kvantifierar resultat när möjligt (använd realistiska uppskattningar om inga siffror finns)
- Framhäver prestationer istället för bara ansvarsområden
- Visar påverkan och värde som skapats
- Är skriven på svenska
- Använder branschspecifika nyckelord
- Är strukturerad i punktform om det passar bättre

${context?.title ? `Jobbtitel: ${context.title}` : ''}
${context?.company ? `Företag: ${context.company}` : ''}

Förbättra följande arbetserfarenhets-beskrivning:`

        break

      case 'education':
        systemPrompt = `Du är en professionell CV-skrivare som specialiserar dig på att beskriva utbildningsbakgrund för svenska CV:n.

Din uppgift är att förbättra den givna texten så att den:
- Framhäver relevanta kurser och projekt
- Visar akademiska prestationer
- Kopplar utbildningen till praktiska färdigheter
- Är skriven på svenska
- Är koncis men informativ

${context?.degree ? `Examen: ${context.degree}` : ''}
${context?.school ? `Skola: ${context.school}` : ''}

Förbättra följande utbildnings-beskrivning:`

        break

      case 'bio':
        systemPrompt = `Du är en professionell CV-skrivare som specialiserar dig på att skriva engagerande professionella biografier för svenska profiler.

Din uppgift är att förbättra den givna texten så att den:
- Är professionell men personlig
- Framhäver unika styrkor och erfarenheter
- Visar passion och motivation
- Är skriven på svenska
- Är engagerande och minnesvärd
- Är mellan 2-4 meningar lång

Förbättra följande professionella biografi:`

        break

      case 'job_title':
        systemPrompt = `Du är en professionell CV-skrivare som specialiserar dig på att optimera jobbtitlar för svenska CV:n och LinkedIn-profiler.

Din uppgift är att förbättra den givna jobbtiteln så att den:
- Är professionell och branschstandard
- Använder erkända titlar som rekryterare söker efter
- Är optimerad för ATS och sökningar
- Är skriven på svenska
- Återspeglar senioritetsnivå och expertis
- Är kort och koncis

${context?.jobTitle ? `Nuvarande titel: ${context.jobTitle}` : ''}

Förbättra följande jobbtitel:`

        break

      case 'message':
        systemPrompt = `Du är en professionell kommunikationsexpert som specialiserar dig på att förbättra meddelanden och e-post för svenska företagskommunikation.

Din uppgift är att förbättra det givna meddelandet så att det:
- Är professionellt och välformulerat
- Har en tydlig struktur och flyt
- Använder artigt och respektfullt språk
- Är skrivet på svenska
- Har en tydlig avsikt och call-to-action
- Är passande för affärskommunikation

Förbättra följande meddelande:`

        break

      case 'search_query':
        systemPrompt = `Du är en expert på jobbsökning och rekrytering som specialiserar dig på att optimera sökfrågor för svenska jobbsajter.

Din uppgift är att förbättra den givna sökfrågan så att den:
- Använder relevanta branschtermer och nyckelord
- Är optimerad för svenska jobbannonser
- Inkluderar viktiga färdigheter och kvalifikationer
- Är specifik nog för att ge relevanta resultat
- Använder svenska termer som rekryterare söker efter

Förbättra följande sökfråga för jobbsökning:`

        break
    }

    const prompt = `${systemPrompt}

"${text}"

Svara endast med den förbättrade texten, ingen extra förklaring eller kommentarer.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const improvedText = response.text().trim()

    // Clean up any quotes that might be added by the AI
    return improvedText.replace(/^["']|["']$/g, '')

  } catch (error) {
    console.error('AI improvement failed:', error)
    // Return original text if AI fails
    return text
  }
}

export async function generateCVSuggestions(
  cvData: any,
  targetJobDescription?: string
): Promise<string[]> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return []
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `Du är en professionell CV-rådgivare. Analysera följande CV-data och ge 5 konkreta förbättringsförslag på svenska.

CV-data:
${JSON.stringify(cvData, null, 2)}

${targetJobDescription ? `Målposition: ${targetJobDescription}` : ''}

Ge 5 specifika, actionable förbättringsförslag som bullet points. Fokusera på:
- Innehåll och struktur
- Nyckelord och ATS-optimering
- Kvantifiering av resultat
- Professionell presentation
- Branschspecifika förbättringar

Svara endast med de 5 förslagen som bullet points, inget annat.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const suggestions = response.text().trim()

    return suggestions.split('\n').filter(line => line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*'))

  } catch (error) {
    console.error('Failed to generate CV suggestions:', error)
    return []
  }
} 