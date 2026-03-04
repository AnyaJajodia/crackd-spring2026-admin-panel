import { NextResponse, type NextRequest } from "next/server";

import {
  PRESIGN_URL,
  getAdminImageRequestContext,
  isAllowedImageType,
  readErrorMessage,
  timeoutSignal,
} from "@/lib/admin/image-upload";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
    const body = (await request.json()) as { contentType?: string };
    const contentType = body.contentType?.trim() ?? "";

    if (!contentType || !isAllowedImageType(contentType)) {
      return NextResponse.json({ message: "Unsupported image type." }, { status: 400 });
    }

    await getAdminImageRequestContext(accessToken);

    const presignTimeout = timeoutSignal(10_000);
    let response: Response;

    try {
      response = await fetch(PRESIGN_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentType }),
        signal: presignTimeout.signal,
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json({ message: "Presign request timed out." }, { status: 504 });
      }
      return NextResponse.json({ message: "Presign request failed." }, { status: 502 });
    } finally {
      presignTimeout.clear();
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: await readErrorMessage(response, "Presign request failed") },
        { status: response.status }
      );
    }

    const result = (await response.json()) as {
      presignedUrl?: string;
      cdnUrl?: string;
    };

    if (!result.presignedUrl || !result.cdnUrl) {
      return NextResponse.json({ message: "Presign response was missing upload URLs." }, { status: 502 });
    }

    return NextResponse.json({
      presignedUrl: result.presignedUrl,
      cdnUrl: result.cdnUrl,
    });
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    const message = error instanceof Error ? error.message : "Failed to generate upload URL.";
    return NextResponse.json({ message }, { status });
  }
}
