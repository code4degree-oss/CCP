#!/bin/bash
# ==============================================================================
# Complete VM Setup Script for AMS (Ubuntu 20.04/22.04/24.04)
# Run this script with root privileges: sudo bash setup_vm.sh
# ==============================================================================

set -e

# ======================= CONFIGURATION VARIABLES ==============================
DB_NAME="ams"
DB_USER="amsuser"
DB_PASS="ams_secure_password123"
DOMAIN="your_domain_or_ip"
PROJECT_DIR="/var/www/ams"
REPO_URL="https://github.com/code4degree-oss/CCP.git"
# ==============================================================================

echo "=================================================="
echo " Starting AMS Virtual Machine Provisioning Script "
echo "=================================================="

# 1. Update and Install Core Dependencies
echo "[1/7] Updating system and installing core dependencies..."
apt update && apt upgrade -y
apt install -y curl wget git nginx python3 python3-venv python3-pip postgresql postgresql-contrib

# 2. Install Node.js (v18) and PM2
echo "[2/7] Installing Node.js (v18) and PM2..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt install -y nodejs
else
    echo "Node.js already installed."
fi

npm install -g pm2

# 3. Setup PostgreSQL Database
echo "[3/7] Setting up PostgreSQL..."
echo "Creating database and user..."
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" || echo "Database already exists."
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" || echo "User already exists."
sudo -u postgres psql -c "ALTER ROLE ${DB_USER} SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE ${DB_USER} SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE ${DB_USER} SET timezone TO 'UTC';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"


# 4. Create Directory Structure and Clone Repository
echo "[4/7] Setting up project directory at ${PROJECT_DIR}..."
mkdir -p /var/www
if [ ! -d "$PROJECT_DIR" ]; then
    git clone $REPO_URL $PROJECT_DIR
    echo "Repository cloned successfully."
else
    echo "Directory ${PROJECT_DIR} already exists. Skipping clone."
fi

chown -R $SUDO_USER:$SUDO_USER $PROJECT_DIR

# 5. Configure Nginx Reverse Proxy
echo "[5/7] Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/ams.conf"

cat <<EOF > $NGINX_CONF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ams.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

# 6. Final Instructions
echo "=================================================="
echo " Provisioning almost complete!                    "
echo "=================================================="
echo ""
echo "To finish the setup, run these commands:"
echo ""
echo "1. cd ${PROJECT_DIR}"
echo ""
echo "2. Setup Backend:"
echo "   cd ams-backend"
echo "   python3 -m venv venv"
echo "   source venv/bin/activate"
echo "   pip install -r requirements.txt"
echo "   (Update ams_core/settings.py with DB password: '${DB_PASS}')"
echo "   python manage.py migrate"
echo "   python manage.py createsuperuser"
echo "   deactivate"
echo ""
echo "3. Setup Frontend:"
echo "   cd ../ams-ui"
echo "   npm install"
echo "   npm run build"
echo ""
echo "4. Start Everything with PM2 (run from /var/www/ams):"
echo "   cd /var/www/ams"
echo "   pm2 start ecosystem.config.js --env production"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "=================================================="
