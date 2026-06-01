import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import configRoutes from './routes/config';
import generateRoutes from './routes/generate';
import variationsRoutes from './routes/variations';
import galleryRoutes from './routes/gallery';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/config', configRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/variations', variationsRoutes);
app.use('/api/gallery', galleryRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ARI STUDIO backend running on port ${PORT}`);
});

export default app;
