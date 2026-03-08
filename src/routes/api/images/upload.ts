import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface R2Bucket {
  put: (
    key: string,
    value: ReadableStream | ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string } },
  ) => Promise<unknown>;
}

async function handleUpload(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: "Invalid file type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json(
      { error: "File too large (max 10MB)" },
      { status: 400 },
    );
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `${session.user.id}/${crypto.randomUUID()}.${ext}`;

  // @ts-expect-error — cloudflare:workers module available at runtime on CF Workers
  const { env } = await import("cloudflare:workers");
  const bucket = (env as Record<string, unknown>).RECIPE_IMAGES as R2Bucket;
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const publicUrl = `${(env as Record<string, unknown>).R2_PUBLIC_URL as string}/${key}`;
  return Response.json({ url: publicUrl });
}

export const Route = createFileRoute("/api/images/upload")({
  server: {
    handlers: {
      POST: ({ request }) => handleUpload(request),
    },
  },
});
