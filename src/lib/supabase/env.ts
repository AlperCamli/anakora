type ProcessLike = {
  env?: Record<string, string | undefined>;
};

function getProcessEnv(): Record<string, string | undefined> | undefined {
  return (globalThis as { process?: ProcessLike }).process?.env;
}

export function readServerEnv(name: string): string | undefined {
  return getProcessEnv()?.[name];
}

export function requireEnv(
  value: string | undefined,
  name: string,
): string {
  if (!value) {
    throw new Error(`[supabase] Missing required env var: ${name}`);
  }
  return value;
}

export function assertServerOnly(caller: string): void {
  if (typeof window !== "undefined") {
    throw new Error(
      `[supabase] ${caller} can only be used in a server runtime.`,
    );
  }
}
