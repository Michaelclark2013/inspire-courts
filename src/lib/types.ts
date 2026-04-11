/** Standard shape for all API route responses. */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};
