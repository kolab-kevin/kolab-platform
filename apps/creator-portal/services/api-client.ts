import { AuthApiError } from '@kolab/sdk';

import { authClient } from '@/lib/auth-client';
import { getApiBaseUrl } from '@/lib/env';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

class ApiClient {
  private readonly baseUrl = getApiBaseUrl();

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };

    const token = authClient.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let message = 'Request failed';
      try {
        const body = (await response.json()) as { message?: string | string[] };
        message = Array.isArray(body.message) ? body.message.join('; ') : (body.message ?? message);
      } catch {
        // ignore parse errors
      }
      throw new ApiClientError(message, response.status);
    }

    return response.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError || error instanceof AuthApiError;
}
