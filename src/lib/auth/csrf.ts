export const AUTH_FETCH_HEADER = "X-Requested-With";
export const AUTH_FETCH_VALUE = "XMLHttpRequest";

export const authFetchHeaders = {
  [AUTH_FETCH_HEADER]: AUTH_FETCH_VALUE,
} as const;

/** Reject cross-site form posts to auth route handlers. */
export function isSameOriginAuthFetch(request: Request): boolean {
  return request.headers.get(AUTH_FETCH_HEADER) === AUTH_FETCH_VALUE;
}
