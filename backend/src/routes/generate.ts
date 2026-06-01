import { Router, Request, Response } from 'express';
import { generatePrompt } from '../services/claude';
import { generateImage } from '../services/image';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/generate/prompt
router.post('/prompt', async (req: Request, res: Response) => {
  const { text, refImageBase64, shotType } = req.body as {
    text?: string;
    refImageBase64?: string;
    shotType?: 'selfie' | 'mirror_selfie' | 'fixed';
  };

  if (!text && !refImageBase64) {
    res.status(400).json({ error: 'Se requiere texto o imagen de referencia' });
    return;
  }

  const prompt = await generatePrompt({ text, refImageBase64, shotType });
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
  } = req.body as {
    prompt: string;
    shotType?: 'selfie' | 'mirror_selfie' | 'fixed';
    useFace?: boolean;
    useBody?: boolean;
    usePhone?: boolean;
    inputText?: string;
    sourceImageBase64?: string;
    sourceImageMimeType?: string;
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
  });

  const generation = await prisma.generation.create({
    data: { inputText, prompt, imageUrl, useFace, useBody, usePhone },
  });

  res.json({ id: generation.id, imageUrl });
});

export default router;
