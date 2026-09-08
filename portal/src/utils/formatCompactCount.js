export default function formatCompactCount(value = 0) {
  const count = Number(value || 0);
  if (count >= 10000000) return `${Math.round(count / 10000000)}Cr+`;
  if (count >= 100000) return `${Math.round(count / 100000)}L+`;
  if (count >= 1000) return `${Math.round(count / 1000)}K+`;
  return String(count);
}
