import { Router } from 'express';
import { activityLog } from '../services/activityLog.js';

export const activityRouter = Router();

activityRouter.get('/activity', (_req, res) => {
  const limit = parseInt(String(_req.query.limit)) || 50;
  res.json({ activities: activityLog.getAll(limit) });
});

activityRouter.get('/activity/stats', (_req, res) => {
  res.json(activityLog.getStats());
});
