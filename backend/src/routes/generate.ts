import { Router, Request, Response } from 'express';
import { generatePrompt } from '../services/claude';
import { generateImage } from '../services/image';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/generate/prompt
router.post('/prompt', async (req: Request, res: Response) => {
  const { text, refImageBase64 } = req.body as {
    text?: string;
    refImageBase64?: string;
  };

  if (!text && !refImageBase64) {
    res.status(400).json({ error: 'Se requiere texto o imagen de referencia' });
    return;
  }

  const prompt = await generatePrompt({ text, refImageBase64 });
  res.json({ prompt });
});

// POST /api/generate/image
router.post('/image', async (req: Request, res: Response) => {
  const { prompt, useFace = true, useBody = true, usePhone = false, inputText, refImageUrl } =
    req.body as {
      prompt: string;
      useFace?: boolean;
      useBody?: boolean;
      usePhone?: boolean;
      inputText?: string;
      refImageUrl?: string;
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

  const imageUrl = await generateImage({ prompt, config, useFace, useBody, usePhone });

  const generation = await prisma.generation.create({
    data: { inputText, refImageUrl, prompt, imageUrl, useFace, useBody, usePhone },
  });

  res.json({ id: generation.id, imageUrl });
});

export default router;
