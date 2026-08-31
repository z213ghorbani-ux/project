import { redirect } from "next/navigation";
import { isStaffAuthed } from "../../lib/requireStaff";
import StaffDashboard from "./StaffDashboard";

export default async function StaffPage() {
  if (!(await isStaffAuthed())) redirect("/staff/login");
  return <StaffDashboard />;
}
