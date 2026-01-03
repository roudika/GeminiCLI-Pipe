# Video-to-Social Automation Pipeline - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
BEARER_TOKEN=your-secure-token-here
GEMINI_CLI_PATH=gemini
```

**Important:** Replace `your-secure-token-here` with a strong, random token.

### 3. Verify Gemini CLI

Ensure the Gemini CLI is installed and accessible:

```bash
gemini --version
```

If the CLI is in a custom location, update `GEMINI_CLI_PATH` in `.env`.

### 4. Test TOML Configurations

Test Phase 1 (Transcript Extraction):

```bash
gemini --config phase1-transcript-extraction.toml --video-url "https://youtube.com/watch?v=dQw4w9WgXcQ" --output test-transcript.txt
```

Test Phase 2 (Content Generation):

```bash
gemini --config phase2-content-generation.toml --input test-transcript.txt --output test-output.md
```

> **Note:** If the command syntax differs for your Gemini CLI, update the commands in `services/geminiService.js`.

### 5. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

You should see:

```
🚀 Video-to-Social Automation Pipeline API Server
📡 Server running on port 48271
```

---

## 📡 API Usage

### Health Check

```bash
curl http://localhost:48271/health
```

**Response:**

```json
{
  "status": "healthy",
  "service": "Video-to-Social Automation Pipeline",
  "version": "1.0.0",
  "timestamp": "2026-01-03T05:30:00.000Z"
}
```

### Process Video

```bash
curl -X POST http://localhost:48271/api/process-video \
  -H "Authorization: Bearer your-secure-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```


**Success Response (200):**

```json
{
  "success": true,
  "message": "Content generated successfully",
  "data": {
    "videoUrl": "https://youtube.com/watch?v=...",
    "timestamp": "2026-01-03T05:30:00.000Z",
    "duration": "245.32s",
    "outputDirectory": "./content/2026-01-03",
    "files": {
      "ghost": "./content/2026-01-03/ghost/post.md",
      "linkedin": "./content/2026-01-03/linkedin/post.txt",
      "instagram": "./content/2026-01-03/instagram/post.txt",
      "twitter": "./content/2026-01-03/twitter/post.txt",
      "imagePrompt": "./content/2026-01-03/image-prompt.txt",
      "metadata": "./content/2026-01-03/metadata.json"
    },
    "preview": {
      "ghostTitle": "How to Build Amazing Apps",
      "linkedinPreview": "First 100 characters of LinkedIn post...",
      "instagramPreview": "First 100 characters of Instagram post...",
      "twitterPreview": "First 100 characters of Twitter post..."
    },
    "stats": {
      "transcriptLength": 15234,
      "platforms": {
        "linkedin": { "chars": 1847, "hashtags": 5 },
        "instagram": { "chars": 542, "hashtags": 8 },
        "twitter": { "chars": 892, "hashtags": 3 },
        "ghost": { "words": 1456 }
      }
    }
  }
}
```

**Error Response (400/500):**

```json
{
  "success": false,
  "phase": "transcript_extraction",
  "error": "ERROR: Video is not in English",
  "details": "Failed to extract transcript from video"
}
```

---

## 📁 Output Structure

Generated content is saved to date-stamped directories:

```
content/
└── 2026-01-03/
    ├── ghost/
    │   └── post.md              # Ghost blog post (frontmatter + body)
    ├── linkedin/
    │   └── post.txt             # LinkedIn post
    ├── instagram/
    │   └── post.txt             # Instagram post
    ├── twitter/
    │   └── post.txt             # Twitter post
    ├── image-prompt.txt         # AI image generation prompt
    └── metadata.json            # Video URL, stats, timestamps
```

---

## 🔧 Configuration

### 🧠 AI Models & Architecture

### Phase 1: Transcript Extraction (VTT-Based)
- **Method:** Gemini 3 Flash (minimal) + VTT parsing
- **Speed:** ~5-10 seconds (much faster than full Gemini processing)
- **Process:**
  1. Trigger Gemini 3 Flash to download VTT file
  2. Validate VTT file (size > 1KB, proper format)
  3. Kill Gemini process (don't wait for verbose output)
  4. Parse VTT with Python script → clean transcript
- **Benefits:**
  - ✅ **10x cleaner** - No AI thinking logs
  - ✅ **3-5x faster** - Don't wait for full Gemini response
  - ✅ **More reliable** - Direct YouTube captions

### Phase 2: Content Generation
- **Model:** `gemini-3-flash-preview`
- **Speed:** ~30-60 seconds
- **Quality:** High-quality social media content
- **Features:** Supports thinking tools, structured outputanscript from YouTube videos
- Modify to adjust transcript extraction behavior

**Phase 2: `phase2-content-generation.toml`**
- Model: `gemini-3-flash`
- Purpose: Generate all social media content
- Modify to adjust:
  - Character limits
  - Hashtag counts
  - Tone and style
  - KloudiHub branding
  - Output format

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `BEARER_TOKEN` | API authentication token | Required |
| `GEMINI_CLI_PATH` | Path to Gemini CLI executable | `gemini` |
| `FRONTEND_URL` | Frontend URL for CORS (optional) | `*` (all origins) |

---

## 🧪 Testing

### 1. Test Authentication

```bash
# Should return 401 Unauthorized
curl -X POST http://localhost:3001/api/process-video \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://youtube.com/watch?v=test"}'
```

### 2. Test Invalid URL

```bash
curl -X POST http://localhost:3001/api/process-video \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "not-a-youtube-url"}'
```

### 3. Test Valid Request

Use a real YouTube video URL with your bearer token.

---

## 🚨 Troubleshooting

### "Gemini CLI not found"

- Verify Gemini CLI is installed: `gemini --version`
- Update `GEMINI_CLI_PATH` in `.env` with full path

### "Invalid bearer token"

- Ensure `.env` file exists and contains `BEARER_TOKEN`
- Verify the token matches in both `.env` and API request

### "Failed to extract transcript"

- Check video is public and available
- Verify video is in English
- Check Gemini CLI has proper authentication

### "Content parsing failed"

- Check `phase2-content-generation.toml` output format
- Review raw content in error response
- Verify section headers match expected format

### Port already in use

- Change `PORT` in `.env`
- Or kill process using port 3001: `npx kill-port 3001`

---

## 🔐 Security Notes

1. **Never commit `.env` file** - It contains your bearer token
2. **Use strong bearer tokens** - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Configure CORS** - Set `FRONTEND_URL` to your Next.js domain in production
4. **Use HTTPS** - Deploy behind reverse proxy (nginx, Caddy) with SSL

---

## 🌐 Deployment

### VPS Deployment (Linux)

1. **Clone repository:**
   ```bash
   git clone <your-repo>
   cd GeminiCLI-Pipe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

4. **Install PM2 (process manager):**
   ```bash
   npm install -g pm2
   ```

5. **Start with PM2:**
   ```bash
   pm2 start server.js --name gemini-pipeline
   pm2 save
   pm2 startup  # Follow instructions
   ```

6. **Configure firewall:**
   ```bash
   sudo ufw allow 3001/tcp
   ```

7. **Set up reverse proxy (optional but recommended):**
   - Use nginx or Caddy to proxy requests to port 3001
   - Enable HTTPS with Let's Encrypt

### Environment Variables for Production

Update `.env` for production:

```env
PORT=3001
BEARER_TOKEN=<strong-random-token>
GEMINI_CLI_PATH=/usr/local/bin/gemini
FRONTEND_URL=https://your-nextjs-app.vercel.app
```

---

## 📊 Monitoring

### View Logs (PM2)

```bash
pm2 logs gemini-pipeline
```

### Check Status

```bash
pm2 status
```

### Restart Server

```bash
pm2 restart gemini-pipeline
```

---

## 🛠️ Development

### Project Structure

```
GeminiCLI-Pipe/
├── server.js                           # Main Express server
├── package.json                        # Dependencies
├── .env                                # Environment variables (git-ignored)
├── phase1-transcript-extraction.toml   # Phase 1 config
├── phase2-content-generation.toml      # Phase 2 config
├── middleware/
│   └── auth.js                         # Bearer token authentication
├── services/
│   ├── geminiService.js                # Gemini CLI integration
│   ├── contentParser.js                # Content parsing
│   ├── fileManager.js                  # File operations
│   └── pipelineOrchestrator.js         # Workflow coordination
└── utils/
    ├── logger.js                       # Logging utility
    └── validators.js                   # Input validation
```

### Adding New Platforms

1. Update `phase2-content-generation.toml` with new platform rules
2. Add parser function in `services/contentParser.js`
3. Add save function in `services/fileManager.js`
4. Update directory structure in `fileManager.js`

---

## 📝 License

MIT

---

### 3. Get Processed Video History
**URL:** `/api/history`  
**Method:** `GET`  
**Auth:** Bearer Token required  

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "date": "2026-01-03",
      "videos": [
        {
          "id": "I8hhCMQVPFc",
          "folderName": "I8hhCMQVPFc-this-new-1-click-ai",
          "path": "/content/2026-01-03/I8hhCMQVPFc-this-new-1-click-ai",
          "processedAt": "2026-01-03T05:47:13.000Z"
        }
      ]
    }
  ]
}
```

---

## 🌐 Accessing Content from Vercel (Next.js)

The API server supports secure static file serving for the `content/` folder.

### 1. The Strategy
The API response returns relative web paths:
```json
"files": {
  "transcript": "/content/2026-01-03/videoId-title/transcript.txt",
  "ghost": "/content/2026-01-03/videoId-title/ghost/post.md"
}
```

### 2. Security
The `/content` route is protected by the **same Bearer Token** as the API. Your Next.js frontend MUST include the header:

```javascript
// Fetching the transcript from Vercel
const response = await fetch('https://your-vps-ip:48271' + fileRelativePath, {
  headers: {
    'Authorization': 'Bearer YOUR_SECRET_TOKEN'
  }
});
const text = await response.text();
```

### 3. Environment Variables (Vercel)
Ensure your Vercel project has:
- `NEXT_PUBLIC_API_URL`: `https://your-vps-ip:48271`
- `BEARER_TOKEN`: The same token used on the VPS.

---

## 🆘 Support

For issues or questions, check the logs and error messages. Most errors include detailed information for debugging.
