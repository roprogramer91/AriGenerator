import { Router, Request, Response } from 'express';
import { generatePrompt } from '../services/claude';
import { generateImage } from '../services/image';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/generate/prompt
router.post('/prompt', async (req: Request, res: Response) => {
  const {
    text,
    shotType,
    plano,
    inclinacion,
    camara,
    usePhone = false,
    refImageBase64,
    refImageMimeType,
    vestimentaBase64,
    vestimentaMimeType,
    escenarioBase64,
    escenarioMimeType,
    objetosBase64,
  } = req.body as {
    text?: string;
    shotType?: 'selfie' | 'mirror_selfie' | 'fixed';
    plano?: 'primer' | 'segundo';
    inclinacion?: 'ninguna' | 'izquierda' | 'derecha';
    camara?: 'movil' | 'pro';
    usePhone?: boolean;
    refImageBase64?: string;
    refImageMimeType?: string;
    vestimentaBase64?: string;
    vestimentaMimeType?: string;
    escenarioBase64?: string;
    escenarioMimeType?: string;
    objetosBase64?: Array<{ base64: string; mimeType: string }>;
  };

  if (!text && !refImageBase64 && !vestimentaBase64 && !escenarioBase64) {
    res.status(400).json({ error: 'Se requiere al menos una instrucción o imagen de referencia' });
    return;
  }

  // Obtener Config para pasar cuerpo y celular a Claude
  const config = await prisma.config.findFirst();
  let bodyBase64: string | undefined;
  let phoneBase64: string | undefined;

  if (config) {
    const { urlToBase64 } = await import('../services/image');
    try {
      if (config.bodyUrl) bodyBase64 = await urlToBase64(config.bodyUrl);
    } catch { /* si falla, Claude genera sin referencia de cuerpo */ }
    try {
      if (usePhone && config.phoneUrl) phoneBase64 = await urlToBase64(config.phoneUrl);
    } catch { /* si falla, sin referencia de celular */ }
  }

  const prompt = await generatePrompt({
    text,
    shotType,
    plano,
    inclinacion,
    camara,
    refImageBase64,
    refImageMimeType,
    vestimentaBase64,
    vestimentaMimeType,
    escenarioBase64,
    escenarioMimeType,
    objetosBase64,
    bodyBase64,
    bodyMimeType: 'image/jpeg',
    phoneBase64,
    phoneMimeType: 'image/jpeg',
    usePhone,
  });

  res.json({ prompt });
});

// POST /api/generate/image
router.post('/image', async (req: Request, res: Response) => {
  const {
    prompt,
    shotType = 'selfie',
    useFace = true,
    useBody = true,
    usePhone = false,
    inputText,
    sourceImageBase64,
    sourceImageMimeType,
    extraRefsBase64,
    model,
  } = req.body as {
    prompt: string;
    shotType?: 'selfie' | 'mirror_selfie' | 'fixed';
    useFace?: boolean;
    useBody?: boolean;
    usePhone?: boolean;
    inputText?: string;
    sourceImageBase64?: string;
    sourceImageMimeType?: string;
    extraRefsBase64?: Array<{ base64: string; mimeType: string }>;
    model?: string;
  };

  if (!prompt) {
    res.status(400).json({ error: 'Se requiere un prompt' });
    return;
  }

  const config = await prisma.config.findFirst();
  if (!config) {
    res.status(400).json({ error: 'Primero configurá las imágenes de Ari en ⚙️ Config' });
    return;
  }

  console.log('[generate/image] refs:', {
    extraCount: extraRefsBase64?.length ?? 0,
    hasSource: !!sourceImageBase64,
  });

  let imageUrl: string;
  try {
    imageUrl = await generateImage({
      userInstructions: prompt,
      shotType,
      config,
      useFace,
      useBody,
      usePhone,
      model,
      sourceImageBase64,
      sourceImageMimeType,
      extraRefsBase64,
    });
  } catch (imgErr: unknown) {
    const msg = imgErr instanceof Error ? imgErr.message : String(imgErr);
    console.error('[generate/image] Gemini error:', msg);
    res.status(500).json({ error: `Error generando imagen: ${msg}` });
    return;
  }

  const generation = await prisma.generation.create({
    data: { inputText, prompt, imageUrl, useFace, useBody, usePhone },
  });

  res.json({ id: generation.id, imageUrl });
});

export default router;
