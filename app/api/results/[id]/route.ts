import { NextRequest, NextResponse } from "next/server";
import { deleteResult, updateResult, getDoctorById } from "../../../../lib/db";
import { isStaffAuthed } from "../../../../lib/requireStaff";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isStaffAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const { name, phone, nid, doctorId, testType } = body;

  if (!name || !phone || !nid || nid.length !== 4 || !doctorId) {
    return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
  }

  const doctor = await getDoctorById(parseInt(doctorId, 10));
  if (!doctor)
    return NextResponse.json({ error: "پزشک پیدا نشد" }, { status: 400 });

  const updated = await updateResult(id, {
    patientName: name,
    patientPhone: phone,
    nationalIdLast4: nid,
    doctorId: parseInt(doctorId, 10),
    testType,
  });

  if (!updated)
    return NextResponse.json({ error: "جواب پیدا نشد" }, { status: 404 });

  return NextResponse.json({ result: { ...updated, doctor } });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isStaffAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  await deleteResult(id);
  return NextResponse.json({ ok: true });
}
