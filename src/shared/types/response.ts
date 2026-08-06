export interface ErrorDetail {
  path?: string;
  message: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
}

export interface SuccessResponse<T> {
  data: T;
}

export interface ManyResponse<T> {
  items: T[];
  meta: Meta;
}

export interface Meta {
  [key: string]: unknown;
}
