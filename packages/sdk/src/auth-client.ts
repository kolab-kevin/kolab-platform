import type { AuthResponse, LoginInput, RegisterInput, UserProfile } from '@kolab/types';

export type AuthClientOptions = {
  baseUrl: string;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export class AuthClient {
  private accessToken: string | null = null;

  constructor(private readonly options: AuthClientOptions) {}

  getBaseUrl(): string {
    return this.options.baseUrl;
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return this.accessToken ?? sessionStorage.getItem('kolab_access_token');
    }
    return this.accessToken;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem('kolab_access_token', token);
      } else {
        sessionStorage.removeItem('kolab_access_token');
      }
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };

    const token = this.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let message = 'Request failed';
      try {
        const body = (await response.json()) as { message?: string | string[] };
        message = Array.isArray(body.message) ? body.message.join('; ') : body.message ?? message;
      } catch {
        // ignore parse errors
      }
      throw new AuthApiError(message, response.status);
    }

    return response.json() as Promise<T>;
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    this.setAccessToken(data.accessToken);
    return data;
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    this.setAccessToken(data.accessToken);
    return data;
  }

  async refresh(): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
    });
    this.setAccessToken(data.accessToken);
    return data;
  }

  async logout(): Promise<void> {
    try {
      await this.request<{ message: string }>('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setAccessToken(null);
    }
  }

  async me(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/auth/me');
  }
}

export function createAuthClient(baseUrl: string): AuthClient {
  return new AuthClient({ baseUrl });
}
