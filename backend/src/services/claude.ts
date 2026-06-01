import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Sos un experto en generación de prompts para imágenes IA fotorrealistas de Instagram.
Tu trabajo es crear prompts en inglés para NanoBanana Pro (Gemini 3 Pro Image) que generen
selfies y fotos ultra-realistas que parezcan tomadas con un celular real.

La persona en la imagen se llama Ari. Sus referencias visuales (rostro, cuerpo) se envían
como imágenes de referencia junto al prompt.

REGLAS:
- El resultado debe parecer foto real de celular, NO imagen IA
- Calidad de selfie frontal o trasera según el contexto
- Iluminación natural, imperfecciones reales, sin filtros de belleza
- Prompt conciso (máximo 3-4 oraciones) pero muy específico
- Incluir siempre: tipo de disparo, ángulo, iluminación, ambiente, expresión
- Si hay imagen de referencia, mantener pose, encuadre y ambiente
- NO mencionar "IA", "generated", "artificial"

Respondé ÚNICAMENTE con el prompt en inglés. Sin explicaciones.`;

interface GeneratePromptParams {
  text?: string;
  refImageBase64?: string;
}

export async function generatePrompt({ text, refImageBase64 }: GeneratePromptParams): Promise<string> {
  const content: Anthropic.MessageParam['content'] = [];

  if (text) {
    content.push({ type: 'text', text });
  }

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
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('Claude no devolvió texto');

  return textBlock.text.trim();
}
