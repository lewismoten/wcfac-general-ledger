export interface ApiError {
  error: string,
  details: string,
  sql?: string,
  types?: string,
  params?: any[],
  state?: string
}