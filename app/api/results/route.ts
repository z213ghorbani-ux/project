import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  getDoctors,
  getResults,
  createResult,
  getDoctorById,
} from "../../../lib/db";
import { isStaffAuthed } from "../../../lib/requireStaff";
import { sendResultSms } from "../../../lib/sms";
import { stampImageBuffer, stampPdfBuffer } from "../../../lib/stamp";

function generateCode(nid: string) {
  return `AR-${nid}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function GET() {
  if (!(await isStaffAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    doctors: await getDoctors(),
    results: await getResults(),
  });
}

export async function POST(request: NextRequest) {
  if (!(await isStaffAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const nid = formData.get("nid") as string;
  const doctorId = parseInt(formData.get("doctorId") as string, 10);
  const testType = formData.get("testType") as string;
  const file = formData.get("file") as File | null;

  if (!name || !phone || !nid || nid.length !== 4 || !doctorId) {
    return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
  }

  const doctor = await getDoctorById(doctorId);
  if (!doctor)
    return NextResponse.json({ error: "پزشک پیدا نشد" }, { status: 400 });

  let filePath: string | null = null,
    fileMime: string | null = null,
    stampedFilePath: string | null = null;

  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext =
      file.type === "application/pdf"
        ? "pdf"
        : file.type.split("/")[1] || "bin";
    const uid = crypto.randomUUID();
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const originalName = `${uid}-original.${ext}`;
    await writeFile(path.join(uploadsDir, originalName), bytes);
    filePath = `/uploads/${originalName}`;
    fileMime = file.type;

    if (file.type.startsWith("image/")) {
      try {
        const stampedBuffer = await stampImageBuffer(bytes, doctor);
        const stampedName = `${uid}-stamped.png`;
        await writeFile(path.join(uploadsDir, stampedName), stampedBuffer);
        stampedFilePath = `/uploads/${stampedName}`;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("stamp image failed:", message);
      }
    } else if (file.type === "application/pdf") {
      try {
        const stampedBuffer = await stampPdfBuffer(bytes, doctor);
        const stampedName = `${uid}-stamped.pdf`;
        await writeFile(path.join(uploadsDir, stampedName), stampedBuffer);
        stampedFilePath = `/uploads/${stampedName}`;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("stamp pdf failed:", message);
      }
    }
  }

  const code = generateCode(nid);
  const result = {
    id: crypto.randomUUID(),
    code,
    patientName: name,
    patientPhone: phone,
    nationalIdLast4: nid,
    doctorId,
    testType,
    filePath,
    fileMime,
    stampedFilePath,
    createdAt: new Date().toISOString(),
    viewedAt: null,
  };

  await createResult(result);

  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/r/${code}`;
  try {
    await sendResultSms(phone, {
      patientName: name,
      doctorName: doctor.name,
      testType,
      link,
    });
  } catch (smsError: unknown) {
    const message =
      smsError instanceof Error ? smsError.message : String(smsError);
    console.error("sendResultSms failed:", message);
  }

  return NextResponse.json({ result: { ...result, doctor } });
}
