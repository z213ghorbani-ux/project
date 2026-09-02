interface SmsParams {
  patientName: string;
  doctorName: string;
  testType: string;
  link: string;
}

export async function sendResultSms(
  phone: string,
  { patientName, doctorName, testType, link }: SmsParams,
) {
  const apiKey = process.env.SMSIR_API_KEY;
  const lineNumber = process.env.SMSIR_LINE_NUMBER;

  const message =
    `سلام ${patientName} عزیز؛ جواب ${testType} شما توسط ${doctorName} آماده شد.\n` +
    `مشاهده: ${link}\n` +
    `کلینیک آریتمی قلب`;

  if (!apiKey || !lineNumber) {
    console.log("[SMS DEV] would send to", phone, ":\n", message);
    return { dev: true };
  }

  try {
    const res = await fetch("https://api.sms.ir/v1/send/bulk", {
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

    const data = await res.json();
    if (data.status !== 1) {
      console.error("ارسال پیامک ناموفق بود:", data.message, data);
    }
    return data;
  } catch (err) {
    console.error("خطا در اتصال به sms.ir:", err);
    return null;
  }
}
