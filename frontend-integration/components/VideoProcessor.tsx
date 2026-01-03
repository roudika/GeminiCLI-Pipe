// components/VideoProcessor.tsx
// Example component for processing videos

'use client';

import { useState } from 'react';
import { useProcessVideo } from '@/lib/hooks/usePipeline';

export function VideoProcessor() {
    const [videoUrl, setVideoUrl] = useState('');
    const { processVideo, loading, error, data, reset } = useProcessVideo();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!videoUrl.trim()) {
            return;
        }

        try {
            await processVideo(videoUrl);
        } catch (err) {
            // Error is already handled by the hook
            console.error('Processing failed:', err);
        }
    };

    const handleReset = () => {
        setVideoUrl('');
        reset();
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Process YouTube Video</h2>
                <p className="text-muted-foreground">
                    Enter a YouTube URL to generate social media content
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="videoUrl" className="text-sm font-medium">
                        YouTube URL
                    </label>
                    <input
                        id="videoUrl"
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                        required
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading || !videoUrl.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Processing...' : 'Process Video'}
                    </button>

                    {data && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </form>

            {loading && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <p className="text-blue-900">Processing video... This may take 1-2 minutes.</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-900 font-medium">Error</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
            )}

            {data?.success && (
                <div className="space-y-4">
                    {data.alreadyProcessed && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-900 font-medium">Already Processed</p>
                            <p className="text-yellow-700 text-sm mt-1">
                                This video was already processed. Showing existing content.
                            </p>
                        </div>
                    )}

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-900 font-medium">✓ Success!</p>
                        <p className="text-green-700 text-sm mt-1">
                            Video processed successfully
                        </p>
                        {data.timings && (
                            <p className="text-green-600 text-xs mt-2">
                                Total time: {data.timings.total}s
                            </p>
                        )}
                    </div>

                    {data.data && (
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold mb-2">Video Information</h3>
                                <dl className="space-y-1 text-sm">
                                    <div className="flex gap-2">
                                        <dt className="font-medium text-muted-foreground">Title:</dt>
                                        <dd>{data.data.metadata.title}</dd>
                                    </div>
                                    <div className="flex gap-2">
                                        <dt className="font-medium text-muted-foreground">Video ID:</dt>
                                        <dd className="font-mono text-xs">{data.data.metadata.videoId}</dd>
                                    </div>
                                    <div className="flex gap-2">
                                        <dt className="font-medium text-muted-foreground">Processed:</dt>
                                        <dd>{new Date(data.data.metadata.processedAt).toLocaleString()}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold mb-3">Generated Content</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(data.data.platforms).map(([platform, path]) => (
                                        <a
                                            key={platform}
                                            href={path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-center capitalize"
                                        >
                                            {platform}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <details className="p-4 border rounded-lg">
                                <summary className="font-semibold cursor-pointer">
                                    View Transcript
                                </summary>
                                <div className="mt-3 p-3 bg-gray-50 rounded text-sm max-h-64 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap">{data.data.transcript}</pre>
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
