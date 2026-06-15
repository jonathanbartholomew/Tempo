import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { requireAuth } from './middleware/auth.js';
import dataRoutes from './routes/data.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', requireAuth, dataRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Tempo API server listening on port ${port}`);
});
