export class CreatorManagementApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'CreatorManagementApiError';
  }
}

export function isCreatorManagementUnauthorizedError(
  error: unknown,
): error is CreatorManagementApiError {
  return (
    error instanceof CreatorManagementApiError && (error.status === 401 || error.status === 403)
  );
}
