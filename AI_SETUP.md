# AI-tjänst uppsättning för KarriarAI

## Google Gemini API-konfiguration

För att aktivera AI-funktionerna i KarriarAI behöver du konfigurera Google Gemini API.

### Steg 1: Skaffa Google Gemini API-nyckel

1. Gå till [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Logga in med ditt Google-konto
3. Klicka på "Create API Key"
4. Kopiera din API-nyckel

### Steg 2: Konfigurera miljövariabler

Lägg till följande rad i din `.env.local` fil (skapa filen om den inte finns):

```
GOOGLE_GEMINI_API_KEY=din_api_nyckel_här
```

**Viktigt:** Ersätt `din_api_nyckel_här` med din faktiska API-nyckel från Google.

### Steg 3: Verifiera installation

När API-nyckeln är konfigurerad kommer följande AI-funktioner att vara aktiva:

#### CV-Builder
- ✨ **Förbättra sammanfattning**: Professionaliserar din CV-sammanfattning
- 🔧 **Förbättra arbetserfarenhet**: Optimerar beskrivningar av tidigare roller
- 🎓 **Förbättra utbildning**: Förbättrar beskrivningar av utbildningsbakgrund

#### Kontoinställningar
- 👤 **Förbättra biografi**: Professionaliserar din profil-bio
- 💼 **Förbättra jobbtitel**: Optimerar din jobbtitel för ATS-system

#### Kontaktformulär
- 💬 **Förbättra meddelande**: Professionaliserar dina meddelanden

#### Jobbmatchning
- 🔍 **Förbättra sökfråga**: Optimerar söktermer för bättre jobbresultat

### AI-system prompts

Alla AI-funktioner använder specialiserade system prompts som är optimerade för:

- **Professionell svenska**: All text genereras på svenska
- **ATS-optimering**: Inkluderar relevanta nyckelord för jobbsökning
- **Branschspecifika termer**: Använder erkända termer inom olika branscher
- **Kvantifiering**: Lägger till mätbara resultat där möjligt
- **Professionell ton**: Bibehåller en professionell men engagerande ton

### Felsökning

Om AI-funktionerna inte fungerar:

1. **Kontrollera API-nyckel**: Se till att `GOOGLE_GEMINI_API_KEY` är korrekt inställd i `.env.local`
2. **Starta om servern**: Kör `npm run dev` igen efter att ha lagt till miljövariabeln
3. **Kontrollera konsolen**: Titta efter felmeddelanden i browser-konsolen eller server-loggar
4. **API-gränser**: Kontrollera att du inte har överskridit Googles API-gränser

### Säkerhet

- **Dela aldrig din API-nyckel**: Lägg aldrig till API-nyckeln i versionskontroll
- **Använd miljövariabler**: API-nyckeln ska alltid vara i `.env.local`, inte i koden
- **Övervaka användning**: Håll koll på din API-användning i Google AI Studio

### Kostnad

Google Gemini API har en gratis nivå som inkluderar:
- 15 förfrågningar per minut
- 1 miljon tokens per månad
- 1500 förfrågningar per dag

För mer information om priser, se [Google AI Pricing](https://ai.google.dev/pricing). 