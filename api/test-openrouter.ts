import { probeCommentaryProvider, validateTrashTalk } from './_lib/commentary.js';

const TEST_PROMPT = 'Reply with one short sarcastic sentence.';
const TEST_SYSTEM_INSTRUCTION = 'You are a sarcastic trivia host. Reply with one short sarcastic sentence.';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const result = await probeCommentaryProvider({
    provider: 'openrouter',
    prompt: TEST_PROMPT,
    systemInstruction: TEST_SYSTEM_INSTRUCTION,
    temperature: 0.7,
    maxTokens: 60,
    validate: validateTrashTalk,
  });
  let validation: { ok: true; meta: typeof result.validation.meta } | { ok: false; reason: string; meta: typeof result.validation.meta };
  if (result.validation.ok) {
    validation = { ok: true, meta: result.validation.meta };
  } else {
    const failedValidation = result.validation as Extract<typeof result.validation, { ok: false }>;
    validation = { ok: false, reason: failedValidation.reason, meta: failedValidation.meta };
  }

  res.status(result.ok ? 200 : 502).json({
    provider: result.provider,
    model: result.model,
    upstreamStatus: result.status,
    rawResponse: result.rawResponse,
    parsedText: result.parsedText,
    validation,
    failureType: result.failureType,
    message: result.message,
    elapsedMs: result.elapsedMs,
    requestSummary: result.requestSummary,
  });
}
