import jwt from 'jsonwebtoken';

export function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;
  const secret = process.env.SUPABASE_JWT_SECRET;

  // No token = guest connection, always allowed
  if (!token) {
    socket.userId = socket.handshake.auth.userId || 'guest-' + Math.random().toString(36).slice(2, 8);
    socket.displayName = socket.handshake.auth.displayName || 'Player';
    socket.isGuest = true;
    return next();
  }

  if (!secret) {
    // Dev mode: Supabase not configured, accept all connections
    console.warn('SUPABASE_JWT_SECRET not set — accepting all connections in dev mode');
    socket.userId = socket.handshake.auth.userId || 'dev-' + Math.random().toString(36).slice(2, 8);
    socket.displayName = socket.handshake.auth.displayName || 'Player';
    return next();
  }

  try {
    const payload = jwt.verify(token, secret);
    socket.userId = payload.sub;
    socket.displayName = socket.handshake.auth.displayName || 'Player';
    socket.isGuest = false;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}
