export class DashboardApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'DashboardApiError';
  }
}

export function isDashboardUnauthorizedError(error: unknown): error is DashboardApiError {
  return error instanceof DashboardApiError && (error.status === 401 || error.status === 403);
}
