/* رفع الصور لرابط مباشر — عبر خدمة مجانية بدون مفتاح، مع خطة ربط خلفية اختيارية */

export async function uploadToTmpfiles(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: fd,
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { status?: string; data?: { url?: string } };
    if (json.status === "success" && json.data?.url) {
      // تحويل رابط الصفحة إلى رابط التحميل المباشر
      return json.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
    }
    throw new Error("bad response");
  } finally {
    clearTimeout(timer);
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(file);
  });
}
