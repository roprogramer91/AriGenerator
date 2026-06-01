import { Router, Request, Response } from 'express';
import { generateVariationImage } from '../services/image';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/variations
router.post('/', async (req: Request, res: Response) => {
  const { generationId, expression, framing, angle, count = 1 } = req.body as {
    generationId: string;
    expression?: string;
    framing?: 'close' | 'bust' | 'full';
    angle?: 'left' | 'front' | 'right';
    count?: number;
  };

  const parent = await prisma.generation.findUnique({ where: { id: generationId as string } });
  if (!parent) {
    res.status(404).json({ error: 'Generación no encontrada' });
    return;
  }

  const config = await prisma.config.findFirst();
  if (!config) {
    res.status(400).json({ error: 'Config de Ari no encontrada' });
    return;
  }

  const varCount = Math.min(Math.max(count, 1), 3);
  const results = [];

  for (let i = 0; i < varCount; i++) {
    const imageUrl = await generateVariationImage({
      config,
      useFace: parent.useFace,
      useBody: parent.useBody,
      usePhone: parent.usePhone,
      expression,
      framing,
      angle,
    });

    const variationPrompt = [
      expression,
      framing,
      angle,
    ].filter(Boolean).join(', ') || 'variation';

    const variation = await prisma.generation.create({
      data: {
        prompt: variationPrompt,
        imageUrl,
        useFace: parent.useFace,
        useBody: parent.useBody,
        usePhone: parent.usePhone,
        isVariation: true,
        parentId: parent.id,
      },
    });

    results.push({ id: variation.id, imageUrl });
  }

  res.json(results);
});

export default router;
