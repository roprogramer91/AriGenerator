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

  const imageUrl = await generateImage({
    userInstructions: prompt,
    shotType,
    config,
    useFace,
    useBody,
    usePhone,
    sourceImageBase64,
    sourceImageMimeType,
    extraRefsBase64,
  });

  const generation = await prisma.generation.create({
    data: { inputText, prompt, imageUrl, useFace, useBody, usePhone },
  });

  res.json({ id: generation.id, imageUrl });
});

export default router;
