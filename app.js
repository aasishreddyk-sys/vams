import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { buildSeed, prepareStore } from './src/appCore.js';

const AppStateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    store: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

const AppState = mongoose.models.AppState || mongoose.model('AppState', AppStateSchema);

export function createApp({ mongoEnabledRef, memoryStoreRef }) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  async function readOrCreateStore() {
    if (!mongoEnabledRef.value) {
      return { key: 'main', store: memoryStoreRef.value };
    }
    let record = await AppState.findOne({ key: 'main' });
    if (!record) {
      record = await AppState.create({ key: 'main', store: prepareStore(buildSeed()) });
    }
    return record;
  }

  app.get('/api/health', async (_req, res) => {
    const state = mongoose.connection.readyState;
    res.json({
      ok: true,
      mongoState: state,
      storage: mongoEnabledRef.value ? 'mongodb' : 'memory'
    });
  });

  app.get('/api/store', async (_req, res) => {
    const record = await readOrCreateStore();
    res.json({ store: prepareStore(record.store) });
  });

  app.put('/api/store', async (req, res) => {
    const incomingStore = req.body?.store;
    if (!incomingStore) {
      res.status(400).json({ error: 'Missing store payload.' });
      return;
    }

    const normalized = prepareStore(incomingStore);
    if (!mongoEnabledRef.value) {
      memoryStoreRef.value = normalized;
      res.json({ store: memoryStoreRef.value });
      return;
    }
    const record = await AppState.findOneAndUpdate(
      { key: 'main' },
      { $set: { store: normalized } },
      { new: true, upsert: true }
    );

    res.json({ store: record.store });
  });

  app.post('/api/store/reset', async (_req, res) => {
    const seed = prepareStore(buildSeed());
    if (!mongoEnabledRef.value) {
      memoryStoreRef.value = seed;
      res.json({ store: memoryStoreRef.value });
      return;
    }
    const record = await AppState.findOneAndUpdate(
      { key: 'main' },
      { $set: { store: seed } },
      { new: true, upsert: true }
    );

    res.json({ store: record.store });
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: error.message || 'Server error' });
  });

  return app;
}
