// lib/sms.ts

const SMSIR_API_URL = "https://api.sms.ir/v1/send/bulk";

interface SmsParams {
  patientName: string;
  doctorName: string;
  testType: string;
  link: string;
}

interface SmsIrResponse {
  status: number;
  message: string;
}

export async function sendResultSms(
  phone: string,
  { patientName, doctorName, testType, link }: SmsParams,
): Promise<SmsIrResponse | { dev: true } | null> {
  const apiKey = process.env.SMSIR_API_KEY;
  const lineNumber = process.env.SMSIR_LINE_NUMBER;

  const message =
    `سلام ${patientName} عزیز؛ جواب ${testType} شما توسط دکتر ${doctorName} آماده شد.\n` +
    `مشاهده نتیجه: ${link}\n` +
    `کلینیک آریتمی قلب`;

  if (!apiKey || !lineNumber) {
    console.log("[SMS DEV] would send to:", phone);
    console.log("[SMS DEV] message:\n", message);
    return { dev: true };
  }

  try {
    const res = await fetch(SMSIR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        lineNumber: Number(lineNumber),
        messageText: message,
        mobiles: [phone],
      }),
    });

    if (!res.ok) {
      console.error(`[SMS] HTTP error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as SmsIrResponse;

    if (data.status !== 1) {
      console.error("[SMS] sms.ir rejected the request:", data.message);
      return null;
    }

    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[SMS] connection error:", message);
    return null;
  }
}
