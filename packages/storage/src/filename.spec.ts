import { sanitizeFileName } from './filename';

describe('sanitizeFileName', () => {
  it('returns a safe basename without path segments', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('folder/contract.pdf')).toBe('contract.pdf');
  });

  it('replaces unsafe characters', () => {
    expect(sanitizeFileName('my file (1).pdf')).toBe('my-file-1-.pdf');
  });

  it('falls back to file when empty after sanitization', () => {
    expect(sanitizeFileName('///')).toBe('file');
  });
});
