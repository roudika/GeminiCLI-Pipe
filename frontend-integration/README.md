# Next.js Frontend Integration

This directory contains ready-to-use components and utilities for integrating the Gemini Pipeline backend with your Next.js frontend.

## 📁 Structure

```
frontend-integration/
├── lib/
│   ├── api/
│   │   └── gemini-pipeline.ts    # API client
│   └── hooks/
│       └── usePipeline.ts        # React hooks
├── components/
│   ├── VideoProcessor.tsx        # Video processing UI
│   └── HistoryList.tsx          # History display
└── .env.example                  # Environment variables template
```

## 🚀 Quick Start

### 1. Copy Files to Your Next.js Project

```bash
# Copy the entire frontend-integration folder to your Next.js project
cp -r frontend-integration/* your-nextjs-project/
```

### 2. Install Dependencies

No additional dependencies needed! Uses only React and Next.js built-ins.

### 3. Configure Environment Variables

Create `.env.local` in your Next.js project:

```env
NEXT_PUBLIC_PIPELINE_API_URL=http://YOUR_VPS_IP:48271
NEXT_PUBLIC_PIPELINE_BEARER_TOKEN=XlqiHLTqUKjPcS9Hjg3QWQ1TxGsEwTOE3qC7Kmoe58fKsICy4TJ64wzxge48Os5V
```

### 4. Use in Your Pages

```tsx
// app/page.tsx
import { VideoProcessor } from '@/components/VideoProcessor';
import { HistoryList } from '@/components/HistoryList';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <VideoProcessor />
      <HistoryList limit={10} />
    </main>
  );
}
```

## 📚 API Reference

### API Client

```typescript
import { pipelineAPI } from '@/lib/api/gemini-pipeline';

// Process a video
const result = await pipelineAPI.processVideo('https://www.youtube.com/watch?v=...');

// Get history
const history = await pipelineAPI.getHistory(10);

// Health check
const health = await pipelineAPI.healthCheck();
```

### React Hooks

#### `useProcessVideo()`

```typescript
import { useProcessVideo } from '@/lib/hooks/usePipeline';

function MyComponent() {
  const { processVideo, loading, error, data, reset } = useProcessVideo();

  const handleProcess = async () => {
    try {
      const result = await processVideo('https://youtube.com/...');
      console.log('Success:', result);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <button onClick={handleProcess} disabled={loading}>
        {loading ? 'Processing...' : 'Process Video'}
      </button>
      {error && <p>Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

#### `useHistory(limit?)`

```typescript
import { useHistory } from '@/lib/hooks/usePipeline';

function MyComponent() {
  const { fetchHistory, refresh, loading, error, videos, total } = useHistory(10);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      {videos.map(video => (
        <div key={video.videoId}>{video.title}</div>
      ))}
    </div>
  );
}
```

#### `useHealthCheck()`

```typescript
import { useHealthCheck } from '@/lib/hooks/usePipeline';

function MyComponent() {
  const { checkHealth, isHealthy, checking } = useHealthCheck();

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div>
      Status: {isHealthy ? '✓ Online' : '✗ Offline'}
    </div>
  );
}
```

## 🎨 Components

### `<VideoProcessor />`

Full-featured video processing component with:
- URL input validation
- Loading states
- Error handling
- Success display with generated content links
- Transcript viewer

**Props:** None

**Usage:**
```tsx
import { VideoProcessor } from '@/components/VideoProcessor';

<VideoProcessor />
```

### `<HistoryList />`

Displays processing history with:
- Automatic data fetching
- Refresh button
- Loading states
- Error handling
- Links to generated content

**Props:**
- `limit?: number` - Number of items to display (default: 10)

**Usage:**
```tsx
import { HistoryList } from '@/components/HistoryList';

<HistoryList limit={20} />
```

## 🔧 Customization

### Custom API Client

```typescript
import GeminiPipelineAPI from '@/lib/api/gemini-pipeline';

const customAPI = new GeminiPipelineAPI(
  'https://api.yourdomain.com',
  'your-custom-token'
);

const result = await customAPI.processVideo('...');
```

### Custom Styling

All components use Tailwind CSS classes. Modify the className props to match your design system.

## 🐛 Error Handling

All API calls include proper error handling:

```typescript
try {
  const result = await pipelineAPI.processVideo(url);
  // Handle success
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
  }
}
```

## 📊 TypeScript Types

All responses are fully typed:

```typescript
interface ProcessVideoResponse {
  success: boolean;
  alreadyProcessed?: boolean;
  data?: {
    path: string;
    platforms: {
      twitter: string;
      linkedin: string;
      instagram: string;
      ghost: string;
    };
    metadata: {
      videoId: string;
      title: string;
      processedAt: string;
    };
    transcript: string;
  };
  timings?: {
    phase1: string;
    phase2: string;
    phase3: string;
    total: string;
  };
}
```

## 🔒 Security

- Bearer token is stored in environment variables
- All API calls use HTTPS in production
- CORS is handled by the backend

## 🚀 Production Deployment

1. Update `NEXT_PUBLIC_PIPELINE_API_URL` to your production API URL
2. Use HTTPS: `https://api.yourdomain.com`
3. Keep `NEXT_PUBLIC_PIPELINE_BEARER_TOKEN` secret
4. Consider adding rate limiting on the frontend

## 📝 Example Page

```tsx
// app/pipeline/page.tsx
'use client';

import { VideoProcessor } from '@/components/VideoProcessor';
import { HistoryList } from '@/components/HistoryList';

export default function PipelinePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center mb-12">
          Video to Social Media Pipeline
        </h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <VideoProcessor />
          </div>
          <div>
            <HistoryList limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 🎯 Next Steps

1. Copy files to your Next.js project
2. Configure environment variables
3. Import and use components
4. Customize styling to match your design
5. Add additional features as needed

## 💡 Tips

- Use `useProcessVideo` hook for custom UIs
- Combine with React Query for caching
- Add optimistic updates for better UX
- Implement polling for long-running processes
- Add analytics tracking for video processing

## 🆘 Support

If you encounter issues:
1. Check environment variables are set correctly
2. Verify API is accessible from frontend
3. Check browser console for errors
4. Ensure CORS is configured on backend
5. Verify bearer token is correct

---

**Ready to integrate!** 🎉

Copy the files, configure your environment, and start building your video-to-social pipeline UI!
