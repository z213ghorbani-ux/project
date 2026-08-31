import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  findResultByCode,
  updateResult,
  addAccessLog,
} from "../../../../lib/db";
import { checkRateLimit } from "../../../../lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { code, nid } = await request.json();

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error:
          "تعداد تلاش‌های شما بیش از حد مجاز است. کمی بعد دوباره امتحان کنید.",
      },
      { status: 429 },
    );
  }

  const result = await findResultByCode(code);
  const success = !!result && result.nationalIdLast4 === nid;

  if (result) {
    await addAccessLog({
      id: crypto.randomUUID(),
      resultId: result.id,
      success,
      ip,
      createdAt: new Date().toISOString(),
    });
  }

  if (!success || !result) {
    return NextResponse.json(
      { error: "کد پیگیری یا کد ملی درست نیست." },
      { status: 401 },
    );
  }

  if (!result.viewedAt) {
    await updateResult(result.id, { viewedAt: new Date().toISOString() });
  }

  return NextResponse.json({
    patientName: result.patientName,
    doctorName: result.doctor.name,
    doctorSpecialty: result.doctor.specialty,
    testType: result.testType,
    createdAt: result.createdAt,
    fileUrl: result.stampedFilePath || result.filePath,
    fileMime: result.fileMime,
  });
}
