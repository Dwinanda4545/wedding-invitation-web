export function invitationApiBase(isUniversal: boolean, token: string): string {
  return isUniversal
    ? `/api/invitation/open/${token}`
    : `/api/invitation/${token}`
}
