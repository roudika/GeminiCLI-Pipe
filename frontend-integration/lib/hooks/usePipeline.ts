// lib/hooks/usePipeline.ts
// React hooks for Gemini Pipeline integration

import { useState, useCallback } from 'react';
import { pipelineAPI, ProcessVideoResponse, HistoryResponse } from '../api/gemini-pipeline';

export function useProcessVideo() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ProcessVideoResponse | null>(null);

    const processVideo = useCallback(async (videoUrl: string) => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const result = await pipelineAPI.processVideo(videoUrl);
            setData(result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process video';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setData(null);
    }, []);

    return {
        processVideo,
        loading,
        error,
        data,
        reset,
    };
}

export function useHistory(initialLimit: number = 10) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<HistoryResponse | null>(null);

    const fetchHistory = useCallback(async (limit: number = initialLimit) => {
        setLoading(true);
        setError(null);

        try {
            const result = await pipelineAPI.getHistory(limit);
            setData(result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [initialLimit]);

    const refresh = useCallback(() => {
        return fetchHistory(initialLimit);
    }, [fetchHistory, initialLimit]);

    return {
        fetchHistory,
        refresh,
        loading,
        error,
        data,
        videos: data?.videos || [],
        total: data?.total || 0,
    };
}

export function useHealthCheck() {
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(false);

    const checkHealth = useCallback(async () => {
        setChecking(true);
        try {
            await pipelineAPI.healthCheck();
            setIsHealthy(true);
            return true;
        } catch {
            setIsHealthy(false);
            return false;
        } finally {
            setChecking(false);
        }
    }, []);

    return {
        checkHealth,
        isHealthy,
        checking,
    };
}
