# Mentalaba AI Frontend (ai_front)

Mentalaba AI agent - chat interfeysi (Next.js). Backend alohida repo'da:
[AzizbekAdxamov/aiagent](https://github.com/AzizbekAdxamov/aiagent).

## Ishga tushirish (local)

1. Backend (alohida terminal, aiagent repo): npm install && npm run dev  (port 3000)
2. Frontend (shu repo): npm install && cp .env.example .env && npm run dev  (port 3001 → http://localhost:3001)

## Muhim

- Barcha API so'rovlari `src/lib/api.ts` orqali backend'ga boradi (`NEXT_PUBLIC_API_URL`).
- Backend'da CORS: `CORS_ALLOWED_ORIGINS` env o'zgaruvchisi orqali domen ruxsat etiladi.

## Deploy (Vercel)

1. Vercel'da yangi loyiha → shu repo (ai_front)
2. Environment Variables: `NEXT_PUBLIC_API_URL` = backend URL
3. Deploy — frontend avtomatik backend'ga ulanadi.
