/** Public build-time configuration. Never put secrets in VITE_ variables. */
function optionalHttpsUrl(value: string | undefined): string {
  if (!value?.trim()) return '';
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return '';
    return url.toString().replace(/\/+$/, '').replace(/\/api$/, '');
  } catch { return ''; }
}

/** A university-managed API can be configured once at deploy time. */
export const defaultCommunityApi = optionalHttpsUrl(import.meta.env.VITE_COMMUNITY_API_URL);
