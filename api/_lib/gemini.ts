export async function generateGeminiText(prompt: string, systemInstruction?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: systemInstruction
        ? {
            systemInstruction,
          }
        : undefined,
      contents: prompt,
    });

    if (typeof response.text === 'string') {
      return response.text;
    }
  } catch (error) {
    console.error('[gemini/api] SDK request failed, falling back to REST', {
      error,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: systemInstruction
          ? {
              parts: [{ text: systemInstruction }],
            }
          : undefined,
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 180,
        },
      }),
    }
  );

  const rawText = await response.text();
  let data: any = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (error) {
    console.error('[gemini/api] REST fallback returned non-JSON payload', {
      error,
      rawText,
    });
  }

  if (!response.ok) {
    throw new Error(
      `Gemini REST request failed with status ${response.status}: ${
        data?.error?.message || rawText || 'Unknown error'
      }`
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string } | null | undefined) => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n')
      .trim() || '';

  return text;
}
