# 🚀 VPS Deployment Guide

This guide will help you deploy the Video-to-Social Automation Pipeline to your Linux VPS.

---

## 📋 Prerequisites

- Linux VPS (Ubuntu 20.04+ or Debian 11+ recommended)
- SSH access to your VPS
- Domain name (optional, for HTTPS)
- At least 2GB RAM and 20GB disk space

---

## 🔧 Step 1: Prepare Your VPS

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js (v22+)
```bash
# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v22.x
npm --version
```

### 1.3 Install Python 3 and pip
```bash
sudo apt install -y python3 python3-pip
python3 --version  # Should be 3.8+
```

### 1.4 Install Gemini CLI
```bash
# Install Gemini CLI globally
npm install -g @google/generative-ai-cli

# Verify installation
gemini --version
```

### 1.5 Configure Gemini CLI
```bash
# Set up your Gemini API key
gemini config set apiKey YOUR_GEMINI_API_KEY_HERE
```

---

## 📦 Step 2: Transfer Your Project

### Option A: Using Git (Recommended)

```bash
# On your VPS
cd /var/www  # or your preferred directory
git clone https://github.com/yourusername/GeminiCLI-Pipe.git
cd GeminiCLI-Pipe
```

### Option B: Using SCP (Direct Transfer)

```bash
# On your LOCAL machine (Windows)
# Open PowerShell in your project directory
scp -r c:\Test\Buffer\GeminiCLI-Pipe user@your-vps-ip:/var/www/

# Then SSH into your VPS
ssh user@your-vps-ip
cd /var/www/GeminiCLI-Pipe
```

### Option C: Using rsync (Best for Updates)

```bash
# On your LOCAL machine (requires WSL or Git Bash)
rsync -avz --exclude 'node_modules' --exclude 'content' --exclude 'temp' \
  /c/Test/Buffer/GeminiCLI-Pipe/ user@your-vps-ip:/var/www/GeminiCLI-Pipe/
```

---

## 🔐 Step 3: Configure Environment

### 3.1 Create .env File
```bash
cd /var/www/GeminiCLI-Pipe
nano .env
```

Add the following (adjust values):
```env
PORT=48271
BEARER_TOKEN=XlqiHLTqUKjPcS9Hjg3QWQ1TxGsEwTOE3qC7Kmoe58fKsICy4TJ64wzxge48Os5V
GEMINI_CLI_PATH=gemini
FRONTEND_URL=https://your-frontend-domain.com
```

**Important:** On Linux, `GEMINI_CLI_PATH` should be just `gemini` (no `.cmd` extension).

### 3.2 Set Permissions
```bash
chmod 600 .env  # Protect your secrets
chmod +x scripts/*.sh  # Make scripts executable (if any)
```

---

## 📚 Step 4: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip3 install youtube-transcript-api
```

---

## 🧪 Step 5: Test the Application

```bash
# Start the server in development mode
npm run dev

# In another terminal, test the API
curl -X POST http://localhost:48271/api/process-video \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

If successful, you should see the pipeline processing the video!

---

## 🔄 Step 6: Set Up Process Manager (PM2)

PM2 keeps your application running 24/7 and restarts it if it crashes.

### 6.1 Install PM2
```bash
sudo npm install -g pm2
```

### 6.2 Start Your Application
```bash
cd /var/www/GeminiCLI-Pipe

# Start with PM2
pm2 start server.js --name "gemini-pipeline"

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
# Follow the command it outputs (usually starts with 'sudo env PATH=...')
```

### 6.3 Useful PM2 Commands
```bash
pm2 status              # Check status
pm2 logs gemini-pipeline  # View logs
pm2 restart gemini-pipeline  # Restart app
pm2 stop gemini-pipeline     # Stop app
pm2 delete gemini-pipeline   # Remove from PM2
```

---

## 🌐 Step 7: Configure Reverse Proxy (Nginx)

### 7.1 Install Nginx
```bash
sudo apt install -y nginx
```

### 7.2 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/gemini-pipeline
```

Add the following:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/m;

    location / {
        limit_req zone=api_limit burst=5;
        
        proxy_pass http://localhost:48271;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running requests
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```

### 7.3 Enable the Site
```bash
sudo ln -s /etc/nginx/sites-available/gemini-pipeline /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## 🔒 Step 8: Set Up HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal with:
sudo certbot renew --dry-run
```

---

## 🔥 Step 9: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📊 Step 10: Monitoring & Logs

### View Application Logs
```bash
# PM2 logs
pm2 logs gemini-pipeline

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Monitor Resources
```bash
# Install htop
sudo apt install -y htop
htop

# Check disk usage
df -h

# Check memory
free -h
```

---

## 🔄 Step 11: Updating Your Application

```bash
# Pull latest changes (if using Git)
cd /var/www/GeminiCLI-Pipe
git pull origin main

# Install any new dependencies
npm install

# Restart the application
pm2 restart gemini-pipeline
```

---

## 🧹 Step 12: Maintenance Tasks

### Clean Up Old Content
```bash
# Create a cleanup script
nano /var/www/GeminiCLI-Pipe/scripts/cleanup.sh
```

Add:
```bash
#!/bin/bash
# Delete content older than 30 days
find /var/www/GeminiCLI-Pipe/content -type f -mtime +30 -delete
find /var/www/GeminiCLI-Pipe/content -type d -empty -delete
echo "Cleanup completed: $(date)"
```

Make it executable and add to cron:
```bash
chmod +x /var/www/GeminiCLI-Pipe/scripts/cleanup.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /var/www/GeminiCLI-Pipe/scripts/cleanup.sh >> /var/log/gemini-cleanup.log 2>&1
```

---

## 🐛 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs gemini-pipeline --lines 100

# Check if port is in use
sudo lsof -i :48271

# Check Node.js version
node --version  # Must be v22+
```

### Gemini CLI Issues
```bash
# Verify Gemini CLI installation
which gemini
gemini --version

# Test Gemini CLI directly
gemini -m gemini-3-flash-preview "Hello, world"

# Check API key
gemini config get apiKey
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/GeminiCLI-Pipe

# Fix permissions
chmod 755 /var/www/GeminiCLI-Pipe
chmod 600 /var/www/GeminiCLI-Pipe/.env
```

### Out of Memory
```bash
# Add swap space (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 🎯 Final Checklist

- [ ] Node.js v22+ installed
- [ ] Python 3.8+ installed
- [ ] Gemini CLI installed and configured
- [ ] Project files transferred
- [ ] `.env` file configured
- [ ] Dependencies installed (`npm install` + `pip3 install`)
- [ ] Application tested locally
- [ ] PM2 configured and running
- [ ] Nginx reverse proxy set up
- [ ] HTTPS/SSL certificate installed
- [ ] Firewall configured
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

## 📞 Support

If you encounter issues:
1. Check the logs (`pm2 logs gemini-pipeline`)
2. Verify all environment variables in `.env`
3. Ensure Gemini CLI is properly configured
4. Check firewall and port settings

---

## 🚀 You're Live!

Your API should now be accessible at:
- **HTTP:** `http://your-vps-ip:48271`
- **HTTPS:** `https://api.yourdomain.com`

Test it from your Next.js frontend and enjoy your automated video-to-social pipeline! 🎉
