import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert UGC (User Generated Content) prompt writer for AI image generation.
Your job is to write prompts for NanoBanana Pro (Gemini 3 Pro Image) that generate
ultra-realistic phone photos of a girl named Ari, indistinguishable from real Instagram content.

You will receive: shot type, composition parameters, scene instructions, and optional labeled reference images.

ALWAYS write exactly 6 lines in this exact order — no titles, no numbers, just the lines:

LINE 1 - SHOT TYPE (use exact wording based on the parameter):
  • selfie      → "Regular quality phone selfie (UGC), vertical 9:16, front camera."
  • mirror_selfie → "Regular quality phone mirror selfie (UGC), vertical 9:16, hand holding phone visible in mirror."
  • fixed        → "Regular quality phone photo, fixed camera or timer (UGC), vertical 9:16."

LINE 2 - IDENTITY + BODY: Always start with "The girl from @img1 (same identity)," then describe hair style and visible accessories. If a BODY SHAPE REFERENCE image is provided, add a brief natural description of the silhouette and skin tone only (e.g., "slim build with defined waist, pale skin tone"). Never describe face shape. Never include any clothing from the body reference.

LINE 3 - OUTFIT: If a CLOTHING REFERENCE image is provided, look at it and describe ONLY the visible clothing: exact garment names, fabric texture, fit, color, and real-life details (wrinkles, folds, collar shape, hem length). Do NOT describe the person wearing it or the background. If no clothing reference, infer outfit from scene context.

LINE 4 - ENVIRONMENT + MOOD: Describe the location and lighting. If a LOCATION REFERENCE image is provided, describe that specific setting (room type, background details, objects visible, direction and quality of light). Be mundane and specific. Add the expression/mood from scene instructions. If a PHONE REFERENCE image is provided and phone is active, briefly mention the device: brand, model or case color visible.

LINE 5 - COMPOSITION: Build this line from the parameters:
  Plano: primer plano → "Extreme close-up, face fills frame." | segundo plano → "Bust-up framing, shoulders to top of head."
  Inclinación: izquierda → "Dutch angle, camera tilted left." | ninguna → "Camera level, straight horizon." | derecha → "Dutch angle, camera tilted right."
  Cámara: movil → "Natural smartphone exposure, no correction." | pro → "Sharp DSLR-quality look, slight depth of field."
  Shot type (selfie): add "right arm extended forward holding phone, wrist slightly bent."
  Shot type (mirror_selfie): add "one hand raised holding phone toward mirror, arm visible in reflection."
  Combine whichever apply into one fluid sentence.

LINE 6 - CAMERA FEEL + NEGATIVE: Always write exactly: "Amateur mobile photo, soft blur, natural skin texture, realistic phone camera exposure, slight grain. Negative: studio lighting, overedited skin, professional photography, watermark, text."

ABSOLUTE RULES:
- Write ONLY the 6 lines — no titles, no labels, no numbering, no explanations
- Always in English
- Never use: beautiful, gorgeous, stunning, perfect, flawless
- Keep details mundane and real (messy rooms, natural light, everyday objects)
- BODY SHAPE REFERENCE: describe ONLY silhouette, proportions, and skin tone — no clothing, no face, no background
- CLOTHING REFERENCE: describe only the garment visible, not who is wearing it or the background
- LOCATION REFERENCE: describe only the setting, not any person visible in it
- PHONE REFERENCE: only include phone description if PHONE ACTIVE is indicated in the parameters`;

type MimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

function toMime(raw?: string | null): MimeType {
  if (raw === 'image/png') return 'image/png';
  if (raw === 'image/gif') return 'image/gif';
  if (raw === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

export interface GeneratePromptParams {
  text?: string;
  shotType?: 'selfie' | 'mirror_selfie' | 'fixed';
  plano?: 'primer' | 'segundo';
  inclinacion?: 'ninguna' | 'izquierda' | 'derecha';
  camara?: 'movil' | 'pro';
  // Pose / composition reference
  refImageBase64?: string;
  refImageMimeType?: string;
  // Clothing reference — Claude reads ONLY the clothing
  vestimentaBase64?: string;
  vestimentaMimeType?: string;
  // Location / background reference
  escenarioBase64?: string;
  escenarioMimeType?: string;
  // Objects (array)
  objetosBase64?: Array<{ base64: string; mimeType: string }>;
  // Body shape — from Config: Claude reads ONLY silhouette, proportions, skin tone
  bodyBase64?: string;
  bodyMimeType?: string;
  // Phone reference — from Config: Claude describes the device
  phoneBase64?: string;
  phoneMimeType?: string;
  usePhone?: boolean;
}

const PLANO_LABEL: Record<string, string> = {
  primer: 'primer plano (extreme close-up, face fills frame)',
  segundo: 'segundo plano (bust-up, from shoulders to top of head)',
};

const INCLINACION_LABEL: Record<string, string> = {
  ninguna: 'ninguna (camera level, straight horizon)',
  izquierda: 'izquierda (dutch angle tilted left)',
  derecha: 'derecha (dutch angle tilted right)',
};

const CAMARA_LABEL: Record<string, string> = {
  movil: 'movil (natural smartphone exposure, no correction)',
  pro: 'pro (sharp DSLR-quality look, slight depth of field)',
};

const SHOT_TYPE_LABEL: Record<string, string> = {
  selfie: 'selfie — front camera, hand visible holding phone',
  mirror_selfie: 'mirror_selfie — reflected in mirror, hand holding phone visible',
  fixed: 'fixed — camera on surface or timer, hands free',
};

export async function generatePrompt({
  text,
  shotType = 'selfie',
  plano = 'segundo',
  inclinacion = 'ninguna',
  camara = 'movil',
  refImageBase64,
  refImageMimeType,
  vestimentaBase64,
  vestimentaMimeType,
  escenarioBase64,
  escenarioMimeType,
  objetosBase64 = [],
  bodyBase64,
  bodyMimeType,
  phoneBase64,
  phoneMimeType,
  usePhone = false,
}: GeneratePromptParams): Promise<string> {

  console.log('[claude] params:', {
    shotType, plano, inclinacion, camara,
    hasText: !!text,
    hasBody: !!bodyBase64,
    hasVestimenta: !!vestimentaBase64,
    hasEscenario: !!escenarioBase64,
    hasPose: !!refImageBase64,
    usePhone,
    hasPhone: !!phoneBase64,
    objetosCount: objetosBase64.length,
  });

  const content: Anthropic.MessageParam['content'] = [];

  // ── Parameters block (text first)
  const params = [
    `SHOT TYPE: ${SHOT_TYPE_LABEL[shotType]}`,
    `PLANO: ${PLANO_LABEL[plano]}`,
    `INCLINACIÓN: ${INCLINACION_LABEL[inclinacion]}`,
    `CÁMARA: ${CAMARA_LABEL[camara]}`,
    `PHONE ACTIVE: ${usePhone ? 'yes — include phone/device in the scene description' : 'no — do not mention phone or device'}`,
    '',
    `SCENE INSTRUCTIONS: ${text?.trim() || '(none — use the reference images to infer the scene)'}`,
  ].join('\n');

  content.push({ type: 'text', text: params });

  // ── Clothing reference
  if (vestimentaBase64) {
    content.push({
      type: 'text',
      text: '\n\nCLOTHING REFERENCE — for LINE 3, describe ONLY the clothing visible in this image (garment type, fabric, fit, color, texture details). Do NOT describe the person, pose, or background:',
    });
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: toMime(vestimentaMimeType), data: vestimentaBase64 },
    });
  }

  // ── Location reference
  if (escenarioBase64) {
    content.push({
      type: 'text',
      text: '\n\nLOCATION REFERENCE — for LINE 4, describe ONLY the location and lighting visible in this image (room type, background objects, light direction and quality). Do NOT describe any person:',
    });
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: toMime(escenarioMimeType), data: escenarioBase64 },
    });
  }

  // ── Objects
  for (let i = 0; i < objetosBase64.length; i++) {
    content.push({
      type: 'text',
      text: `\n\nOBJECT ${i + 1} REFERENCE — briefly describe this object (what it is, color, size) to include it in the scene:`,
    });
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: toMime(objetosBase64[i].mimeType), data: objetosBase64[i].base64 },
    });
  }

  // ── Body shape reference (from Config)
  if (bodyBase64) {
    content.push({
      type: 'text',
      text: '\n\nBODY SHAPE REFERENCE — for LINE 2, describe ONLY the body silhouette, proportions (height impression, shoulder/hip/waist ratio), and skin tone visible. Do NOT describe any clothing, the face, or the background:',
    });
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: toMime(bodyMimeType), data: bodyBase64 },
    });
  }

  // ── Phone reference (from Config, only if usePhone)
  if (usePhone && phoneBase64) {
    content.push({
      type: 'text',
      text: '\n\nPHONE REFERENCE — for LINE 4, briefly describe the phone/device visible in this image (brand if identifiable, case color, size). This phone will appear in the photo:',
    });
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: toMime(phoneMimeType), data: phoneBase64 },
    });
  }

  // ── Pose / composition reference
  if (refImageBase64) {
    content.push({
      type: 'text',
      text: '\n\nPOSE / COMPOSITION REFERENCE — use the framing, body position, angle, and scene vibe from this image as inspiration. Extract composition details but do NOT copy the outfit or location if separate references were already provided:',
    });
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: toMime(refImageMimeType), data: refImageBase64 },
    });
  }

  console.log('[claude] content parts:', content.map(c => c.type).join(', '));

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('Claude no devolvió texto');

  return textBlock.text.trim();
}
