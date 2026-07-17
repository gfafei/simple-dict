import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../middleware/requireUser.js';

const router = Router();

router.use(requireUser);

router.get('/', (req, res) => {
  res.json(db.prepare(`
    SELECT favorites.word, favorites.created_at, stardict.translation
    FROM favorites
    LEFT JOIN stardict ON stardict.word = favorites.word COLLATE NOCASE
    WHERE favorites.username = ?
    ORDER BY favorites.created_at DESC
  `).all(req.username));
});

router.post('/', (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'word is required' });
  db.prepare('INSERT OR IGNORE INTO favorites (username, word) VALUES (?, ?)').run(req.username, word);
  res.status(201).json({ word });
});

router.delete('/:word', (req, res) => {
  db.prepare('DELETE FROM favorites WHERE username = ? AND word = ?').run(req.username, req.params.word);
  res.status(204).end();
});

export default router;
