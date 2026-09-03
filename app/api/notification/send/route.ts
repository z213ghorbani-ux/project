import { NextRequest, NextResponse } from "next/server";
import { sendResultSms } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, patientName, doctorName, testType, link } = body;

    if (!phone || !patientName || !doctorName || !testType || !link) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await sendResultSms(phone, { patientName, doctorName, testType, link });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Notification send failed:", msg);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 },
    );
  }
}
