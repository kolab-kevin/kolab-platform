export class OperationsCenterApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'OperationsCenterApiError';
  }
}
