export const SAFE_FILE_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[/\\]/).pop() ?? fileName;
  const withoutTraversal = baseName.replace(/\.\./g, '').trim();
  const sanitized = withoutTraversal
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);

  if (!sanitized || !SAFE_FILE_NAME_PATTERN.test(sanitized)) {
    return 'file';
  }

  return sanitized;
}
