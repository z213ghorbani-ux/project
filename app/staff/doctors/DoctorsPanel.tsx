"use client";
import { useEffect, useState } from "react";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  signaturePath?: string | null;
}

export default function DoctorsPanel() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function loadDoctors() {
    const res = await fetch("/api/results");
    if (res.ok) {
      const data = await res.json();
      setDoctors(data.doctors);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  async function handleUpload(doctorId: number, file: File) {
    console.log(
      "انتخاب شد:",
      file.name,
      "| نوع:",
      file.type,
      "| حجم:",
      file.size,
    );

    if (file.type.startsWith("image/")) {
      try {
        const stampedBuffer = await stampImageBuffer(bytes, doctor);
        const stampedName = `${uid}-stamped.png`;
        await writeFile(path.join(uploadsDir, stampedName), stampedBuffer);
        stampedFilePath = `/uploads/${stampedName}`;
      } catch (err) {
        console.error("stamp image failed:", err);
      }
    } else if (file.type === "application/pdf") {
      console.log(
        "در حال مهرزدن PDF... آیا پزشک امضا دارد؟",
        !!doctor.signaturePath,
      );
      try {
        const stampedBuffer = await stampPdfBuffer(bytes, doctor);
        const stampedName = `${uid}-stamped.pdf`;
        await writeFile(path.join(uploadsDir, stampedName), stampedBuffer);
        stampedFilePath = `/uploads/${stampedName}`;
        console.log("مهر PDF موفق بود:", stampedFilePath);
      } catch (err: any) {
        console.error("!!! خطای کامل مهرزدن PDF:", err?.message || err);
        console.error(err);
      }
    }

    console.log(
      "نتیجه‌ی نهایی → filePath:",
      filePath,
      "| stampedFilePath:",
      stampedFilePath,
    );
    setBusyId(doctorId);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/doctors/${doctorId}/signature`, {
      method: "POST",
      body: fd,
    });
    setBusyId(null);
    if (res.ok) {
      loadDoctors();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`آپلود ناموفق بود: ${data.error || "خطای نامشخص"}`);
    }
  }
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8" dir="rtl">
      <h1 className="text-xl font-extrabold mb-1">مدیریت امضای پزشکان</h1>
      <p className="text-sm text-gray-500 mb-6">
        برای هر پزشک یک فایل PNG با پس‌زمینه‌ی شفاف آپلود کن. این امضا روی
        جواب‌های همان پزشک درج می‌شود.
      </p>
      <div className="bg-white rounded-2xl shadow-lg divide-y">
        {doctors.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="flex items-center gap-3">
              {d.signaturePath ? (
                <img
                  src={d.signaturePath}
                  alt={d.name}
                  className="w-16 h-16 object-contain border rounded-md bg-gray-50"
                />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center border rounded-md bg-gray-50 text-[10px] text-gray-400 text-center">
                  بدون امضا
                </div>
              )}
              <div>
                <p className="font-bold text-sm">{d.name}</p>
                <p className="text-xs text-gray-500">{d.specialty}</p>
              </div>
            </div>
            <label className="text-sm text-blue-600 underline cursor-pointer">
              {busyId === d.id
                ? "در حال آپلود..."
                : d.signaturePath
                  ? "تعویض امضا"
                  : "آپلود امضا"}
              <input
                type="file"
                accept="image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(d.id, file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
