"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

interface ResultData {
  patientName: string;
  doctorName: string;
  testType: string;
  createdAt: string;
  fileUrl: string | null;
  fileMime: string | null;
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
          {result.fileUrl && result.fileMime?.startsWith("image/") && (
            <img
              src={result.fileUrl}
              alt="جواب آزمون"
              style={{ width: "100%", borderRadius: 8 }}
            />
          )}
          {result.fileUrl && result.fileMime === "application/pdf" && (
            <a href={result.fileUrl} target="_blank" rel="noreferrer">
              دانلود فایل جواب (PDF)
            </a>
          )}
          {!result.fileUrl && <p>فایلی برای این جواب ثبت نشده است.</p>}
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
