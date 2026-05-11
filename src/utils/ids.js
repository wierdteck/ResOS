export function createId(prefix) {
  if (!/^[a-z][a-z0-9-]{0,20}$/.test(prefix)) {
    throw new Error('Invalid ID prefix.');
  }

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return `${prefix}-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  }

  throw new Error('Secure random ID generation is unavailable.');
}
