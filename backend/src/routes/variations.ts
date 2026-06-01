import { Router, Request, Response } from 'express';
import { generatePrompt } from '../services/claude';
import { generateImage } from '../services/image';
import prisma from '../lib/prisma';

const router = Router();

const EXPRESSIONS: Record<string, string> = {
  smile: 'warm smile',
  serious: 'serious expression',
  tender: 'tender gentle look',
  cute_angry: 'cute mock-angry expression',
  pout: 'soft pout',
  surprised: 'surprised expression',
  wink: 'playful wink',
  mischievous: 'mischievous smirk',
};

const FRAMINGS: Record<string, string> = {
  close: 'extreme close-up on face',
  bust: 'bust shot from shoulders up',
  full: 'full body shot',
};

const ANGLES: Record<string, string> = {
  left: 'slightly angled to the left',
  front: 'straight front facing',
  right: 'slightly angled to the right',
};

// POST /api/variations
router.post('/', async (req: Request, res: Response) => {
  const { generationId, expression, framing, angle, count = 1 } = req.body as {
    generationId: string;
    expression?: string;
    framing?: string;
    angle?: string;
    count?: number;
  };

  const parent = await prisma.generation.findUnique({ where: { id: generationId } });
  if (!parent) {
    res.status(404).json({ error: 'Generación no encontrada' });
    return;
  }

  const config = await prisma.config.findFirst();
  if (!config) {
    res.status(400).json({ error: 'Config de Ari no encontrada' });
    return;
  }

  const modifiers: string[] = [];
  if (expression && EXPRESSIONS[expression]) modifiers.push(EXPRESSIONS[expression]);
  if (framing && FRAMINGS[framing]) modifiers.push(FRAMINGS[framing]);
  if (angle && ANGLES[angle]) modifiers.push(ANGLES[angle]);

  const variationText = modifiers.length
    ? `Same scene but with: ${modifiers.join(', ')}`
    : 'Same scene, different angle';

  const varCount = Math.min(Math.max(count, 1), 3);
  const results = [];

  for (let i = 0; i < varCount; i++) {
    const prompt = await generatePrompt({ text: `${parent.prompt}. Variation: ${variationText}` });
    const imageUrl = await generateImage({
      prompt,
      config,
      useFace: parent.useFace,
      useBody: parent.useBody,
      usePhone: parent.usePhone,
    });

    const variation = await prisma.generation.create({
      data: {
        prompt,
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
