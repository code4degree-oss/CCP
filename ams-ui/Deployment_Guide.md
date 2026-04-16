# Complete Deployment Guide for AMS on VM

This guide will walk you through setting up your Admission Management System (Frontend + Backend) on a fresh Ubuntu Virtual Machine using **PM2** and **Nginx**.

## Prerequisites
1. An Ubuntu VM (20.04 or 22.04 recommended).
2. Domain name pointed to the VM's public IP (optional, but recommended if you want SSL/HTTPS).
3. The codebase pushed to your GitHub repository.

---

## Step 1: Install System Dependencies

SSH into your VM and install the necessary software packages: Node.js, NPM, Python, Nginx, and Git.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-venv python3-pip -y

# Install Nginx
sudo apt install nginx -y

# Install Node.js (v18 recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL (Only if hosting the database locally on the VM)
sudo apt install postgresql postgresql-contrib -y
```

---

## Step 2: Set Up Database (If running locally)

If you are using a local Postgres database:

```bash
sudo -u postgres psql

# In the psql prompt:
CREATE DATABASE ams;
CREATE USER amsuser WITH PASSWORD 'your_secure_password';
ALTER ROLE amsuser SET client_encoding TO 'utf8';
ALTER ROLE amsuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE amsuser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ams TO amsuser;
\q
```

*Don't forget to update your `ams-backend/ams_core/settings.py` or `.env` file with these database credentials on the server!*

---

## Step 3: Clone the Repository

We'll place the project in `/var/www/ams`.

```bash
# Create the directory
sudo mkdir -p /var/www/ams
sudo chown -R $USER:$USER /var/www/ams

# Clone the repository
git clone https://github.com/code4degree-oss/CCP.git /var/www/ams

cd /var/www/ams
```

*Assuming your repo contains both `ams-ui` and `ams-backend`.*

---

## Step 4: Configure the Backend

```bash
cd /var/www/ams/ams-backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create initial superuser (keep the credentials safe)
python manage.py createsuperuser

# Deactivate venv
deactivate
```

---

## Step 5: Configure the Frontend

```bash
cd /var/www/ams/ams-ui/ams-ui

# Install node dependencies
npm install

# Build the Next.js app
npm run build
```

---

## Step 6: Start Services with PM2

We provided an `ecosystem.config.js` file in your `ams-ui` directory. To start both the Next.js UI and the Django backend simultaneously:

```bash
cd /var/www/ams/ams-ui/ams-ui

# Start the services defined in ecosystem.config.js
pm2 start ecosystem.config.js --env production

# Ensure PM2 starts on reboot
pm2 startup
# (Run the generated command that PM2 outputs, which usually looks like:
#  sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER)

# Save the PM2 list
pm2 save
```

Check the status to ensure everything is online:
```bash
pm2 status
```

---

## Step 7: Configure Nginx as a Reverse Proxy

We will configure Nginx to route traffic to your frontend on port 3000, and API requests to your backend on port 8000.

Create a new Nginx block:
```bash
sudo nano /etc/nginx/sites-available/ams.conf
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your_domain_or_ip; # e.g., ams.yourdomain.com or 192.168.1.100

    # Route frontend requests to the Next.js server running on PM2
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Route API requests to the Django backend running under PM2
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/ams.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 8: Setup CI/CD (GitHub Actions)

Your repository now has `.github/workflows/deploy.yml`. To make it work, add the following **Repository Secrets** to your GitHub repository (Settings > Secrets and variables > Actions):

1. **`SERVER_HOST`**: The public IP address of your VM.
2. **`SERVER_USER`**: The SSH username (e.g., `ubuntu` or `root`).
3. **`SERVER_SSH_KEY`**: Your private SSH key (`~/.ssh/id_rsa`). Create one on your local machine and add the public key (`id_rsa.pub`) to `~/.ssh/authorized_keys` on your VM.

Now, whenever you push code to the `main` or `master` branch, GitHub Actions will automatically log into your server and run `bash deploy.sh`, updating the application!
