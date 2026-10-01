import { createHash, timingSafeEqual } from 'node:crypto';

export function previewAuth(user, password, realm) {
  if (password === undefined) return () => true;
  if (password.trim().length < 12 || !user?.trim() || user.includes(':')) {
    throw new Error('Preview authentication requires a nonempty username without a colon and a password of at least 12 nonblank characters.');
  }
  const expected = createHash('sha256').update(`${user}:${password}`).digest();
  return (request, response) => {
    const authorization = request.headers.authorization ?? '';
    const supplied = authorization.startsWith('Basic ')
      ? Buffer.from(authorization.slice(6), 'base64') : Buffer.alloc(0);
    const actual = createHash('sha256').update(supplied).digest();
    if (timingSafeEqual(expected, actual)) return true;
    response.writeHead(401, {
      'WWW-Authenticate': `Basic realm="${realm}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
    });
    response.end('Preview authentication required');
    return false;
  };
}
