import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import macroRouter from './routes/macroRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure CORS
  app.use(cors());

  // JSON parsing and URL encoding middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Register professional backend routes first
  app.use('/api', macroRouter);

  // Serve static assets or mount Vite Dev Server
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting development server with Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting production server configuration...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server Ready] Calorie & Macro Dashboard running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Fatal server startup failure:', error);
});
