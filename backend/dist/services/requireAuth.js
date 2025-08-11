import { verifyJwt } from './jwt.js';
export function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.substring(7) : null;
    if (!token)
        return res.status(401).json({ error: 'unauthorized' });
    const payload = verifyJwt(token);
    if (!payload)
        return res.status(401).json({ error: 'invalid_token' });
    req.user = payload;
    return next();
}
