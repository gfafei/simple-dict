import express from 'express';
import cors from 'cors';
import { ensureSchema } from './db.js';
import wordsRouter from './routes/words.js';
import favoritesRouter from './routes/favorites.js';
import historyRouter from './routes/history.js';

ensureSchema();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/words', wordsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/history', historyRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`simple-dict server listening on http://localhost:${PORT}`);
});
