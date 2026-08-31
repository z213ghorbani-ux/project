import { redirect } from "next/navigation";
import { isStaffAuthed } from "../../../lib/requireStaff";
import DoctorsPanel from "./DoctorsPanel";

export default async function DoctorsPage() {
  if (!(await isStaffAuthed())) redirect("/staff/login");
  return <DoctorsPanel />;
}
