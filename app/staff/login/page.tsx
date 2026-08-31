"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) router.push("/staff");
    else setError((await res.json()).error || "خطا در ورود");
  }

  return (
    <div className="login-wrap">
      <form onSubmit={handleSubmit} className="card">
        <h1>ورود کارکنان مطب</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="رمز عبور"
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? "در حال ورود..." : "ورود"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
