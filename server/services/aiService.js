import Groq from 'groq-sdk'

let _groq = null

function getGroq() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _groq
}

const SYSTEM_PROMPT = `You are a maritime crisis analysis system. Extract structured data from distress messages.
Always respond with valid JSON only — no prose, no markdown, no code fences.
JSON schema: { "severity": "low|medium|high|critical", "issue": "string", "injuryCount": number|null, "damageEstimate": "string|null", "requiresImmediateAction": boolean }`

export async function processDistressMessage(rawMessage, shipContext) {
  const userContent = `Ship: ${shipContext.name} (${shipContext.shipId})
Position: ${shipContext.position.lat.toFixed(4)}, ${shipContext.position.lng.toFixed(4)}
Cargo: ${shipContext.cargo}
Current status: ${shipContext.status}
Fuel remaining: ${shipContext.fuelRemaining} tons

Distress message: "${rawMessage}"

Extract the structured data from this distress message.`

  const completion = await getGroq().chat.completions.create({
    model:       'llama3-8b-8192',
    max_tokens:  256,
    temperature: 0.1,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userContent },
    ],
  })

  const raw = completion.choices[0].message.content.trim()

  try {
    return JSON.parse(raw)
  } catch {
    // Fallback if model returns something unexpected
    return {
      severity:               'high',
      issue:                  rawMessage,
      injuryCount:            null,
      damageEstimate:         null,
      requiresImmediateAction: true,
    }
  }
}
