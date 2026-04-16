module.exports = {
  apps: [
    {
      name: 'ams-frontend',
      script: 'npm',
      args: 'run start',
      cwd: './ams-ui',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'ams-backend',
      script: 'venv/bin/gunicorn',
      args: '--workers 3 --bind 127.0.0.1:8000 ams_core.wsgi:application',
      cwd: './ams-backend',
      env: {
        DJANGO_SETTINGS_MODULE: 'ams_core.settings',
      },
    },
  ],
};
