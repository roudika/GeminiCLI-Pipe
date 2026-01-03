// components/HistoryList.tsx
// Component for displaying processing history

'use client';

import { useEffect } from 'react';
import { useHistory } from '@/lib/hooks/usePipeline';

export function HistoryList({ limit = 10 }: { limit?: number }) {
    const { fetchHistory, refresh, loading, error, videos, total } = useHistory(limit);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (loading && videos.length === 0) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-center gap-3 p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="text-muted-foreground">Loading history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-900 font-medium">Error loading history</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                    <button
                        onClick={() => refresh()}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Processing History</h2>
                    <p className="text-muted-foreground text-sm">
                        {total} video{total !== 1 ? 's' : ''} processed
                    </p>
                </div>
                <button
                    onClick={() => refresh()}
                    disabled={loading}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {videos.length === 0 ? (
                <div className="p-8 text-center border rounded-lg">
                    <p className="text-muted-foreground">No videos processed yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {videos.map((video) => (
                        <div
                            key={video.videoId}
                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{video.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                        <span className="font-mono text-xs">{video.videoId}</span>
                                        <span>•</span>
                                        <span>{new Date(video.processedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <a
                                    href={video.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                                >
                                    View Content
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
