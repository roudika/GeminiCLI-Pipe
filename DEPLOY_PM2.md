# 🚀 Simple VPS Deployment (PM2 Only)

This guide will help you deploy your pipeline to a Linux VPS using PM2 only (no Nginx, no Docker).

---

## 📋 Prerequisites

- Linux VPS (Ubuntu 20.04+ or Debian 11+)
- SSH access
- At least 2GB RAM and 20GB disk space

---

## 🔧 Step 1: Prepare Your VPS

SSH into your VPS:
```bash
ssh user@your-vps-ip
```

### Install Node.js 22+
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be v22.x
npm --version
```

### Install Python 3
```bash
sudo apt install -y python3 python3-pip

# Verify
python3 --version  # Should be 3.8+
```

### Install Gemini CLI
```bash
npm install -g @google/generative-ai-cli

# Verify
gemini --version
```

### Configure Gemini API Key
```bash
gemini config set apiKey YOUR_GEMINI_API_KEY_HERE
```

---

## 📦 Step 2: Transfer Your Project

### Option A: Using SCP (From Windows)

On your **local Windows machine** (PowerShell):
```powershell
# Navigate to parent directory
cd C:\Test\Buffer

# Transfer entire project
scp -r GeminiCLI-Pipe user@your-vps-ip:/home/user/
```

### Option B: Using Git (Recommended)

On your **VPS**:
```bash
cd ~
git clone https://github.com/yourusername/GeminiCLI-Pipe.git
cd GeminiCLI-Pipe
```

### Option C: Using rsync (Best for updates)

On your **local machine** (WSL or Git Bash):
```bash
rsync -avz --exclude 'node_modules' --exclude 'content' --exclude 'temp' \
  /c/Test/Buffer/GeminiCLI-Pipe/ user@your-vps-ip:~/GeminiCLI-Pipe/
```

---

## ⚙️ Step 3: Configure Environment

```bash
cd ~/GeminiCLI-Pipe
nano .env
```

Update these values:
```env
PORT=48271
BEARER_TOKEN=XlqiHLTqUKjPcS9Hjg3QWQ1TxGsEwTOE3qC7Kmoe58fKsICy4TJ64wzxge48Os5V
GEMINI_CLI_PATH=gemini
FRONTEND_URL=https://your-frontend-domain.com
```

**Important:** On Linux, use `GEMINI_CLI_PATH=gemini` (not `gemini.cmd`)

Save and exit (`Ctrl+X`, then `Y`, then `Enter`)

---

## 📚 Step 4: Install Dependencies

```bash
npm install
```

---

## 🚀 Step 5: Set Up PM2

### Install PM2
```bash
sudo npm install -g pm2
```

### Start Your Application
```bash
cd ~/GeminiCLI-Pipe

# Start with PM2
pm2 start server.js --name "gemini-pipeline"

# Check status
pm2 status
```

You should see:
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ status  │ restart │ uptime   │
├─────┼──────────────────┼─────────┼─────────┼──────────┤
│ 0   │ gemini-pipeline  │ online  │ 0       │ 0s       │
└─────┴──────────────────┴─────────┴─────────┴──────────┘
```

### Save PM2 Configuration
```bash
pm2 save
```

### Set PM2 to Start on System Boot
```bash
pm2 startup

# It will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u user --hp /home/user

# Copy and run that command
```

---

## 🔥 Step 6: Configure Firewall

```bash
# Allow SSH (important!)
sudo ufw allow OpenSSH

# Allow your app port
sudo ufw allow 48271/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## ✅ Step 7: Test Your API

### Test from VPS (localhost)
```bash
curl -X POST http://localhost:48271/api/process-video \
  -H "Authorization: Bearer XlqiHLTqUKjPcS9Hjg3QWQ1TxGsEwTOE3qC7Kmoe58fKsICy4TJ64wzxge48Os5V" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Test from Your Computer
```powershell
# Replace YOUR_VPS_IP with your actual IP
Invoke-RestMethod -Uri "http://YOUR_VPS_IP:48271/api/process-video" `
  -Method Post `
  -Headers @{Authorization="Bearer XlqiHLTqUKjPcS9Hjg3QWQ1TxGsEwTOE3qC7Kmoe58fKsICy4TJ64wzxge48Os5V"} `
  -ContentType "application/json" `
  -Body '{"videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

---

## 📊 Useful PM2 Commands

```bash
# View logs
pm2 logs gemini-pipeline

# View real-time logs
pm2 logs gemini-pipeline --lines 100

# Restart app
pm2 restart gemini-pipeline

# Stop app
pm2 stop gemini-pipeline

# Delete app from PM2
pm2 delete gemini-pipeline

# Monitor resources
pm2 monit

# Show detailed info
pm2 show gemini-pipeline
```

---

## 🔄 Updating Your Application

When you make changes locally:

### Option 1: Using Git
```bash
# On VPS
cd ~/GeminiCLI-Pipe
git pull origin main
npm install
pm2 restart gemini-pipeline
```

### Option 2: Using SCP
```powershell
# On local Windows machine
scp -r C:\Test\Buffer\GeminiCLI-Pipe\services user@your-vps-ip:~/GeminiCLI-Pipe/
scp C:\Test\Buffer\GeminiCLI-Pipe\server.js user@your-vps-ip:~/GeminiCLI-Pipe/

# Then SSH and restart
ssh user@your-vps-ip
cd ~/GeminiCLI-Pipe
pm2 restart gemini-pipeline
```

---

## 🐛 Troubleshooting

### App Won't Start
```bash
# Check PM2 logs
pm2 logs gemini-pipeline --lines 50

# Check if port is in use
sudo lsof -i :48271

# Check Node.js version
node --version  # Must be v22+
```

### Gemini CLI Issues
```bash
# Verify Gemini CLI
which gemini
gemini --version

# Test Gemini CLI
gemini -m gemini-3-flash-preview "Hello"

# Check API key
gemini config get apiKey
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER ~/GeminiCLI-Pipe

# Fix permissions
chmod 755 ~/GeminiCLI-Pipe
chmod 600 ~/GeminiCLI-Pipe/.env
```

### Can't Connect from Outside
```bash
# Check if app is listening
sudo netstat -tlnp | grep 48271

# Check firewall
sudo ufw status

# Make sure you're using the correct IP
curl ifconfig.me  # Shows your public IP
```

---

## 📁 File Locations

- **Project:** `~/GeminiCLI-Pipe/`
- **Content:** `~/GeminiCLI-Pipe/content/`
- **Temp files:** `~/GeminiCLI-Pipe/temp/`
- **Logs:** `~/.pm2/logs/`
- **PM2 config:** `~/.pm2/`

---

## 🎯 Your API Endpoint

Once deployed, your API will be accessible at:
```
http://YOUR_VPS_IP:48271/api/process-video
```

**Example:**
```
http://123.45.67.89:48271/api/process-video
```

---

## 🔒 Security Notes

1. **Change the bearer token** in production
2. **Use HTTPS** (add Nginx later if needed)
3. **Keep firewall enabled**
4. **Regular updates:** `sudo apt update && sudo apt upgrade`
5. **Monitor logs** for suspicious activity

---

## ✅ Deployment Checklist

- [ ] Node.js v22+ installed
- [ ] Python 3.8+ installed
- [ ] Gemini CLI installed and configured
- [ ] Project files transferred
- [ ] `.env` file configured (use `gemini` not `gemini.cmd`)
- [ ] Dependencies installed (`npm install`)
- [ ] PM2 installed
- [ ] App started with PM2
- [ ] PM2 saved and set to auto-start
- [ ] Firewall configured (port 48271 open)
- [ ] API tested from VPS
- [ ] API tested from your computer

---

## 🎉 You're Live!

Your API is now running at: `http://YOUR_VPS_IP:48271`

Connect it to your Next.js frontend and enjoy your automated video-to-social pipeline! 🚀

---

## 💡 Next Steps (Optional)

Later, you can add:
- **Nginx** - For HTTPS and better performance
- **Domain name** - Instead of using IP address
- **SSL certificate** - Using Let's Encrypt
- **Rate limiting** - Protect against abuse
- **Monitoring** - Set up alerts for downtime
