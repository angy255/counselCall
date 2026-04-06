"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth-context";

export default function HomePage() {
  const { user, loading } = useAuth();
  const dashboardHref =
    user?.role === "ATTORNEY" ? "/dashboard/attorney" : "/dashboard/client";

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        CounselCall
      </h1>
      <p className="mt-4 max-w-3xl text-slate-600">
        Find the right attorney, book consultations around real availability,
        and manage each booking from request to follow-up.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/attorneys"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Browse Attorneys
        </Link>
        {!loading && !user && (
          <Link
            href="/register"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Create Account
          </Link>
        )}
        {!loading && user && (
          <Link
            href={dashboardHref}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Go to Dashboard
          </Link>
        )}
      </div>
    </main>
  );
}
