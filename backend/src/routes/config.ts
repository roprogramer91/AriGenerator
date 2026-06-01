import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../lib/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({ secure: true });

async function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `ari-studio/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// GET /api/config
router.get('/', async (_req: Request, res: Response) => {
  const config = await prisma.config.findFirst({ orderBy: { updatedAt: 'desc' } });
  res.json(config || null);
});

// POST /api/config — sube imágenes y guarda URLs
router.post(
  '/',
  upload.fields([
    { name: 'face', maxCount: 1 },
    { name: 'body', maxCount: 1 },
    { name: 'phone', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;

    if (!files?.face?.[0] || !files?.body?.[0]) {
      res.status(400).json({ error: 'Se requieren imágenes de rostro y cuerpo' });
      return;
    }

    const [faceUrl, bodyUrl] = await Promise.all([
      uploadToCloudinary(files.face[0].buffer, 'face'),
      uploadToCloudinary(files.body[0].buffer, 'body'),
    ]);

    const phoneUrl = files.phone?.[0]
      ? await uploadToCloudinary(files.phone[0].buffer, 'phone')
      : undefined;

    const existing = await prisma.config.findFirst();

    const config = existing
      ? await prisma.config.update({
          where: { id: existing.id },
          data: { faceUrl, bodyUrl, ...(phoneUrl && { phoneUrl }) },
        })
      : await prisma.config.create({ data: { faceUrl, bodyUrl, phoneUrl } });

    res.json(config);
  }
);

export default router;
