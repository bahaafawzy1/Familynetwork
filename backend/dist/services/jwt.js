import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';
const JWT_TTL = process.env.JWT_TTL || '7d';
export function signJwt(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TTL });
}
export function verifyJwt(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
