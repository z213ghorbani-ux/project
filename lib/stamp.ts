import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { promises as fs } from "fs";
import path from "path";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  signaturePath?: string | null;
}

// Fallback stamp used only if the doctor hasn't uploaded a real signature yet
export function stampSvg(doctor: Doctor): string {
  const rotation =
    (doctor.id % 2 === 0 ? 1 : -1) * (4 + ((doctor.id * 2.3) % 9));
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="160" height="160">
    <g transform="rotate(${rotation} 100 100)">
      <circle cx="100" cy="100" r="88" fill="none" stroke="#AE3A2E" stroke-width="4"/>
      <circle cx="100" cy="100" r="74" fill="none" stroke="#AE3A2E" stroke-width="2"/>
      <text x="100" y="92" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="bold" fill="#AE3A2E">${doctor.name}</text>
      <text x="100" y="112" text-anchor="middle" font-family="sans-serif" font-size="8.5" fill="#AE3A2E">${doctor.specialty}</text>
      <path d="M62,130 L82,130 L88,122 L94,140 L100,116 L106,142 L112,130 L138,130" fill="none" stroke="#AE3A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="100" y="158" text-anchor="middle" font-family="sans-serif" font-size="7.5" fill="#AE3A2E">کلینیک آریتمی قلب</text>
    </g>
  </svg>`;
}

// Returns the doctor's real uploaded signature as a PNG buffer, or falls
// back to the generated placeholder stamp if none has been uploaded yet.
async function getStampPngBuffer(doctor: Doctor): Promise<Buffer> {
  if (doctor.signaturePath) {
    try {
      const fullPath = path.join(
        process.cwd(),
        "public",
        doctor.signaturePath.replace(/^\//, ""),
      );
      const raw = await fs.readFile(fullPath);
      return await sharp(raw).resize({ width: 200 }).png().toBuffer();
    } catch (err) {
      console.error("امضای پزشک پیدا نشد، از مهر پیش‌فرض استفاده می‌شود:", err);
    }
  }
  return sharp(Buffer.from(stampSvg(doctor)))
    .png()
    .toBuffer();
}

// Stamps an image (jpg/png/...) result.
export async function stampImageBuffer(
  baseImageBuffer: Buffer,
  doctor: Doctor,
): Promise<Buffer> {
  const stampPng = await getStampPngBuffer(doctor);
  return sharp(baseImageBuffer)
    .composite([{ input: stampPng, gravity: "southeast" }])
    .png()
    .toBuffer();
}

// Stamps a PDF result — draws the signature on the bottom-right of the last page.
export async function stampPdfBuffer(
  pdfBuffer: Buffer,
  doctor: Doctor,
): Promise<Buffer> {
  const stampPngBuffer = await getStampPngBuffer(doctor);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pngImage = await pdfDoc.embedPng(stampPngBuffer);

  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();

  const stampWidth = 110;
  const stampHeight = (pngImage.height / pngImage.width) * stampWidth;

  lastPage.drawImage(pngImage, {
    x: width - stampWidth - 80,
    y: 140,
    width: stampWidth,
    height: stampHeight,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
