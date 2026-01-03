// lib/api/gemini-pipeline.ts
// API client for Gemini Pipeline backend

const API_BASE_URL = process.env.NEXT_PUBLIC_PIPELINE_API_URL || 'http://localhost:48271';
const BEARER_TOKEN = process.env.NEXT_PUBLIC_PIPELINE_BEARER_TOKEN || '';

export interface ProcessVideoRequest {
    videoUrl: string;
}

export interface ProcessVideoResponse {
    success: boolean;
    alreadyProcessed?: boolean;
    message?: string;
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
    phase?: string;
    error?: string;
    details?: string;
    timings?: {
        phase1: string;
        phase2: string;
        phase3: string;
        total: string;
    };
}

export interface HistoryItem {
    videoId: string;
    title: string;
    processedAt: string;
    path: string;
}

export interface HistoryResponse {
    success: boolean;
    videos: HistoryItem[];
    total: number;
}

class GeminiPipelineAPI {
    private baseUrl: string;
    private bearerToken: string;

    constructor(baseUrl: string = API_BASE_URL, bearerToken: string = BEARER_TOKEN) {
        this.baseUrl = baseUrl;
        this.bearerToken = bearerToken;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.bearerToken}`,
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Process a YouTube video through the pipeline
     */
    async processVideo(videoUrl: string): Promise<ProcessVideoResponse> {
        return this.request<ProcessVideoResponse>('/api/process-video', {
            method: 'POST',
            body: JSON.stringify({ videoUrl }),
        });
    }

    /**
     * Get processing history
     */
    async getHistory(limit: number = 10): Promise<HistoryResponse> {
        return this.request<HistoryResponse>(`/api/history?limit=${limit}`);
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return this.request('/api/health');
    }
}

// Export singleton instance
export const pipelineAPI = new GeminiPipelineAPI();

// Export class for custom instances
export default GeminiPipelineAPI;
