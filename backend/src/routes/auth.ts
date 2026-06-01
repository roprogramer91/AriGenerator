import { Router, Request, Response } from 'express';
import { signToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  const validUser = process.env.AUTH_USERNAME;
  const validPass = process.env.AUTH_PASSWORD;

  if (!validUser || !validPass) {
    res.status(500).json({ error: 'Auth no configurada en el servidor' });
    return;
  }

  if (username !== validUser || password !== validPass) {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    return;
  }

  res.json({ token: signToken() });
});

export default router;
