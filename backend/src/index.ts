// Registrar handlers ANTES de cualquier import
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.stack || err.message || err);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[unhandledRejection]', reason);
});

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Log de variables de entorno al arranque (sin valores sensibles)
console.log('[startup] env keys set:', {
  DATABASE_URL: !!process.env.DATABASE_URL,
  ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
  GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  CLOUDINARY_URL: !!process.env.CLOUDINARY_URL,
  PORT: process.env.PORT,
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cargar rutas de forma lazy para capturar errores de import
async function loadRoutes() {
  try {
    const { default: configRoutes } = await import('./routes/config');
    const { default: generateRoutes } = await import('./routes/generate');
    const { default: variationsRoutes } = await import('./routes/variations');
    const { default: galleryRoutes } = await import('./routes/gallery');

    app.use('/api/config', configRoutes);
    app.use('/api/generate', generateRoutes);
    app.use('/api/variations', variationsRoutes);
    app.use('/api/gallery', galleryRoutes);

    console.log('[startup] routes loaded OK');
  } catch (err) {
    console.error('[startup] error loading routes:', err);
  }
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[express error]', err);
  res.status(500).json({ error: err.message });
});

loadRoutes().then(() => {
  app.listen(PORT, () => {
    console.log(`ARI STUDIO backend running on port ${PORT}`);
  });
});

export default app;
