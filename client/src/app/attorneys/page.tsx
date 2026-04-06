"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { PRACTICE_AREAS } from "../../lib/constants";
import { AttorneyListItem } from "../../lib/types";

export default function AttorneysPage() {
  const [practiceArea, setPracticeArea] = useState("");
  const [attorneys, setAttorneys] = useState<AttorneyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAttorneys() {
      setLoading(true);
      setError(null);
      try {
        const query = practiceArea
          ? `?practiceArea=${encodeURIComponent(practiceArea)}`
          : "";
        const data = await apiFetch<{ attorneys: AttorneyListItem[] }>(
          `/attorneys${query}`,
        );
        setAttorneys(data.attorneys);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load attorneys");
      } finally {
        setLoading(false);
      }
    }

    void loadAttorneys();
  }, [practiceArea]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Browse Attorneys</h1>
      <p className="mt-2 text-slate-600">
        Filter by practice area and open any attorney profile to view details and
        availability.
      </p>

      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-700">
          Practice area
        </label>
        <select
          value={practiceArea}
          onChange={(e) => setPracticeArea(e.target.value)}
          className="mt-1 w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-amber-600"
        >
          <option value="">All practice areas</option>
          {PRACTICE_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="mt-6 text-slate-600">Loading attorneys...</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {attorneys.map((attorney) => (
            <article
              key={attorney.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              {attorney.attorneyProfile?.photoUrl ? (
                <img
                  src={attorney.attorneyProfile.photoUrl}
                  alt={`${attorney.name} profile`}
                  className="mb-3 h-14 w-14 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
                  {attorney.name.trim().charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <h2 className="text-lg font-semibold">{attorney.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{attorney.email}</p>
              {attorney.attorneyProfile?.hourlyRate !== undefined && (
                <p className="mt-2 text-sm text-slate-700">
                  Rate: ${attorney.attorneyProfile.hourlyRate}/hour
                </p>
              )}
              {Array.isArray(attorney.attorneyProfile?.practiceAreas) && (
                <p className="mt-2 text-sm text-slate-600">
                  {attorney.attorneyProfile?.practiceAreas.join(", ")}
                </p>
              )}
              <Link
                href={`/attorneys/${attorney.id}`}
                className="mt-4 inline-block rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                View profile
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
