"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

interface Attachment {
  label: string; // نوع آزمون مربوط به این فایل
  fileUrl: string | null;
  fileMime: string | null;
}

interface ResultData {
  patientName: string;
  doctorName: string;
  testType: string;
  createdAt: string;
  attachments: Attachment[];
}

export default function ResultPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const [nid, setNid] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/results/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, nid }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setResult(data);
  }

  if (result) {
    const hasAttachments = result.attachments?.some((a) => a.fileUrl);

    return (
      <div className="portal-wrap">
        <div className="card">
          <p>
            <strong>بیمار:</strong> {result.patientName}
          </p>
          <p>
            <strong>پزشک معالج:</strong> {result.doctorName}
          </p>
          <p>
            <strong>نوع آزمون:</strong> {result.testType}
          </p>
          <p>
            <strong>تاریخ:</strong>{" "}
            {new Date(result.createdAt).toLocaleDateString("fa-IR")}
          </p>

          {hasAttachments ? (
            <div className="attachments">
              {result.attachments
                .filter((a) => a.fileUrl)
                .map((a, i) => (
                  <div key={i} className="attachment-item">
                    <p className="attachment-label">
                      <strong>{a.label}</strong>
                    </p>
                    {a.fileMime?.startsWith("image/") && (
                      <img
                        src={a.fileUrl!}
                        alt={a.label}
                        style={{ width: "100%", borderRadius: 8 }}
                      />
                    )}
                    {a.fileMime === "application/pdf" && (
                      <a href={a.fileUrl!} target="_blank" rel="noreferrer">
                        دانلود فایل جواب ({a.label}) — PDF
                      </a>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p>فایلی برای این جواب ثبت نشده است.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="portal-wrap">
      <form onSubmit={handleSubmit} className="card">
        <h1>دریافت جواب آزمون</h1>
        <p>۴ رقم آخر کد ملی خود را وارد کنید</p>
        <input
          maxLength={4}
          inputMode="numeric"
          value={nid}
          onChange={(e) => setNid(e.target.value)}
          placeholder="مثلاً: 4471"
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? "در حال بررسی..." : "مشاهده جواب"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
