import crypto from "node:crypto";

export function getExpectedSessionValue(): string {
  return crypto
    .createHash("sha256")
    .update(process.env.STAFF_SESSION_SECRET || "dev-secret-change-me")
    .digest("hex");
}
