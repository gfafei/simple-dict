import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/words/random
router.get('/random', (req, res) => {
  const row = db.prepare('SELECT * FROM stardict ORDER BY RANDOM() LIMIT 1').get();
  res.json(row ?? null);
});

// escape LIKE wildcards in user input so e.g. "a_b" doesn't match "axb"
const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

// GET /api/words/search?q=...&limit=20
router.get('/search', (req, res) => {
  const q = (req.query.q ?? '').trim();
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  if (!q) return res.json([]);

  const rows = db.prepare(`
    SELECT * FROM stardict
    WHERE word LIKE ? ESCAPE '\\'
    ORDER BY CASE WHEN word = ? THEN 0 ELSE 1 END, LENGTH(word), word
    LIMIT ?
  `).all(`${escapeLike(q)}%`, q, limit);

  res.json(rows);
});

// GET /api/words/:word (exact lookup)
router.get('/:word', (req, res) => {
  const row = db.prepare('SELECT * FROM stardict WHERE word = ? COLLATE NOCASE').get(req.params.word);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

export default router;
