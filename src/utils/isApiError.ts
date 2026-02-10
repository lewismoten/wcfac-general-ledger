export interface ApiError {
  error: string,
  details: string,
  sql?: string,
  types?: string,
  params?: any[],
  state?: string
}

export const isApiError = (x: unknown): x is ApiError =>
  typeof x === "object" && x !== null && "error" in x;