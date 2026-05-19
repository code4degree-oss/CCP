# 🖥️ Server & Deployment Info — Chanakya Career Point (CCP)

## Server Access
- **SSH:** `ssh root@serv-e367698e` (or use your hosting panel)
- **Domain:** https://ccp.dybusinesssolutions.com

---

## ⚠️ IMPORTANT: File Paths on Server

Your code lives in **TWO places** on the server. The app runs from `/home/ccp/`, NOT from `/root/`:

| What | Path |
|------|------|
| **App Root (REAL)** | `/home/ccp/CCP/` |
| **Backend Code** | `/home/ccp/CCP/ams-backend/` |
| **Frontend Code** | `/home/ccp/CCP/ams-ui/` |
| **Backend .env file** | `/home/ccp/CCP/ams-backend/.env` |
| **PM2 Config** | `/home/ccp/CCP/ecosystem.config.js` |
| **Deploy Script** | `/home/ccp/CCP/deploy.sh` |

> [!CAUTION]
> When you SSH as `root`, you land in `/root/CCP/` — this is NOT the same folder the app uses!
> Always edit files in `/home/ccp/CCP/` instead.

---

## Quick Commands (Run on Server)

### Edit Backend .env
```bash
nano /home/ccp/CCP/ams-backend/.env
```

### Restart Backend
```bash
pm2 restart ams-backend
```

### Restart Frontend
```bash
pm2 restart ams-frontend
```

### Restart Everything
```bash
pm2 restart all
```

### View Backend Logs
```bash
pm2 logs ams-backend
```

### View Frontend Logs
```bash
pm2 logs ams-frontend
```

---

## .env Variables (Backend)

```env
# ── Django Settings ──────────────────────────────────────
DJANGO_SECRET_KEY=<your_secret_key>
DJANGO_DEBUG=False

# ── Database ─────────────────────────────────────────────
DB_NAME=amsdb
DB_USER=postgres
DB_PASSWORD=<your_db_password>
DB_HOST=localhost
DB_PORT=5432

# ── Allowed Hosts ────────────────────────────────────────
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,ccp.dybusinesssolutions.com

# ── MSG91 WhatsApp API ──────────────────────────────────
MSG91_AUTH_KEY=<your_msg91_auth_key>
WHATSAPP_PHONE_NUMBER_ID=919356090278
WHATSAPP_TEMPLATE_NAME=fee_recipt
WHATSAPP_TEMPLATE_NAMESPACE=6978e867_1e6a_47c3_9f58_dc0c21c5a464
APP_PUBLIC_DOMAIN=https://ccp.dybusinesssolutions.com
```

> [!WARNING]
> Never commit actual passwords or API keys to Git!
> This file just shows the variable NAMES. The real values are only on the server.

---

## Deployment Steps (From Your Laptop)

1. Make your code changes locally
2. Run `deploy.sh` from your project root
3. SSH into the server
4. If you changed .env variables, edit: `nano /home/ccp/CCP/ams-backend/.env`
5. Restart: `pm2 restart all`
