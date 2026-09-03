import { promises as fs } from "fs";
import path from "path";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  signaturePath?: string | null;
}

// هر پیوست مربوط به یک نوع آزمون خاص است
export interface Attachment {
  label: string; // نوع آزمون (مثلاً «نوار قلب (ECG)» یا متن سفارشی «سایر»)
  filePath: string | null;
  fileMime: string | null;
  stampedFilePath: string | null;
}

export interface Result {
  id: string;
  code: string;
  patientName: string;
  patientPhone: string;
  nationalIdLast4: string;
  doctorId: number;
  testType: string;
  attachments: Attachment[];
  createdAt: string;
  viewedAt: string | null;
}

interface AccessLog {
  id: string;
  resultId: string;
  success: boolean;
  ip: string;
  createdAt: string;
}
interface DbShape {
  doctors: Doctor[];
  results: Result[];
  accessLogs: AccessLog[];
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const DEFAULT_DOCTORS: Doctor[] = [
  "دکتر سعید اورعی",
  "دکتر سیامک امین‌نژاد",
  "دکتر علیرضا مهیار",
  "دکتر مهدی فتحی",
  "دکتر سودابه شفیعی",
  "دکتر سمیرا شیرزاد",
  "دکتر شیما یارمحمدی",
  "دکتر محبوبه خلیلی",
  "دکتر ثریا شهرزاد",
  "دکتر فاطمه صفاریان",
  "دکتر سیمین‌دخت مجاهدین",
  "دکتر مرضیه خیاط‌زاده",
  "دکتر روشنک محمودیان",
  "دکتر مه‌کامه فرمنش",
  "دکتر محبوبه شیخ",
].map((name, i) => ({
  id: i + 1,
  name,
  specialty: "متخصص قلب و عروق — فوق‌تخصص آریتمی",
  signaturePath: null,
}));

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(
      DB_PATH,
      JSON.stringify(
        { doctors: DEFAULT_DOCTORS, results: [], accessLogs: [] },
        null,
        2,
      ),
    );
  }
}

async function readDb(): Promise<DbShape> {
  await ensureDb();
  return JSON.parse(await fs.readFile(DB_PATH, "utf-8"));
}

async function writeDb(data: DbShape) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function getDoctors() {
  return (await readDb()).doctors;
}

export async function getDoctorById(id: number) {
  return (await readDb()).doctors.find((d) => d.id === id) || null;
}

export async function getResults() {
  const db = await readDb();
  return db.results
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((r) => ({
      ...r,
      doctor: db.doctors.find((d) => d.id === r.doctorId),
    }));
}

export async function createResult(result: Result) {
  const db = await readDb();
  db.results.push(result);
  await writeDb(db);
  return result;
}

export async function findResultByCode(code: string) {
  const db = await readDb();
  const result = db.results.find((r) => r.code === code);
  if (!result) return null;
  return {
    ...result,
    doctor: db.doctors.find((d) => d.id === result.doctorId)!,
  };
}

export async function updateResult(id: string, updates: Partial<Result>) {
  const db = await readDb();
  const idx = db.results.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  db.results[idx] = { ...db.results[idx], ...updates };
  await writeDb(db);
  return db.results[idx];
}

export async function addAccessLog(log: AccessLog) {
  const db = await readDb();
  db.accessLogs.push(log);
  await writeDb(db);
}
export async function deleteResult(id: string) {
  const db = await readDb();
  db.results = db.results.filter((r) => r.id !== id);
  await writeDb(db);
}
export async function updateDoctorSignature(
  id: number,
  signaturePath: string | null,
) {
  const db = await readDb();
  const idx = db.doctors.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  db.doctors[idx] = { ...db.doctors[idx], signaturePath };
  await writeDb(db);
  return db.doctors[idx];
}
