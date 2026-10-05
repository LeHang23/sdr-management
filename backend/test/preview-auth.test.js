import assert from 'node:assert/strict';
import test from 'node:test';
import { previewAuth } from '../src/preview-auth.js';

test('preview auth keeps local use optional and rejects malformed credentials', () => {
  assert.equal(previewAuth(undefined, undefined, 'Preview')({}, {}), true);
  for (const [user, password] of [['admin', 'short'], ['', 'long-test-password'], ['a:b', 'long-test-password']]) {
    assert.throws(() => previewAuth(user, password, 'Preview'), /authentication/);
  }
  const authorize = previewAuth('admin', 'long-test-password', 'Preview');
  let status;
  const response = { writeHead(value) { status = value; }, end() {} };
  assert.equal(authorize({ headers: { authorization: 'Bearer anything' } }, response), false);
  assert.equal(status, 401);
  assert.equal(authorize({ headers: { authorization: `Basic ${Buffer.from('admin:long-test-password').toString('base64')}` } }, response), true);
});
