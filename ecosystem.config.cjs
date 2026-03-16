// PM2 Process Manager Configuration
// Usage:
//   pm2 start ecosystem.config.cjs
//   pm2 save
//   pm2 startup  (then run the command it outputs, as Administrator)

module.exports = {
  apps: [
    {
      name: 'hr-portal',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    }
  ]
};
