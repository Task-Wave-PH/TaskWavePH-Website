export const COOKIE_NOTICE_NAME = "tw-cookie-notice";
export const COOKIE_NOTICE_VERSION = "2";
export const COOKIE_NOTICE_MAX_AGE = 180 * 24 * 60 * 60;

export function hasCookieAcknowledgment(cookieHeader: string) {
  return cookieHeader
    .split(";")
    .some(
      (cookie) =>
        cookie.trim() === `${COOKIE_NOTICE_NAME}=${COOKIE_NOTICE_VERSION}`,
    );
}

export function acknowledgmentCookie(secure: boolean) {
  return `${COOKIE_NOTICE_NAME}=${COOKIE_NOTICE_VERSION}; Path=/; Max-Age=${COOKIE_NOTICE_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
