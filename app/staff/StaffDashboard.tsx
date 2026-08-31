"use client";
import { useEffect, useState } from "react";

const TEST_TYPES = [
  "هولتر ۲۴ ساعته",
  "اکوکاردیوگرافی",
  "نوار قلب (ECG)",
  "تست ورزش",
  "سایر",
];

interface Doctor {
  id: number;
  name: string;
}
interface ResultRow {
  id: string;
  patientName: string;
  patientPhone: string;
  nationalIdLast4: string;
  doctorId: number;
  testType: string;
  code: string;
  doctor: Doctor;
}

const emptyForm = {
  name: "",
  phone: "",
  nid: "",
  doctorId: "",
  testType: TEST_TYPES[0],
};

export default function StaffDashboard() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadData() {
    const res = await fetch("/api/results");
    if (res.ok) {
      const data = await res.json();
      setDoctors(data.doctors);
      setResults(data.results);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function startEdit(r: ResultRow) {
    setEditingId(r.id);
    setForm({
      name: r.patientName,
      phone: r.patientPhone,
      nid: r.nationalIdLast4,
      doctorId: String(r.doctorId),
      testType: r.testType,
    });
    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("این جواب حذف بشه؟ این کار قابل بازگشت نیست.")) return;
    const res = await fetch(`/api/results/${id}`, { method: "DELETE" });
    if (res.ok) loadData();
    else alert("حذف ناموفق بود.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    if (editingId) {
      const res = await fetch(`/api/results/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setBusy(false);
      if (res.ok) {
        cancelEdit();
        loadData();
      } else alert("ویرایش ناموفق بود.");
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("file", file);
    const res = await fetch("/api/results", { method: "POST", body: fd });
    setBusy(false);
    if (res.ok) {
      setForm(emptyForm);
      setFile(null);
      loadData();
    } else alert("ثبت جواب ناموفق بود.");
  }

  const inputClass =
    "border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black";

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold">پنل مطب — ثبت جواب بیماران</h1>
        <a href="/staff/doctors" className="text-sm text-blue-600 underline">
          مدیریت امضای پزشکان
        </a>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
      >
        {editingId && (
          <div className="md:col-span-2 bg-yellow-50 text-yellow-800 text-sm rounded-md px-3 py-2">
            در حال ویرایش جواب — فایل قبلی تغییر نمی‌کند.
          </div>
        )}
        <input
          className={inputClass}
          placeholder="نام و نام خانوادگی بیمار"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className={inputClass}
          placeholder="شماره موبایل"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          className={inputClass}
          placeholder="۴ رقم آخر کد ملی"
          maxLength={4}
          value={form.nid}
          onChange={(e) => setForm({ ...form, nid: e.target.value })}
          required
        />
        <select
          className={inputClass}
          value={form.doctorId}
          onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
          required
        >
          <option value="">انتخاب پزشک</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={form.testType}
          onChange={(e) => setForm({ ...form, testType: e.target.value })}
        >
          {TEST_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {!editingId && (
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm md:col-span-2"
          />
        )}
        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-black text-white rounded-md py-2 font-bold disabled:opacity-50"
          >
            {busy
              ? "در حال ثبت..."
              : editingId
                ? "ذخیره‌ی تغییرات"
                : "صدور جواب و ساخت لینک"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md py-2 px-4 border border-gray-300 font-bold"
            >
              لغو
            </button>
          )}
        </div>
      </form>

      <h2 className="text-lg font-bold mb-3">جواب‌های صادرشده</h2>
      {results.length === 0 ? (
        <p className="text-sm text-gray-500">هنوز جوابی ثبت نشده.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-right text-xs text-gray-500">
                <th className="px-4 py-3">بیمار</th>
                <th className="px-4 py-3">پزشک</th>
                <th className="px-4 py-3">آزمون</th>
                <th className="px-4 py-3">کد پیگیری</th>
                <th className="px-4 py-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-100 last:border-none"
                >
                  <td className="px-4 py-3">{r.patientName}</td>
                  <td className="px-4 py-3">{r.doctor.name}</td>
                  <td className="px-4 py-3">{r.testType}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 flex-wrap">
                      <a
                        href={`/r/${r.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        مشاهده
                      </a>
                      <button
                        onClick={() => startEdit(r)}
                        className="text-amber-600 underline"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-600 underline"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
