import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import configRoutes from './routes/config';
import generateRoutes from './routes/generate';
import variationsRoutes from './routes/variations';
import galleryRoutes from './routes/gallery';

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.stack ?? err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('exit', (code) => {
  console.log(`[exit] code=${code}`);
});
process.on('SIGTERM', () => {
  console.log('[SIGTERM]');
  process.exit(0);
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '20mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/config', configRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/variations', variationsRoutes);
app.use('/api/gallery', galleryRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[express error]', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`ARI STUDIO backend running on port ${PORT}`);
});

export default app;
