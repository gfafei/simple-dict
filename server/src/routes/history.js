import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json(db.prepare('SELECT * FROM history ORDER BY searched_at DESC LIMIT ?').all(limit));
});

router.post('/', (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'word is required' });
  db.prepare('INSERT INTO history (word) VALUES (?)').run(word);
  res.status(201).json({ word });
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM history').run();
  res.status(204).end();
});

export default router;
