"use client";
import { useEffect, useRef, useState } from "react";

const TEST_TYPES = [
  "هولتر ۲۴ ساعت - نوار قلب",
  "هولتر ۲۴ ساعت - فشار خون",
  "هولتر ۴۸ ساعت - نوار قلب",
  "هولتر ۷۲ ساعت - نوار قلب",
  "هولتر هفتگی - نوار قلب",
  "هولتر ماهانه - نوار قلب",
  "اکوکاردیوگرافی",
  "استرس اکو",
  "نوار قلب (ECG)",
  "تست ورزش",
  "سایر",
];

const OTHER_LABEL = "سایر";

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
  testTypes: [] as string[],
  otherText: "",
};

// دراپ‌داون چک‌باکسی برای انتخاب چندتایی نوع آزمون + فایل جداگانه برای هر آزمون + گزینه‌ی «سایر»
function TestTypeMultiSelect({
  selected,
  onToggle,
  otherText,
  onOtherTextChange,
  filesByType,
  onFileChange,
  filesDisabled,
  inputClass,
}: {
  selected: string[];
  onToggle: (value: string) => void;
  otherText: string;
  onOtherTextChange: (value: string) => void;
  filesByType: Record<string, File | null>;
  onFileChange: (type: string, file: File | null) => void;
  filesDisabled: boolean;
  inputClass: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label =
    selected.length === 0 ? "نوع آزمون را انتخاب کنید" : selected.join("، ");

  return (
    <div ref={wrapperRef} className="relative md:col-span-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} w-full text-right truncate`}
      >
        {label}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {TEST_TYPES.map((t) => {
            const checked = selected.includes(t);
            return (
              <div key={t} className="border-b border-gray-50 last:border-none">
                <label className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(t)}
                  />
                  <span className="flex-1">{t}</span>
                  {checked && !filesDisabled && (
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onFileChange(t, e.target.files?.[0] ?? null)
                      }
                      className="text-xs w-32"
                    />
                  )}
                  {checked && filesDisabled && (
                    <span className="text-xs text-gray-400">
                      (فایل ثابت می‌ماند)
                    </span>
                  )}
                </label>

                {checked && t === OTHER_LABEL && (
                  <div className="px-3 pb-2">
                    <input
                      type="text"
                      className={`${inputClass} w-full`}
                      placeholder="نوع آزمون را بنویسید"
                      value={otherText}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onOtherTextChange(e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* خلاصه‌ی فایل‌های انتخاب‌شده برای هر آزمون */}
      {!filesDisabled && selected.some((t) => filesByType[t]) && (
        <ul className="mt-2 text-xs text-gray-600 space-y-1">
          {selected
            .filter((t) => filesByType[t])
            .map((t) => (
              <li key={t} className="flex items-center justify-between">
                <span>{t === OTHER_LABEL ? otherText || OTHER_LABEL : t}</span>
                <span className="truncate max-w-[140px]">
                  {filesByType[t]?.name}
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default function StaffDashboard() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [filesByType, setFilesByType] = useState<Record<string, File | null>>(
    {},
  );
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

  function toggleTestType(value: string) {
    setForm((prev) => {
      const exists = prev.testTypes.includes(value);
      const testTypes = exists
        ? prev.testTypes.filter((v) => v !== value)
        : [...prev.testTypes, value];
      const otherText = testTypes.includes(OTHER_LABEL) ? prev.otherText : "";
      return { ...prev, testTypes, otherText };
    });
    // اگه تیک آزمون برداشته شد، فایل مربوطه‌اش هم پاک بشه
    setFilesByType((prev) => {
      if (!(value in prev)) return prev;
      const next = { ...prev };
      delete next[value];
      return next;
    });
  }

  function handleFileChange(type: string, file: File | null) {
    setFilesByType((prev) => ({ ...prev, [type]: file }));
  }

  function displayLabelFor(type: string, f: typeof form) {
    return type === OTHER_LABEL ? f.otherText.trim() || OTHER_LABEL : type;
  }

  // ساخت رشته‌ی نمایشی نوع آزمون (برای ستون جدول و سازگاری با فیلد قبلی testType)
  function buildTestTypeValue(f: typeof form) {
    return f.testTypes
      .map((t) => displayLabelFor(t, f))
      .filter(Boolean)
      .join("، ");
  }

  function startEdit(r: ResultRow) {
    setEditingId(r.id);
    const existingTypes = r.testType
      ? r.testType.split("،").map((t) => t.trim())
      : [];
    const knownTypes = existingTypes.filter((t) => TEST_TYPES.includes(t));
    const unknownTypes = existingTypes.filter((t) => !TEST_TYPES.includes(t));
    setForm({
      name: r.patientName,
      phone: r.patientPhone,
      nid: r.nationalIdLast4,
      doctorId: String(r.doctorId),
      testTypes: unknownTypes.length
        ? [...knownTypes, OTHER_LABEL]
        : knownTypes,
      otherText: unknownTypes.join("، "),
    });
    setFilesByType({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFilesByType({});
  }

  async function handleDelete(id: string) {
    if (!confirm("این جواب حذف بشه؟ این کار قابل بازگشت نیست.")) return;
    const res = await fetch(`/api/results/${id}`, { method: "DELETE" });
    if (res.ok) loadData();
    else alert("حذف ناموفق بود.");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);

    try {
      const testTypeValue = buildTestTypeValue(form);
      const { testTypes, otherText, ...rest } = form;
      const payload = {
        ...rest,
        testType: testTypeValue,
      };

      // حالت ویرایش
      if (editingId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const res = await fetch(`/api/results/${editingId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error("PATCH error:", res.status, errorText);
            alert(`ویرایش ناموفق بود. کد خطا: ${res.status}`);
            return;
          }

          cancelEdit();
          await loadData();
        } finally {
          clearTimeout(timeoutId);
        }

        return;
      }

      // حالت ثبت جدید
      const fd = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          fd.append(key, String(value));
        }
      });

      const attachmentsMeta = form.testTypes.map((type) => ({
        label: displayLabelFor(type, form),
        hasFile: Boolean(filesByType[type]),
      }));

      fd.append("attachmentsMeta", JSON.stringify(attachmentsMeta));

      form.testTypes.forEach((type) => {
        const file = filesByType[type];

        if (file) {
          fd.append("files", file, file.name);
        }
      });

      console.log("Sending POST /api/results");
      console.log("Payload:", payload);
      console.log("Attachments:", attachmentsMeta);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const res = await fetch("/api/results", {
          method: "POST",
          body: fd,
          signal: controller.signal,
        });

        if (!res.ok) {
          const errorText = await res.text();

          console.error("POST error:", {
            status: res.status,
            statusText: res.statusText,
            body: errorText,
          });

          alert(`ثبت جواب ناموفق بود. کد خطا: ${res.status}`);
          return;
        }

        setForm(emptyForm);
        setFilesByType({});
        await loadData();
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        console.error("Request timeout");
        alert("سرور در زمان مشخص پاسخ نداد.");
      } else {
        console.error("Submit error:", error);
        alert("ارتباط با سرور برقرار نشد. لاگ‌های سرور را بررسی کنید.");
      }
    } finally {
      setBusy(false);
    }
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
            در حال ویرایش جواب — فایل‌های قبلی تغییر نمی‌کنند.
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
        <TestTypeMultiSelect
          selected={form.testTypes}
          onToggle={toggleTestType}
          otherText={form.otherText}
          onOtherTextChange={(v) => setForm({ ...form, otherText: v })}
          filesByType={filesByType}
          onFileChange={handleFileChange}
          filesDisabled={!!editingId}
          inputClass={inputClass}
        />
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
