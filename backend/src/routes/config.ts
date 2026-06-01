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

// POST /api/config — sube las imágenes que cambien y guarda URLs
router.post(
  '/',
  upload.fields([
    { name: 'face', maxCount: 1 },
    { name: 'body', maxCount: 1 },
    { name: 'phone', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;

    const hasFace = !!files?.face?.[0];
    const hasBody = !!files?.body?.[0];
    const hasPhone = !!files?.phone?.[0];

    if (!hasFace && !hasBody && !hasPhone) {
      res.status(400).json({ error: 'Sube al menos una imagen' });
      return;
    }

    const existing = await prisma.config.findFirst();

    // Primera vez: requerir rostro + cuerpo
    if (!existing && (!hasFace || !hasBody)) {
      res.status(400).json({ error: 'Para la configuración inicial se requieren Rostro y Cuerpo' });
      return;
    }

    // Subir solo los archivos que llegaron
    const uploads: { faceUrl?: string; bodyUrl?: string; phoneUrl?: string } = {};
    if (hasFace) uploads.faceUrl = await uploadToCloudinary(files!.face[0].buffer, 'face');
    if (hasBody) uploads.bodyUrl = await uploadToCloudinary(files!.body[0].buffer, 'body');
    if (hasPhone) uploads.phoneUrl = await uploadToCloudinary(files!.phone[0].buffer, 'phone');

    const config = existing
      ? await prisma.config.update({ where: { id: existing.id }, data: uploads })
      : await prisma.config.create({
          data: { faceUrl: uploads.faceUrl!, bodyUrl: uploads.bodyUrl!, phoneUrl: uploads.phoneUrl },
        });

    res.json(config);
  }
);

export default router;
