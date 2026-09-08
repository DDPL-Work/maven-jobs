export function isRateLimitError(error) {
  if (!error) return false;
  const msg = (error.message || error.toString() || '').toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('exceeded your current quota')
  );
}