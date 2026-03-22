const buckets = new Map<string, number[]>();

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export const checkRateLimit = ({ key, limit, windowMs }: RateLimitOptions) => {
  const now = Date.now();
  const windowStart = now - windowMs;

  const current = buckets.get(key) || [];
  const inWindow = current.filter((ts) => ts > windowStart);

  if (inWindow.length >= limit) {
    buckets.set(key, inWindow);
    return false;
  }

  inWindow.push(now);
  buckets.set(key, inWindow);
  return true;
};

