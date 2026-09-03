import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    filename: string[];
  }>;
};

function getContentType(filename: string): string {
  switch (path.extname(filename).toLowerCase()) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

async function getFilePath(context: RouteContext): Promise<string | null> {
  const { filename } = await context.params;

  if (!filename?.length) {
    return null;
  }

  const uploadsDirectory = path.resolve(process.cwd(), "public", "uploads");

  const filePath = path.resolve(uploadsDirectory, ...filename);

  // Prevent access to files outside public/uploads.
  if (!filePath.startsWith(`${uploadsDirectory}${path.sep}`)) {
    return null;
  }

  return filePath;
}

export async function GET(_request: Request, context: RouteContext) {
  const filePath = await getFilePath(context);

  if (!filePath) {
    return NextResponse.json({ error: "invalid file path" }, { status: 400 });
  }

  try {
    const file = await readFile(filePath);
    const filename = path.basename(filePath);

    return new Response(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": getContentType(filename),
        "Content-Length": String(file.byteLength),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "file not found" }, { status: 404 });
  }
}

export async function HEAD(_request: Request, context: RouteContext) {
  const filePath = await getFilePath(context);

  if (!filePath) {
    return new Response(null, { status: 400 });
  }

  try {
    const fileInfo = await stat(filePath);
    const filename = path.basename(filePath);

    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": getContentType(filename),
        "Content-Length": String(fileInfo.size),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
