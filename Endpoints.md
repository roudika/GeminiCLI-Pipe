# Gemini CLI Pipe - API Endpoints

This document lists all available API endpoints for the Video-to-Social Automation Pipeline.

## 📡 Base URL
The API server runs locally on `http://localhost:48271`.

## 🔓 Authentication
Most endpoints require a Bearer token in the `Authorization` header.
```http
Authorization: Bearer XlqiHLTqUKjPcS9Hjg3QWQ1TxGsEwTOE3qC7Kmoe58fKsICy4TJ64wzxge48Os5V
```

---

## 🚀 Endpoints

### 1. Health Check
Checks if the server is running and healthy.

- **Method:** `GET`
- **URL:** `/health`
- **Auth:** None
- **Response:**
```json
{
  "status": "healthy",
  "service": "Video-to-Social Automation Pipeline",
  "version": "1.0.0",
  "timestamp": "2026-01-03T13:55:00.000Z"
}
```

### 2. Process Video (Main Pipeline)
Coordinates Phase 1 (Transcript), Phase 2 (Content Gen), and Phase 3 (Storage).

- **Method:** `POST`
- **URL:** `/api/process-video`
- **Auth:** Bearer Token
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "transcriptSource": "gemini" | "transcriptapi"
}
```
- **Parameters:**
  - `videoUrl` (Required): Valid YouTube URL.
  - `transcriptSource` (Optional): 
    - `"gemini"` (Default): AI-analyzed structured notes (~79s).
    - `"transcriptapi"`: Fast raw transcript extraction (~2-5s).

### 3. Get Processing History
Retrieves a list of all successfully processed videos.

- **Method:** `GET`
- **URL:** `/api/history`
- **Auth:** Bearer Token
- **Response:**
```json
{
  "success": true,
  "history": [
    {
      "videoId": "dqBpHTGZU1Q",
      "title": "Top Web Development Tools of 2024",
      "processedAt": "2026-01-03T12:34:24.318Z",
      "path": "/content/2026-01-03/dqBpHTGZU1Q-top-web-development-tools-of"
    }
  ]
}
```

### 4. Serve Content Files
Accesses the generated files directly.

- **Method:** `GET`
- **URL:** `/content/{date}/{folder_name}/{file_name}`
- **Auth:** Bearer Token
- **Example:** `http://localhost:48271/content/2026-01-03/dqBpHTGZU1Q-top-web-development-tools-of/ghost/post.md`

---

## 🛠️ Error Responses

Standard error format for failed requests:
```json
{
  "success": false,
  "error": "Error message description",
  "details": "Additional techincal details (optional)"
}
```
