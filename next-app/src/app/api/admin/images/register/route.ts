import { NextResponse, type NextRequest } from "next/server";

import {
  REGISTER_URL,
  getAdminImageRequestContext,
  isAllowedCdnUrl,
  readErrorMessage,
  timeoutSignal,
} from "@/lib/admin/image-upload";

type RegisterRequestBody = {
  cdnUrl?: string;
  isCommonUse?: boolean;
  isPublic?: boolean;
  imageDescription?: string | null;
  additionalContext?: string | null;
};

const IMAGE_ROW_SELECT =
  "id,url,is_common_use,is_public,image_description,additional_context,profile_id,modified_datetime_utc";

export async function POST(request: NextRequest) {
  try {
    const requestId = crypto.randomUUID();
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
    const body = (await request.json()) as RegisterRequestBody;
    const cdnUrl = body.cdnUrl?.trim() ?? "";

    if (!cdnUrl || !isAllowedCdnUrl(cdnUrl)) {
      return NextResponse.json({ message: "Invalid image CDN URL." }, { status: 400 });
    }

    if (typeof body.isCommonUse !== "boolean" || typeof body.isPublic !== "boolean") {
      return NextResponse.json({ message: "Missing required image flags." }, { status: 400 });
    }

    const { admin, profileId } = await getAdminImageRequestContext(accessToken);
    console.info("[admin/images/register] request:start", { requestId, cdnUrl, profileId });

    const existing = await admin
      .from("images")
      .select(IMAGE_ROW_SELECT)
      .eq("url", cdnUrl)
      .order("created_datetime_utc", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle<{
        id: string;
        url: string | null;
        is_common_use: boolean | null;
        is_public: boolean | null;
        image_description: string | null;
        additional_context: string | null;
        profile_id: string | null;
        modified_datetime_utc: string | null;
      }>();

    if (existing.error) {
      return NextResponse.json({ message: existing.error.message }, { status: 500 });
    }

    if (existing.data) {
      console.info("[admin/images/register] request:existing", { requestId, cdnUrl, profileId, imageId: existing.data.id });
      return NextResponse.json({
        ok: true,
        row: existing.data,
      });
    }

    const registerTimeout = timeoutSignal(10_000);
    let response: Response;

    try {
      response = await fetch(REGISTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: cdnUrl,
          isCommonUse: body.isCommonUse,
        }),
        signal: registerTimeout.signal,
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json({ message: "Image registration timed out." }, { status: 504 });
      }
      return NextResponse.json({ message: "Image registration failed." }, { status: 502 });
    } finally {
      registerTimeout.clear();
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: await readErrorMessage(response, "Image registration failed") },
        { status: response.status }
      );
    }

    const registerBody = (await response.json()) as { imageId?: string; now?: number };
    if (!registerBody.imageId) {
      return NextResponse.json({ message: "Image registration response was missing imageId." }, { status: 502 });
    }
    console.info("[admin/images/register] request:pipeline-response", {
      requestId,
      cdnUrl,
      profileId,
      imageId: registerBody.imageId,
    });

    const modifiedAt =
      typeof registerBody.now === "number" && Number.isFinite(registerBody.now)
        ? new Date(registerBody.now).toISOString()
        : new Date().toISOString();
    const updateResult = await admin
      .from("images")
      .update({
        is_common_use: body.isCommonUse,
        is_public: body.isPublic,
        image_description: body.imageDescription?.trim() ? body.imageDescription.trim() : null,
        additional_context: body.additionalContext?.trim() ? body.additionalContext.trim() : null,
        modified_datetime_utc: modifiedAt,
        modified_by_user_id: profileId,
      })
      .eq("id", registerBody.imageId)
      .select(IMAGE_ROW_SELECT)
      .maybeSingle<{
        id: string;
        url: string | null;
        is_common_use: boolean | null;
        is_public: boolean | null;
        image_description: string | null;
        additional_context: string | null;
        profile_id: string | null;
        modified_datetime_utc: string | null;
      }>();

    if (updateResult.error) {
      return NextResponse.json({ message: updateResult.error.message }, { status: 500 });
    }
    console.info("[admin/images/register] request:update", {
      requestId,
      cdnUrl,
      profileId,
      imageId: registerBody.imageId,
      affectedRows: updateResult.data ? 1 : 0,
    });

    if (updateResult.data) {
      return NextResponse.json({
        ok: true,
        row: updateResult.data,
      });
    }

    const existingById = await admin
      .from("images")
      .select(IMAGE_ROW_SELECT)
      .eq("id", registerBody.imageId)
      .maybeSingle<{
        id: string;
        url: string | null;
        is_common_use: boolean | null;
        is_public: boolean | null;
        image_description: string | null;
        additional_context: string | null;
        profile_id: string | null;
        modified_datetime_utc: string | null;
      }>();

    if (existingById.error) {
      return NextResponse.json({ message: existingById.error.message }, { status: 500 });
    }

    if (existingById.data) {
      console.info("[admin/images/register] request:existing-by-id-after-update-miss", {
        requestId,
        cdnUrl,
        profileId,
        imageId: existingById.data.id,
      });
      return NextResponse.json({
        ok: true,
        row: existingById.data,
      });
    }

    const existingByUrl = await admin
      .from("images")
      .select(IMAGE_ROW_SELECT)
      .eq("url", cdnUrl)
      .order("created_datetime_utc", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle<{
        id: string;
        url: string | null;
        is_common_use: boolean | null;
        is_public: boolean | null;
        image_description: string | null;
        additional_context: string | null;
        profile_id: string | null;
        modified_datetime_utc: string | null;
      }>();

    if (existingByUrl.error) {
      return NextResponse.json({ message: existingByUrl.error.message }, { status: 500 });
    }

    if (existingByUrl.data) {
      console.info("[admin/images/register] request:existing-by-url-after-update-miss", {
        requestId,
        cdnUrl,
        profileId,
        imageId: existingByUrl.data.id,
      });
      return NextResponse.json({
        ok: true,
        row: existingByUrl.data,
      });
    }

    const insert = await admin
      .from("images")
      .insert({
        id: registerBody.imageId,
        url: cdnUrl,
        is_common_use: body.isCommonUse,
        is_public: body.isPublic,
        image_description: body.imageDescription?.trim() ? body.imageDescription.trim() : null,
        additional_context: body.additionalContext?.trim() ? body.additionalContext.trim() : null,
        profile_id: profileId,
        modified_datetime_utc: modifiedAt,
        created_by_user_id: profileId,
        modified_by_user_id: profileId,
      })
      .select(IMAGE_ROW_SELECT)
      .single<{
        id: string;
        url: string | null;
        is_common_use: boolean | null;
        is_public: boolean | null;
        image_description: string | null;
        additional_context: string | null;
        profile_id: string | null;
        modified_datetime_utc: string | null;
      }>();

    if (insert.error) {
      return NextResponse.json({ message: insert.error.message }, { status: 500 });
    }

    console.warn("[admin/images/register] request:fallback-insert", {
      requestId,
      cdnUrl,
      profileId,
      imageId: insert.data.id,
    });
    return NextResponse.json({
      ok: true,
      row: insert.data,
    });
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    const message = error instanceof Error ? error.message : "Failed to register image.";
    return NextResponse.json({ message }, { status });
  }
}
