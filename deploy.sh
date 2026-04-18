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
