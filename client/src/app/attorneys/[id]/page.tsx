"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PaymentForm } from "../../../components/PaymentForm";
import { apiFetch } from "../../../lib/api";
import { DAYS_OF_WEEK } from "../../../lib/constants";
import { useAuth } from "../../../lib/auth-context";
import { AvailabilityEntry, BlockedDate, Review } from "../../../lib/types";

type AttorneyDetail = {
  id: string;
  name: string;
  email: string;
  attorneyProfile: {
    bio: string;
    practiceAreas: string[];
    hourlyRate: number;
    photoUrl: string | null;
  } | null;
  availability: AvailabilityEntry[];
  blockedDates: BlockedDate[];
  reviewsAsAttorney: Review[];
};

export default function AttorneyDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [attorney, setAttorney] = useState<AttorneyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingAmount, setBookingAmount] = useState<number | null>(null);
  const [form, setForm] = useState({
    date: "",
    startTime: "",
    durationMinutes: 30 as 30 | 60,
    notes: "",
  });

  const hourlyRate = attorney?.attorneyProfile?.hourlyRate || 0;
  const feeSummary = useMemo(() => {
    const consultationFee = hourlyRate * (form.durationMinutes / 60);
    const platformFee = consultationFee * 0.1;
    return {
      consultationFee,
      platformFee,
      total: consultationFee,
    };
  }, [hourlyRate, form.durationMinutes]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ attorney: AttorneyDetail }>(
          `/attorneys/${params.id}`,
        );
        setAttorney(data.attorney);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load attorney");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      void load();
    }
  }, [params.id]);

  const availabilityByDay = useMemo(() => {
    if (!attorney) return [];
    return DAYS_OF_WEEK.map((day, idx) => ({
      day,
      ranges: attorney.availability.filter((item) => item.dayOfWeek === idx),
    }));
  }, [attorney]);

  async function handleBookingSubmit(e: FormEvent) {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);
    setSubmittingBooking(true);
    try {
      const data = await apiFetch<{
        booking: { amountInCents?: number | null };
        clientSecret: string | null;
      }>("/bookings", {
        method: "POST",
        body: JSON.stringify({
          attorneyId: params.id,
          date: form.date,
          startTime: form.startTime,
          durationMinutes: form.durationMinutes,
          notes: form.notes.trim() || undefined,
        }),
      });

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setBookingAmount(
          typeof data.booking.amountInCents === "number"
            ? data.booking.amountInCents / 100
            : feeSummary.total,
        );
      } else {
        setBookingSuccess("Consultation request submitted successfully.");
        setForm({ date: "", startTime: "", durationMinutes: 30, notes: "" });
      }
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmittingBooking(false);
    }
  }

  function handlePaymentSuccess() {
    setClientSecret(null);
    setBookingAmount(null);
    setBookingError(null);
    setForm({ date: "", startTime: "", durationMinutes: 30, notes: "" });
    setBookingSuccess("Booking submitted - payment authorized.");
  }

  if (loading) {
    return <main className="mx-auto max-w-6xl px-4 py-8">Loading attorney...</main>;
  }
  if (error || !attorney) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 text-red-600">
        {error || "Attorney not found"}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {attorney.attorneyProfile?.photoUrl ? (
              <img
                src={attorney.attorneyProfile.photoUrl}
                alt={`${attorney.name} profile`}
                className="h-20 w-20 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-700">
                {attorney.name.trim().charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold">{attorney.name}</h1>
              <p className="mt-1 text-sm text-slate-600">{attorney.email}</p>
            </div>
          </div>
          <p className="mt-4 text-slate-700">
            {attorney.attorneyProfile?.bio || "No bio provided yet."}
          </p>
          <p className="mt-3 text-sm text-slate-700">
            Practice Areas:{" "}
            {attorney.attorneyProfile?.practiceAreas?.join(", ") || "Not set"}
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Hourly Rate: ${attorney.attorneyProfile?.hourlyRate || 0}
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Book consultation</h2>
          {!user || user.role !== "CLIENT" ? (
            <p className="mt-2 text-sm text-slate-600">
              Login as a client to request a consultation.
            </p>
          ) : clientSecret ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-medium">Consultation fee summary</p>
                <p className="mt-1">
                  Hourly rate: <span className="font-medium">${hourlyRate.toFixed(2)}</span>
                </p>
                <p>
                  Duration: <span className="font-medium">{form.durationMinutes} minutes</span>
                </p>
                <p>
                  Total:{" "}
                  <span className="font-medium">
                    ${(bookingAmount ?? feeSummary.total).toFixed(2)}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  Platform fee (10%): ${feeSummary.platformFee.toFixed(2)}
                </p>
              </div>
              <PaymentForm
                clientSecret={clientSecret}
                amount={bookingAmount ?? feeSummary.total}
                onSuccess={handlePaymentSuccess}
              />
              <button
                type="button"
                onClick={() => {
                  setClientSecret(null);
                  setBookingAmount(null);
                  setBookingError(null);
                }}
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Back to booking form
              </button>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Start time</label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Duration
                </label>
                <select
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      durationMinutes: Number(e.target.value) as 30 | 60,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  rows={3}
                />
              </div>
              {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
              {bookingSuccess && (
                <p className="text-sm text-emerald-700">{bookingSuccess}</p>
              )}
              <button
                type="submit"
                disabled={submittingBooking}
                className="w-full rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
              >
                {submittingBooking ? "Submitting..." : "Request booking"}
              </button>
            </form>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Weekly availability</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availabilityByDay.map((dayEntry) => (
            <div key={dayEntry.day} className="rounded border border-slate-200 p-3">
              <p className="font-medium">{dayEntry.day}</p>
              {dayEntry.ranges.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">Unavailable</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {dayEntry.ranges.map((range) => (
                    <li key={range.id}>
                      {range.startTime} - {range.endTime}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <div className="mt-4 space-y-3">
          {attorney.reviewsAsAttorney.length === 0 && (
            <p className="text-sm text-slate-600">No reviews yet.</p>
          )}
          {attorney.reviewsAsAttorney.map((review) => (
            <article key={review.id} className="rounded border border-slate-200 p-3">
              <p className="text-sm font-medium">
                Rating: {review.rating}/5 by {review.client?.name || "Client"}
              </p>
              <p className="mt-1 text-sm text-slate-700">{review.comment}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
