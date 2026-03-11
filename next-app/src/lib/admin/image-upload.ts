import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canAccessViaBootstrap } from "@/lib/auth/bootstrap-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

export const CDN_HOSTNAME = "presigned-url-uploads.almostcrackd.ai";
export const PRESIGN_URL = "https://api.almostcrackd.ai/pipeline/generate-presigned-url";
export const REGISTER_URL = "https://api.almostcrackd.ai/pipeline/upload-image-from-url";

export function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

export async function readErrorMessage(response: Response, fallback: string) {
  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await response.json()) as Record<string, unknown>;
      const message = body.error ?? body.message ?? body.details;
      if (typeof message === "string" && message.trim()) {
        return `${fallback} (${response.status}): ${message}`;
      }
    } else {
      const text = await response.text();
      if (text.trim()) {
        return `${fallback} (${response.status}): ${text}`;
      }
    }
  } catch {}

  return `${fallback} (${response.status})`;
}

export function isAllowedImageType(contentType: string) {
  return ALLOWED_IMAGE_TYPES.has(contentType);
}

export function isAllowedCdnUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === CDN_HOSTNAME;
  } catch {
    return false;
  }
}

export async function getAdminImageRequestContext(accessToken: string | null) {
  if (!accessToken) {
    throw Object.assign(new Error("Missing session access token."), { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw Object.assign(new Error("Authentication required."), { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,is_superadmin")
    .eq("id", user.id)
    .maybeSingle<{ id: string; is_superadmin: boolean | null }>();
  const isBootstrapAllowed = canAccessViaBootstrap(user.email);

  if (error && !isBootstrapAllowed) {
    throw Object.assign(new Error(error.message), { status: 500 });
  }

  if (!isBootstrapAllowed && !profile?.is_superadmin) {
    throw Object.assign(new Error("Not authorized."), { status: 403 });
  }

  return {
    user,
    profileId: profile?.id ?? user.id,
    admin: createSupabaseAdminClient(),
  };
}
