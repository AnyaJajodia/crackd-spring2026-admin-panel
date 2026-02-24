const BASE_URL = "https://api.almostcrackd.ai";

async function handleResponse(response, context) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${context} failed: ${text || response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function generatePresignedUrl(token, contentType) {
  const response = await fetch(`${BASE_URL}/pipeline/generate-presigned-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType }),
  });

  return handleResponse(response, "Generate presigned URL");
}

export async function uploadToPresignedUrl(presignedUrl, file) {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload image failed: ${text || response.status}`);
  }

  return true;
}

export async function registerImageUrl(token, imageUrl, isCommonUse = false) {
  const response = await fetch(`${BASE_URL}/pipeline/upload-image-from-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl, isCommonUse }),
  });

  return handleResponse(response, "Register image URL");
}

export async function generateCaptions(token, imageId) {
  const response = await fetch(`${BASE_URL}/pipeline/generate-captions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageId }),
  });

  return handleResponse(response, "Generate captions");
}
