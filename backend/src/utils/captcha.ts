const verifyTurnstile = async (token: string, secret: string) => {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });

  const body = (await res.json()) as { success: boolean };
  return Boolean(body.success);
};

const verifyRecaptcha = async (token: string, secret: string) => {
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });

  const body = (await res.json()) as { success: boolean };
  return Boolean(body.success);
};

export const verifyCaptchaIfEnabled = async (
  siteSettings: any,
  token?: string,
): Promise<boolean> => {
  const enabled = Boolean(siteSettings?.spamProtectionEnabled);
  const provider = siteSettings?.captchaProvider || 'none';
  const secret = siteSettings?.captchaSecretKey;

  if (!enabled || provider === 'none') {
    return true;
  }

  if (!token || !secret) {
    return false;
  }

  if (provider === 'turnstile') {
    return verifyTurnstile(token, secret);
  }

  if (provider === 'recaptcha') {
    return verifyRecaptcha(token, secret);
  }

  return false;
};

