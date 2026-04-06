"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { Role } from "../../lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENT" as Role,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-amber-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-amber-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 pr-11 outline-none focus:border-amber-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4.5l17.25 15M10.58 10.58a2 2 0 102.83 2.83M9.88 5.93A10.66 10.66 0 0112 5.75c5.35 0 9 6.25 9 6.25a16.62 16.62 0 01-4.54 4.95M6.66 8.18A16.88 16.88 0 003 12s3.65 6.25 9 6.25c1.63 0 3.12-.41 4.43-1.03"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12s3.75-6.25 9.75-6.25S21.75 12 21.75 12 18 18.25 12 18.25 2.25 12 2.25 12z"
                  />
                  <circle cx="12" cy="12" r="2.75" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-amber-600"
          >
            <option value="CLIENT">Client</option>
            <option value="ATTORNEY">Attorney</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </main>
  );
}
