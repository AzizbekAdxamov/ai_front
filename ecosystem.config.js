// ============================================================
// Mentalaba AI Frontend — (ai_front) uchun PM2 config
// ============================================================
// Ishga tushirish:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup            (server qayta ishga tushganda avto)
// Loglarni korish:
//   pm2 logs mentalaba-ai-front
//   pm2 monit
// ============================================================
// MUHIM: Frontend backendga `NEXT_PUBLIC_API_URL` orqali ulanadi.
// .env faylida togri backend manzili yozilganiga ishonch hosil qiling:
//   NEXT_PUBLIC_API_URL=http://localhost:3000   (local)
//   NEXT_PUBLIC_API_URL=https://api.mentalaba.uz (production)
// ============================================================

module.exports = {
  apps: [
    {
      name: "mentalaba-ai-front",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      restart_delay: 3000,
    },
  ],
};
