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
      script: '/home/ccp/CCP/ams-backend/venv/bin/gunicorn',
      args: '--workers 3 --bind 127.0.0.1:8000 ams_core.wsgi:application',
      cwd: '/home/ccp/CCP/ams-backend',
      interpreter: '/home/ccp/CCP/ams-backend/venv/bin/python3',
      env: {
        DJANGO_SETTINGS_MODULE: 'ams_core.settings',
      },
    },
  ],
};
