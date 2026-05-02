import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSeed, prepareStore } from './src/appCore.js';
import { createApp } from './app.js';

dotenv.config();

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sams';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const mongoEnabledRef = { value: false };
const memoryStoreRef = { value: prepareStore(buildSeed()) };

const app = createApp({ mongoEnabledRef, memoryStoreRef });

app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    mongoEnabledRef.value = true;
    console.log(`MongoDB connected: ${MONGODB_URI}`);
  } catch (error) {
    mongoEnabledRef.value = false;
    console.warn('MongoDB connection failed. Falling back to in-memory storage.');
    console.warn(error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} using ${mongoEnabledRef.value ? 'mongodb' : 'memory'} storage`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
