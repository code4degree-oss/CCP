#!/bin/bash
# Deploy Script for AMS Application
# This script is located at /var/www/ams/ and triggered by CI/CD

set -e

echo "Starting Deployment process..."

PROJECT_DIR="/var/www/ams"
cd $PROJECT_DIR

echo "Pulling latest changes from Git..."
git pull origin main

# 1. Update Backend
echo "Updating Backend..."
cd ams-backend

# Ensure .env file exists (it's not in git)
if [ ! -f .env ]; then
  echo "⚠️  WARNING: No .env file found in ams-backend/"
  echo "   Creating a default one. Please update with production values!"
  cat > .env << 'EOF'
DJANGO_SECRET_KEY=CHANGE-ME-IN-PRODUCTION
DJANGO_DEBUG=False
DB_NAME=amsdb
DB_USER=postgres
DB_PASSWORD=CHANGE-ME
DB_HOST=localhost
DB_PORT=5432
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,ccp.dybusinesssolutions.com
EOF
fi

source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
deactivate
cd ..

# 2. Update Frontend
echo "Updating Frontend..."
cd ams-ui
npm install
npm run build
cd ..

# 3. Restart services via PM2
echo "Restarting services via PM2..."
pm2 restart ecosystem.config.js --env production
pm2 save

echo "Deployment completed successfully!"
