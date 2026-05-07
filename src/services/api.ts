import type { AnalysisResult, AnalyzeRequest, SampleContentResponse, ShaderSample, SamplesResponse } from '../types';

const BASE = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const body = await res.json();

    if (!res.ok) {
      throw new ApiError(
        body?.error ?? `请求失败，状态码 ${res.status}`,
        res.status,
        body?.detail,
      );
    }

    return body as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw new Error(err instanceof Error ? err.message : '网络错误');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchSamples(): Promise<ShaderSample[]> {
  const data = await request<SamplesResponse>(`${BASE}/samples`);
  return data.samples;
}

export async function fetchSampleSource(name: string): Promise<string> {
  const data = await request<SampleContentResponse>(`${BASE}/samples/${encodeURIComponent(name)}`);
  return data.source;
}

export async function analyzeShader(source: string, name?: string): Promise<AnalysisResult> {
  const body: AnalyzeRequest = { shader_source: source };
  if (name) body.shader_name = name;
  return request<AnalysisResult>(`${BASE}/analyze`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
