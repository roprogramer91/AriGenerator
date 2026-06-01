import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/gallery?page=1&limit=20
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.generation.findMany({
      orderBy: { createdAt: 'desc' as const },
      skip,
      take: limit,
    }),
    prisma.generation.count(),
  ]);

  res.json({ items, total, page, limit });
});

// GET /api/gallery/:id
router.get('/:id', async (req: Request, res: Response) => {
  const generation = await prisma.generation.findUnique({
    where: { id: req.params.id as string },
  });

  if (!generation) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }

  const variations = await prisma.generation.findMany({
    where: { parentId: generation.id },
    orderBy: { createdAt: 'asc' },
  });

  res.json({ ...generation, variations });
});

export default router;
