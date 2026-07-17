import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../middleware/requireUser.js';

const router = Router();

router.use(requireUser);

router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json(db.prepare(`
    SELECT history.word, MAX(history.searched_at) AS searched_at, stardict.translation
    FROM history
    LEFT JOIN stardict ON stardict.word = history.word COLLATE NOCASE
    WHERE history.username = ?
    GROUP BY history.word
    ORDER BY searched_at DESC
    LIMIT ?
  `).all(req.username, limit));
});

router.post('/', (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'word is required' });
  db.prepare('INSERT INTO history (username, word) VALUES (?, ?)').run(req.username, word);
  res.status(201).json({ word });
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM history WHERE username = ?').run(req.username);
  res.status(204).end();
});

export default router;
