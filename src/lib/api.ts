/**
 * FRONTEND → BACKEND API MANZILI
 * ------------------------------
 * Frontend (ai_front) va backend (aiagent) alohida deploy qilinadi.
 * Barcha chat API so'rovlari shu helper orqali backend'ning to'liq
 * URL'iga boradi:
 *
 *   /api/v1/chat  →  https://BACKEND/api/v1/chat
 *
 * NEXT_PUBLIC_API_URL build vaqtida Next.js tomonidan almashtiriladi
 * (.env yoki Vercel Environment Variables).
 * O'rnatilmagan bo'lsa — local backend (port 3000) ishlatiladi.
 */
const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

/** Berilgan API yo'lini to'liq URL'ga aylantiradi */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}
