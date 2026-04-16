#!/bin/bash
# Deploy Script for AMS Application
# This script should be located in your VM and triggered by CI/CD

# Exit on any error
set -e

echo "Starting Deployment process..."

# 1. Update Codebase
# Replace this path with the actual path where your project is cloned on the VM
PROJECT_DIR="/var/www/ams"
cd $PROJECT_DIR

echo "Pulling latest changes from Git..."
git pull origin main

# 2. Update Backend
echo "Updating Backend..."
cd ams-backend
# Activate virtual environment
source venv/bin/activate
# Install new dependencies
pip install -r requirements.txt
# Run migrations
python manage.py migrate
# (Optional) Collect static files if you use them in Django
# python manage.py collectstatic --noinput
# Deactivate virtual environment
deactivate
cd ..

# 3. Update Frontend
echo "Updating Frontend..."
cd ams-ui/ams-ui
npm install
npm run build
cd ../..

# 4. Restart services via PM2
echo "Restarting services via PM2..."
pm2 restart ecosystem.config.js --env production
pm2 save

echo "Deployment completed successfully!"
