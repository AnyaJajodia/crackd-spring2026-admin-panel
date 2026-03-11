export function isBootstrapAccessEnabled() {
  return process.env.ENABLE_BOOTSTRAP === "true";
}

export function getBootstrapAllowedEmails() {
  return (process.env.BOOTSTRAP_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function canAccessViaBootstrap(email: string | null | undefined) {
  if (!isBootstrapAccessEnabled() || !email) {
    return false;
  }

  return getBootstrapAllowedEmails().includes(email.toLowerCase());
}
