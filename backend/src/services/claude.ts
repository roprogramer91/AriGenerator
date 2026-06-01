import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert UGC (User Generated Content) prompt writer for AI image generation.
Your job is to write prompts for NanoBanana Pro (Gemini 3 Pro Image) that generate
ultra-realistic phone photos of a girl named Ari, indistinguishable from real Instagram content.

ALWAYS follow this exact structure and order:

LINE 1 - SHOT TYPE: Start with "Regular quality phone [selfie/mirror selfie/photo] (UGC), vertical 9:16."

LINE 2 - IDENTITY + HAIR + ACCESSORIES: "The girl from @img1 (same identity)," then describe hair style and any visible accessories (earrings, etc). Never describe face or body shape.

LINE 3 - EXPRESSION + OUTFIT: Describe her expression/mood, then clothing with fabric, fit, color, natural details (folds, wrinkles, oversized, etc).

LINE 4 - ENVIRONMENT: Location, background details (what's visible behind her), lighting source and quality. Be specific and mundane: unmade bed, clothes on chair, dirty mirror, etc.

LINE 5 - CAMERA FEEL: Always use these exact words: "Amateur mobile photo, soft blur, natural skin texture, realistic phone camera exposure, slight grain."

LINE 6 - NEGATIVE: Always end with "Negative: studio lighting, overedited skin, professional photography, watermark, text."

RULES:
- Write ONLY the prompt, no explanations, no titles, no numbering
- Always in English
- Exactly 6 lines as described above
- If the user provides a reference image, extract pose, framing, environment and lighting from it — keep the same vibe
- Keep details mundane and real: unmade beds, morning light, dirty mirrors, clothes on chairs
- Never use words like "beautiful", "gorgeous", "stunning", "perfect"
- Never invent clothing not described or visible in reference`;

const SHOT_TYPE_LABEL: Record<string, string> = {
  selfie: 'Regular quality phone selfie (UGC)',
  mirror_selfie: 'Regular quality phone mirror selfie (UGC)',
  fixed: 'Regular quality phone photo, fixed camera or timer (UGC)',
};

interface GeneratePromptParams {
  text?: string;
  refImageBase64?: string;
  shotType?: 'selfie' | 'mirror_selfie' | 'fixed';
}

export async function generatePrompt({ text, refImageBase64, shotType }: GeneratePromptParams): Promise<string> {
  const shotTypeLabel = SHOT_TYPE_LABEL[shotType ?? 'selfie'] ?? SHOT_TYPE_LABEL.selfie;
  const userMessage = `Shot type: ${shotTypeLabel}\n\nScene: ${text ?? ''}\n\nReference image: ${refImageBase64 ? 'yes' : 'no'}`;

  const content: Anthropic.MessageParam['content'] = [
    { type: 'text', text: userMessage },
  ];

  if (refImageBase64) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: refImageBase64,
      },
    });
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('Claude no devolvió texto');

  return textBlock.text.trim();
}
