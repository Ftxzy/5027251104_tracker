require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.static(__dirname));

// ── Matkul ───────────────────────────────────────────────────────────────────

app.get('/api/matkul', async (req, res, next) => {
  try {
    res.json(await prisma.matkul.findMany({ orderBy: { kode: 'asc' } }));
  } catch (e) { next(e); }
});

// ── Tugas ────────────────────────────────────────────────────────────────────

app.get('/api/tugas', async (req, res, next) => {
  try {
    res.json(await prisma.tugas.findMany({ orderBy: { id: 'asc' } }));
  } catch (e) { next(e); }
});

app.post('/api/tugas', async (req, res, next) => {
  try {
    const { judul, matkul, deadline } = req.body;
    if (!judul || judul.length < 3)
      return res.status(400).json({ error: 'Judul minimal 3 karakter' });
    if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline))
      return res.status(400).json({ error: 'Deadline wajib berformat YYYY-MM-DD' });
    res.status(201).json(await prisma.tugas.create({
      data: { judul, matkul: matkul || 'Umum', deadline, selesai: false },
    }));
  } catch (e) { next(e); }
});

app.patch('/api/tugas/:id', async (req, res, next) => {
  try {
    const { selesai } = req.body;
    if (typeof selesai !== 'boolean')
      return res.status(400).json({ error: 'selesai harus berupa boolean' });
    res.json(await prisma.tugas.update({
      where: { id: Number(req.params.id) },
      data: { selesai },
    }));
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    next(e);
  }
});

app.delete('/api/tugas/:id', async (req, res, next) => {
  try {
    await prisma.tugas.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    next(e);
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
