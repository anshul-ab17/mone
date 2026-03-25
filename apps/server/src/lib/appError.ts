export class AppError extends Error {
  public status: 400 | 401 | 403 | 404 | 500;
  public code: string;

  constructor(code: string, status: 400 | 401 | 403 | 404 | 500) {
    super(code);
    this.code = code;
    this.status = status;
  }
}