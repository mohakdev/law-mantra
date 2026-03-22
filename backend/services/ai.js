const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Free model on Groq — fast and capable
const MODEL = "llama-3.1-8b-instant";

const VALID_SCAM_TYPES = ["phishing", "job_scam", "lottery_scam", "upi_fraud", "unknown"];

/**
 * Classifies the scam type from extracted text using GPT
 * @param {string} text - Cleaned OCR text
 * @returns {Promise<{type: string, confidence: number, reason: string}>}
 */
const classifyScam = async (text) => {
  const systemPrompt = `You are a cybercrime classification expert for India.
Analyze the given message text and classify it into one of these exact categories:
- phishing
- job_scam
- lottery_scam
- upi_fraud
- unknown

Only classify as a scam if there are CLEAR indicators like:
urgency + money request, fake links, impersonation, prize claims, or asking for credentials.
Set confidence below 60 if you are not certain.

Return ONLY a valid JSON object with these exact fields:
{
  "type": "<one of the categories above>",
  "confidence": <integer 0-100>,
  "reason": "<one sentence explaining why, max 20 words>"
}

Do NOT include any markdown, code fences, or extra text. Just the JSON object.`;

  const userPrompt = `Classify this message:\n\n${text.slice(0, 1500)}`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 150,
  });

  const raw = response.choices[0]?.message?.content?.trim() || "{}";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("OpenAI returned invalid JSON for classification:", raw);
    return { type: "unknown", confidence: 0, reason: "Could not determine scam type." };
  }

  // Validate type
  if (!VALID_SCAM_TYPES.includes(parsed.type)) {
    parsed.type = "unknown";
  }

  return {
    type: parsed.type || "unknown",
    confidence: Math.min(100, Math.max(0, parseInt(parsed.confidence) || 0)),
    reason: parsed.reason || "No explanation provided.",
  };
};

/**
 * Generates action steps for a given scam type
 * @param {string} scamType
 * @returns {Promise<string[]>}
 */
const generateActions = async (scamType) => {
  const systemPrompt = `You are a cybercrime legal advisor in India.
Return ONLY a valid JSON array of 4-5 short, actionable steps a victim should take immediately.
Each step must be a plain string under 15 words.
No markdown, no numbering, no extra text — just a raw JSON array.
Example: ["Call your bank immediately", "Block the sender's number"]`;

  const userPrompt = `Generate immediate action steps for a victim of: ${scamType.replace(/_/g, " ")} scam in India.`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 200,
  });

  const raw = response.choices[0]?.message?.content?.trim() || "[]";

  try {
    const actions = JSON.parse(raw);
    if (Array.isArray(actions)) return actions;
  } catch {
    console.error("OpenAI returned invalid JSON for actions:", raw);
  }

  // Fallback actions
  return [
    "Do not share personal or financial information",
    "Report to cybercrime.gov.in immediately",
    "Take screenshots and preserve evidence",
    "Contact your bank if financial details were shared",
  ];
};

/**
 * Chat-based complaint detail collection using Groq
 * @param {Array} conversationHistory - [{role, content}]
 * @param {string} scamContext - scam type + explanation
 * @param {Object} collectedFields - fields already gathered
 * @returns {Promise<{message, extractedFields, allCollected}>}
 */
const chatForComplaintDetails = async (conversationHistory, scamContext, collectedFields) => {
  const REQUIRED = ["fullName", "phone", "email", "aadhaarLast4", "address", "dateOfIncident", "description"];

  // Determine single next field to ask
  const nextField = REQUIRED.find((f) => !collectedFields[f]) || null;

  const systemPrompt = `You are a cybercrime complaint assistant for India. Collect complaint details one field at a time.

Scam detected: ${scamContext}
Already collected: ${JSON.stringify(collectedFields)}
Next field to ask: ${nextField || "NONE — all required fields collected"}

STRICT RULES:
1. Read the user message and extract ANY field values they provided.
2. After a SHORT acknowledgement (1 sentence max), IMMEDIATELY ask the next missing field in the SAME message.
3. NEVER end your reply without asking the next field — unless allCollected is true.
4. NEVER say "type next", "press next", or ask for any confirmation word.
5. For Aadhaar: if user gives 12 digits set both aadhaarLast4 (last 4) and aadhaarFull.
6. PAN is optional — ask only after description is done: "Lastly, share your **PAN card number** if you have one, or say skip."
7. When ALL of [fullName, phone, email, aadhaarLast4, address, dateOfIncident, description] are collected (including from this turn), set allCollected=true and message: "All details collected! Click **Preview Complaint** below."
8. Use ** for bold field names.

Return JSON only:
{
  "message": "<1-sentence ack + next question>",
  "extractedFields": {"fullName":null,"phone":null,"email":null,"aadhaarLast4":null,"aadhaarFull":null,"pan":null,"address":null,"dateOfIncident":null,"description":null},
  "allCollected": false
}
Set non-null ONLY for fields found in the user current message.`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...conversationHistory],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content?.trim() || "{}";

  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    // Filter out null values from extractedFields
    const extractedFields = Object.fromEntries(
      Object.entries(parsed.extractedFields || {}).filter(([, v]) => v !== null && v !== undefined)
    );
    return {
      message: parsed.message || "Could you please share your full name?",
      extractedFields,
      allCollected: !!parsed.allCollected,
    };
  } catch {
    console.error("Groq chat returned invalid JSON:", raw);
    return {
      message: "Could you please share your full name to get started?",
      extractedFields: {},
      allCollected: false,
    };
  }
};

module.exports = { classifyScam, generateActions, chatForComplaintDetails };
