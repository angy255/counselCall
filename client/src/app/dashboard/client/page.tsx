"use client";

import { FormEvent, useEffect, useState } from "react";
import { RequireAuth } from "../../../components/RequireAuth";
import { apiFetch } from "../../../lib/api";
import { Booking } from "../../../lib/types";

export default function ClientDashboardPage() {
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [reviewForm, setReviewForm] = useState({
    attorneyId: "",
    rating: 5,
    comment: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        apiFetch<{ bookings: Booking[] }>("/dashboard/client/bookings?scope=upcoming"),
        apiFetch<{ bookings: Booking[] }>("/dashboard/client/bookings?scope=past"),
      ]);
      setUpcoming(upcomingRes.bookings);
      setPast(pastRes.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function cancelBooking(bookingId: string) {
    setMessage(null);
    setError(null);
    try {
      await apiFetch(`/dashboard/client/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });
      setMessage("Booking cancelled.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed");
    }
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await apiFetch("/dashboard/client/reviews", {
        method: "POST",
        body: JSON.stringify(reviewForm),
      });
      setMessage("Review submitted.");
      setReviewForm({ attorneyId: "", rating: 5, comment: "" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review submission failed");
    }
  }

  return (
    <RequireAuth role="CLIENT">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-semibold">Client Dashboard</h1>
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Upcoming Bookings</h2>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 && (
              <p className="text-sm text-slate-600">No upcoming bookings.</p>
            )}
            {upcoming.map((booking) => (
              <article key={booking.id} className="rounded border border-slate-200 p-3">
                <p className="text-sm font-medium">
                  {new Date(booking.date).toISOString().slice(0, 10)} | {booking.startTime} -{" "}
                  {booking.endTime}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Attorney: {booking.attorney?.name}
                </p>
                <p className="mt-1 text-sm text-slate-700">Status: {booking.status}</p>
                <button
                  type="button"
                  onClick={() => void cancelBooking(booking.id)}
                  className="mt-3 rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500"
                >
                  Cancel booking
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Past Bookings</h2>
          <div className="mt-4 space-y-3">
            {past.length === 0 && <p className="text-sm text-slate-600">No past bookings.</p>}
            {past.map((booking) => (
              <article key={booking.id} className="rounded border border-slate-200 p-3">
                <p className="text-sm font-medium">
                  {new Date(booking.date).toISOString().slice(0, 10)} | {booking.startTime} -{" "}
                  {booking.endTime}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Attorney: {booking.attorney?.name}
                </p>
                <p className="mt-1 text-sm text-slate-700">Status: {booking.status}</p>
                {booking.status === "CONFIRMED" && (
                  <button
                    type="button"
                    onClick={() =>
                      setReviewForm((prev) => ({
                        ...prev,
                        attorneyId: booking.attorneyId,
                      }))
                    }
                    className="mt-3 rounded-md border border-amber-400 px-3 py-1 text-sm text-amber-700 hover:bg-amber-50"
                  >
                    Review this attorney
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Leave a Review</h2>
          <form onSubmit={submitReview} className="mt-4 grid gap-3 md:max-w-xl">
            <input
              type="text"
              placeholder="Attorney ID (auto-filled from a past confirmed booking)"
              required
              value={reviewForm.attorneyId}
              onChange={(e) =>
                setReviewForm((prev) => ({ ...prev, attorneyId: e.target.value }))
              }
              className="rounded-md border border-slate-300 px-3 py-2"
            />
            <select
              value={reviewForm.rating}
              onChange={(e) =>
                setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              <option value={5}>5</option>
              <option value={4}>4</option>
              <option value={3}>3</option>
              <option value={2}>2</option>
              <option value={1}>1</option>
            </select>
            <textarea
              required
              rows={4}
              value={reviewForm.comment}
              onChange={(e) =>
                setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
              }
              placeholder="Write your review"
              className="rounded-md border border-slate-300 px-3 py-2"
            />
            <button
              type="submit"
              className="rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
            >
              Submit review
            </button>
          </form>
        </section>
      </main>
    </RequireAuth>
  );
}
