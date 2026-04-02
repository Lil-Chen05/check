import jwt from 'jsonwebtoken';

export function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    console.warn('SUPABASE_JWT_SECRET not set — accepting all connections in dev mode');
    socket.userId = socket.handshake.auth.userId || 'dev-' + Math.random().toString(36).slice(2, 8);
    socket.displayName = socket.handshake.auth.displayName || 'Player';
    return next();
  }

  try {
    const payload = jwt.verify(token, secret);
    socket.userId = payload.sub;
    socket.displayName = socket.handshake.auth.displayName || 'Player';
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}
