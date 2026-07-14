import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM favorites ORDER BY created_at DESC').all());
});

router.post('/', (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'word is required' });
  db.prepare('INSERT OR IGNORE INTO favorites (word) VALUES (?)').run(word);
  res.status(201).json({ word });
});

router.delete('/:word', (req, res) => {
  db.prepare('DELETE FROM favorites WHERE word = ?').run(req.params.word);
  res.status(204).end();
});

export default router;
