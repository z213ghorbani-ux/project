import { cookies } from "next/headers";
import { getExpectedSessionValue } from "./session";

export async function isStaffAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("staff_session");
  return !!cookie && cookie.value === getExpectedSessionValue();
}
