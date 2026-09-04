import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  getDoctors,
  getResults,
  createResult,
  getDoctorById,
  type Attachment,
} from "../../../lib/db";
import { isStaffAuthed } from "../../../lib/requireStaff";
import { sendResultSms } from "../../../lib/sms";
import { stampImageBuffer, stampPdfBuffer } from "../../../lib/stamp";

function generateCode() {
  return `AR-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function GET() {
  if (!(await isStaffAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    doctors: await getDoctors(),
    results: await getResults(),
  });
}

interface AttachmentMetaInput {
  label: string;
  hasFile: boolean;
}

interface DoctorLike {
  id: number;
  name: string;
  specialty: string;
  signaturePath?: string | null;
}

async function buildAttachment(
  file: File,
  uploadsDir: string,
  doctor: DoctorLike,
  label: string,
  testType: string,
): Promise<Attachment> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext =
    file.type === "application/pdf" ? "pdf" : file.type.split("/")[1] || "bin";
  const uid = crypto.randomUUID();

  const originalName = `${uid}-original.${ext}`;
  await writeFile(path.join(uploadsDir, originalName), bytes);
  const filePath = `/uploads/${originalName}`;
  const fileMime = file.type;
  let stampedFilePath: string | null = null;

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
      const stampedBuffer = await stampPdfBuffer(bytes, doctor, testType);
      const stampedName = `${uid}-stamped.pdf`;
      await writeFile(path.join(uploadsDir, stampedName), stampedBuffer);
      stampedFilePath = `/uploads/${stampedName}`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("stamp pdf failed:", message);
    }
  }

  return { label, filePath, fileMime, stampedFilePath };
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
  const attachmentsMetaRaw = formData.get("attachmentsMeta") as string | null;
  const files = formData.getAll("files") as File[];

  if (!name || !phone || !nid || nid.length !== 4 || !doctorId) {
    return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
  }

  const doctor = await getDoctorById(doctorId);
  if (!doctor)
    return NextResponse.json({ error: "پزشک پیدا نشد" }, { status: 400 });

  let attachmentsMeta: AttachmentMetaInput[] = [];
  if (attachmentsMetaRaw) {
    try {
      attachmentsMeta = JSON.parse(attachmentsMetaRaw);
    } catch {
      attachmentsMeta = [];
    }
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (attachmentsMeta.some((m) => m.hasFile)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const attachments: Attachment[] = [];
  let fileIndex = 0;

  for (const meta of attachmentsMeta) {
    if (!meta.hasFile) {
      attachments.push({
        label: meta.label,
        filePath: null,
        fileMime: null,
        stampedFilePath: null,
      });
      continue;
    }

    const file = files[fileIndex];
    fileIndex += 1;

    if (!file) {
      attachments.push({
        label: meta.label,
        filePath: null,
        fileMime: null,
        stampedFilePath: null,
      });
      continue;
    }

    attachments.push(
      await buildAttachment(file, uploadsDir, doctor, meta.label, testType),
    );
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
    attachments,
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
