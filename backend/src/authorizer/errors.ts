class HttpError extends Error {
  statusCode: number;

  constructor(msg: string) {
    super(msg);
  }
}

export class AuthorizationError extends HttpError {
  statusCode: number;

  constructor(msg: string) {
    super(msg);
    this.name = "AuthorizationError";
    this.statusCode = 401;
  }
}

export class EnvironmentError extends HttpError {
  statusCode: number;

  constructor(msg: string) {
    super(msg);
    this.name = "EnvironmentError";
    this.statusCode = 500;
  }
}
