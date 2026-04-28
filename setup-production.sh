#!/bin/bash
# ══════════════════════════════════════════════════════════════
#  LeadFlow CRM / AMS — Full Production Server Setup Script
#  Run this on a FRESH Ubuntu VM (22.04 / 24.04)
#  Usage:  chmod +x setup-production.sh && sudo ./setup-production.sh
# ══════════════════════════════════════════════════════════════

set -e

# ─── CONFIGURATION (CHANGE THESE!) ───────────────────────────
DOMAIN="crm.chanakyacp.com"               # Your domain
APP_USER="ccp"                             # Linux user to run the app
PROJECT_DIR="/home/${APP_USER}/CCP"        # Where the code lives
GIT_REPO="https://github.com/code4degree-oss/CCP"  # Your git repo URL

# Database credentials
DB_NAME="ccpdb"
DB_USER="ccp"
DB_PASS="CCP@123"

# Django secret key (auto-generated)
DJANGO_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))" 2>/dev/null || openssl rand -base64 50 | tr -dc 'a-zA-Z0-9' | head -c 50)

# Node version
NODE_VERSION="20"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  LeadFlow CRM — Production Setup"
echo "  Domain: ${DOMAIN}"
echo "  App User: ${APP_USER}"
echo "══════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 1: System Update & Essential Packages
# ═══════════════════════════════════════════════════════════════
echo "━━━ [1/9] Updating system packages... ━━━"
apt update && apt upgrade -y
apt install -y \
    git curl wget unzip build-essential \
    python3 python3-pip python3-venv \
    nginx certbot python3-certbot-nginx \
    ufw fail2ban \
    software-properties-common

# ═══════════════════════════════════════════════════════════════
# STEP 2: Create App User
# ═══════════════════════════════════════════════════════════════
echo "━━━ [2/9] Setting up app user: ${APP_USER}... ━━━"
if ! id "${APP_USER}" &>/dev/null; then
    adduser --disabled-password --gecos "" ${APP_USER}
    echo "${APP_USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
    echo "✅ User '${APP_USER}' created"
else
    echo "ℹ️  User '${APP_USER}' already exists, skipping."
fi

# ═══════════════════════════════════════════════════════════════
# STEP 3: Install & Configure PostgreSQL
# ═══════════════════════════════════════════════════════════════
echo "━━━ [3/9] Installing PostgreSQL... ━━━"
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl enable postgresql
systemctl start postgresql

# Create database and user
echo "Creating database '${DB_NAME}' and user '${DB_USER}'..."
sudo -u postgres psql <<SQL
-- Drop existing if re-running (comment out if you have data!)
-- DROP DATABASE IF EXISTS ${DB_NAME};
-- DROP USER IF EXISTS ${DB_USER};

-- Create user with secure password
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
        CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
    ELSE
        ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
    END IF;
END
\$\$;

-- Create database owned by our user
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};

-- Allow user to create tables in public schema
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
SQL

echo "✅ PostgreSQL configured"
echo "   Database: ${DB_NAME}"
echo "   User:     ${DB_USER}"
echo "   Password: ${DB_PASS}"

# ═══════════════════════════════════════════════════════════════
# STEP 4: Install Node.js & PM2
# ═══════════════════════════════════════════════════════════════
echo "━━━ [4/9] Installing Node.js ${NODE_VERSION} & PM2... ━━━"
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
fi
npm install -g pm2
echo "✅ Node $(node -v) + PM2 installed"

# ═══════════════════════════════════════════════════════════════
# STEP 5: Clone Project & Setup Backend
# ═══════════════════════════════════════════════════════════════
echo "━━━ [5/9] Setting up project... ━━━"

# Clone repo (or pull if exists)
if [ ! -d "${PROJECT_DIR}" ]; then
    sudo -u ${APP_USER} git clone ${GIT_REPO} ${PROJECT_DIR}
else
    echo "ℹ️  Project directory exists. Pulling latest..."
    cd ${PROJECT_DIR} && sudo -u ${APP_USER} git pull origin main
fi

cd ${PROJECT_DIR}/ams-backend

# Create Python virtual environment
if [ ! -d "venv" ]; then
    sudo -u ${APP_USER} python3 -m venv venv
fi

# Create the .env file with production values
echo "Creating .env file..."
sudo -u ${APP_USER} cat > .env <<ENV
# ── Django Core ──────────────────────────────────────
DJANGO_SECRET_KEY=${DJANGO_SECRET}
# WARNING: DEBUG is set to True initially to help debug minor changes. 
# Make sure to change this to False in /home/ccp/CCP/ams-backend/.env and restart PM2 once everything works!
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,${DOMAIN}

# ── Database (PostgreSQL) ────────────────────────────
DB_ENGINE=django.db.backends.postgresql
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_HOST=localhost
DB_PORT=5432
ENV

# Install Python dependencies
sudo -u ${APP_USER} bash -c "
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
"

# Create logs directory for security middleware
sudo -u ${APP_USER} mkdir -p logs

# Run migrations
sudo -u ${APP_USER} bash -c "
    source venv/bin/activate
    python manage.py migrate
    python manage.py collectstatic --noinput
"

# Set correct ownership
chown -R ${APP_USER}:${APP_USER} ${PROJECT_DIR}/ams-backend

echo "✅ Backend configured"

# ═══════════════════════════════════════════════════════════════
# STEP 6: Setup Frontend
# ═══════════════════════════════════════════════════════════════
echo "━━━ [6/9] Building frontend... ━━━"
cd ${PROJECT_DIR}/ams-ui

sudo -u ${APP_USER} npm install
sudo -u ${APP_USER} npm run build

echo "✅ Frontend built"

# ═══════════════════════════════════════════════════════════════
# STEP 7: Configure Nginx (Reverse Proxy + Rate Limiting)
# ═══════════════════════════════════════════════════════════════
echo "━━━ [7/9] Configuring Nginx... ━━━"

cat > /etc/nginx/sites-available/${DOMAIN} <<'NGINX'
# ── Nginx Rate Limiting Zones ────────────────────────
# General API: 10 requests/second per IP (burst 20)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Login endpoint: 3 requests/minute per IP (strict!)
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=3r/m;

# Global connection limit: max 20 simultaneous connections per IP
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    # ── Global connection limit ──────────────────────
    limit_conn conn_limit 20;

    # ── Block common bot user agents ─────────────────
    if ($http_user_agent ~* (scrapy|bot|crawl|slurp|spider|wget|curl) ) {
        return 403;
    }

    # ── Request size limit (matches Django middleware) ──
    client_max_body_size 20M;

    # ── Security Headers ─────────────────────────────
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ── Login endpoint — VERY strict rate limit ──────
    location = /api/login/ {
        limit_req zone=login_limit burst=5 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ── API endpoints — moderate rate limit ──────────
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ── Media files (served by Django/Gunicorn) ──────
    location /media/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ── Django Admin ─────────────────────────────────
    location /admin/ {
        # Only allow from specific IPs (uncomment & add your IP)
        # allow YOUR_IP_HERE;
        # deny all;

        limit_req zone=api_limit burst=5 nodelay;

        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ── Static files (Django collectstatic) ──────────
    location /static/ {
        alias /home/APP_USER_PLACEHOLDER/CCP/ams-backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # ── Frontend (Next.js) ───────────────────────────
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

# Replace placeholders with actual values
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" /etc/nginx/sites-available/${DOMAIN}
sed -i "s/APP_USER_PLACEHOLDER/${APP_USER}/g" /etc/nginx/sites-available/${DOMAIN}

# Enable the site
ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test & reload
nginx -t && systemctl reload nginx
echo "✅ Nginx configured with rate limiting"

# ═══════════════════════════════════════════════════════════════
# STEP 8: Firewall & Fail2Ban
# ═══════════════════════════════════════════════════════════════
echo "━━━ [8/9] Setting up firewall & fail2ban... ━━━"

# UFW Firewall — only allow SSH, HTTP, HTTPS
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Fail2Ban — auto-ban IPs with too many failed SSH attempts
systemctl enable fail2ban
systemctl start fail2ban

echo "✅ Firewall + Fail2Ban active"

# ═══════════════════════════════════════════════════════════════
# STEP 9: Start Services with PM2
# ═══════════════════════════════════════════════════════════════
echo "━━━ [9/9] Starting application with PM2... ━━━"

cd ${PROJECT_DIR}

# Start both frontend and backend
sudo -u ${APP_USER} pm2 start ecosystem.config.js
sudo -u ${APP_USER} pm2 save

# Set PM2 to auto-start on reboot
env PATH=$PATH:/usr/bin pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER}

echo "✅ Application running!"

# ═══════════════════════════════════════════════════════════════
# DONE — Print Summary
# ═══════════════════════════════════════════════════════════════
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  ✅  SETUP COMPLETE!"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "  🌐  Domain:      http://${DOMAIN}"
echo "  📁  Project:     ${PROJECT_DIR}"
echo "  🐘  DB Name:     ${DB_NAME}"
echo "  👤  DB User:     ${DB_USER}"
echo "  🔑  DB Password: ${DB_PASS}"
echo "  🔐  Django Key:  ${DJANGO_SECRET}"
echo ""
echo "  ⚠️   SAVE THESE CREDENTIALS! They won't be shown again."
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  NEXT STEPS:"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "  1. Point your domain DNS (A record) to this server's IP"
echo ""
echo "  2. Enable HTTPS with Certbot:"
echo "     sudo certbot --nginx -d ${DOMAIN}"
echo ""
echo "  3. Create Django superuser:"
echo "     cd ${PROJECT_DIR}/ams-backend"
echo "     source venv/bin/activate"
echo "     python manage.py createsuperuser"
echo ""
echo "  4. Verify everything:"
echo "     pm2 status"
echo "     curl -I http://localhost:3000"
echo "     curl -I http://localhost:8000/api/"
echo ""
echo "  5. View logs:"
echo "     pm2 logs"
echo "     tail -f ${PROJECT_DIR}/ams-backend/logs/security.log"
echo ""
echo "══════════════════════════════════════════════════════════"
