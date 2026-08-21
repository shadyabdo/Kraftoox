/* تخزين مؤقت للملفات بين صفحة الهبوط وأداة المعالجة المختارة */

let pending: File[] | null = null;

export function stashPendingFiles(files: File[]): void {
  pending = files;
}

export function takePendingFiles(): File[] | null {
  const f = pending;
  pending = null;
  return f;
}
