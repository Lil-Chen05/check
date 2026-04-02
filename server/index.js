import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { socketAuthMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import roomHandlers from './socket/roomHandlers.js';
import gameHandlers from './socket/gameHandlers.js';
import reactionHandlers from './socket/reactionHandlers.js';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL,
].filter(Boolean);

const isLanOrigin = (origin) => {
  return /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(origin);
};

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return isLanOrigin(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const io = new Server(httpServer, {
  cors: corsOptions,
});

const rooms = new Map();

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.displayName} (${socket.userId})`);

  roomHandlers(io, socket, rooms);
  gameHandlers(io, socket, rooms);
  reactionHandlers(io, socket, rooms);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Check server running on port ${PORT}`);
});
