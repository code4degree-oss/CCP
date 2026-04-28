module.exports = {
  apps: [
    {
      name: 'ams-frontend',
      script: 'npm',
      args: 'run start',
      cwd: '/home/ccp/CCP/ams-ui',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'ams-backend',
      script: 'bash',
      args: '-c "venv/bin/gunicorn -w 4 --threads 4 --timeout 120 --graceful-timeout 30 --keep-alive 5 -b 127.0.0.1:8000 ams_core.wsgi:application"',
      cwd: '/home/ccp/CCP/ams-backend',
      env: {
        DJANGO_SETTINGS_MODULE: 'ams_core.settings',
      },
    },
  ],
};
