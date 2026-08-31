import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { isStaffAuthed } from "../../../../../lib/requireStaff";
import { updateDoctorSignature, getDoctorById } from "../../../../../lib/db";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isStaffAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const doctorId = parseInt(id, 10);
  const doctor = await getDoctorById(doctorId);
  if (!doctor)
    return NextResponse.json({ error: "پزشک پیدا نشد" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "فایلی انتخاب نشده" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "لطفاً یک فایل تصویری انتخاب کنید" },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const pngBytes = await sharp(bytes).png().toBuffer();

  const signaturesDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "signatures",
  );
  await mkdir(signaturesDir, { recursive: true });

  const fileName = `doctor-${doctorId}.png`;
  await writeFile(path.join(signaturesDir, fileName), pngBytes);

  const signaturePath = `/uploads/signatures/${fileName}`;
  const updated = await updateDoctorSignature(doctorId, signaturePath);

  return NextResponse.json({ doctor: updated });
}
