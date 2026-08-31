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
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const message =
    `سلام ${patientName} عزیز؛ جواب ${testType} شما توسط ${doctorName} آماده شد.\n` +
    `مشاهده: ${link}\n` +
    `کلینیک آریتمی قلب`;

  if (!apiKey) {
    console.log("[SMS DEV] would send to", phone, ":\n", message);
    return { dev: true };
  }

  const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
  const params = new URLSearchParams({
    receptor: phone,
    message,
    sender: process.env.KAVENEGAR_SENDER || "",
  });
  const res = await fetch(`${url}?${params.toString()}`);
  if (!res.ok) console.error("SMS send failed:", await res.text());
  return res;
}
