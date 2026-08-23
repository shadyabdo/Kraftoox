/* الأدوات المستخدمة حديثاً — تُحفظ محلياً وتُعرض في ساحة الأدوات */

const KEY = "kraftoox-recent-tools";
const MAX = 6;

export function recordToolVisit(slug: string): void {
  try {
    const cur = getRecentTools();
    const next = [slug, ...cur.filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getRecentTools(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}
