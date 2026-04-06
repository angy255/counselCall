"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { DAYS_OF_WEEK, PRACTICE_AREAS } from "../../../lib/constants";
import { RequireAuth } from "../../../components/RequireAuth";
import { AvailabilityEntry, Booking, Review } from "../../../lib/types";

type Profile = {
  bio: string;
  practiceAreas: string[];
  hourlyRate: number;
  photoUrl: string | null;
};

type BlockedDate = { id: string; date: string };

export default function AttorneyDashboardPage() {
  const [profile, setProfile] = useState<Profile>({
    bio: "",
    practiceAreas: [],
    hourlyRate: 0,
    photoUrl: "",
  });
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [history, setHistory] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availabilityForm, setAvailabilityForm] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
  });
  const [blockedDateInput, setBlockedDateInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function loadAll() {
    setError(null);
    try {
      const [p, a, b, upcoming, bookingHistory, attorneyReviews] = await Promise.all([
        apiFetch<{ profile: Profile }>("/dashboard/attorney/profile"),
        apiFetch<{ availability: AvailabilityEntry[] }>("/dashboard/attorney/availability"),
        apiFetch<{ blockedDates: BlockedDate[] }>("/dashboard/attorney/blocked-dates"),
        apiFetch<{ bookings: Booking[] }>("/dashboard/attorney/bookings?scope=upcoming"),
        apiFetch<{ bookings: Booking[] }>("/dashboard/attorney/bookings?scope=history"),
        apiFetch<{ reviews: Review[] }>("/dashboard/attorney/reviews"),
      ]);
      setProfile({
        bio: p.profile.bio || "",
        practiceAreas: p.profile.practiceAreas || [],
        hourlyRate: p.profile.hourlyRate || 0,
        photoUrl: p.profile.photoUrl || "",
      });
      setAvailability(a.availability);
      setBlockedDates(b.blockedDates);
      setBookings(upcoming.bookings);
      setHistory(bookingHistory.bookings);
      setReviews(attorneyReviews.reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function updateProfile(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await apiFetch("/dashboard/attorney/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...profile,
          photoUrl: profile.photoUrl || null,
        }),
      });
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile update failed");
    }
  }

  async function addAvailability(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await apiFetch("/dashboard/attorney/availability", {
        method: "POST",
        body: JSON.stringify(availabilityForm),
      });
      await loadAll();
      setMessage("Availability added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add availability");
    }
  }

  async function removeAvailability(id: string) {
    setMessage(null);
    setError(null);
    try {
      await apiFetch(`/dashboard/attorney/availability/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete availability");
    }
  }

  async function addBlockedDate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await apiFetch("/dashboard/attorney/blocked-dates", {
        method: "POST",
        body: JSON.stringify({ date: blockedDateInput }),
      });
      setBlockedDateInput("");
      await loadAll();
      setMessage("Blocked date added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add blocked date");
    }
  }

  async function removeBlockedDate(id: string) {
    setError(null);
    try {
      await apiFetch(`/dashboard/attorney/blocked-dates/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete blocked date");
    }
  }

  async function updateBookingStatus(id: string, status: "CONFIRMED" | "CANCELLED") {
    setError(null);
    try {
      await apiFetch(`/dashboard/attorney/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking");
    }
  }

  async function handlePhotoUpload(file: File | null) {
    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch("/api/upload/photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const payload = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !payload.url) {
        throw new Error(payload.error || "Photo upload failed");
      }

      setProfile((prev) => ({ ...prev, photoUrl: payload.url || null }));
      setMessage("Photo uploaded. Save profile to persist.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  }

  return (
    <RequireAuth role="ATTORNEY">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-semibold">Attorney Dashboard</h1>
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Profile</h2>
          <form onSubmit={updateProfile} className="mt-4 space-y-3">
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Professional bio"
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label
                  htmlFor="hourly-rate"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Hourly Rate ($/hour)
                </label>
                <input
                  id="hourly-rate"
                  type="number"
                  min={0}
                  value={profile.hourlyRate}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, hourlyRate: Number(e.target.value) }))
                  }
                  placeholder="Hourly rate"
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-photo"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Profile Photo
                </label>
                <input
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handlePhotoUpload(e.target.files?.[0] || null)}
                  disabled={uploadingPhoto}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
                />
                {uploadingPhoto && (
                  <p className="mt-2 text-xs text-slate-600">Uploading photo...</p>
                )}
                {profile.photoUrl && (
                  <img
                    src={profile.photoUrl}
                    alt="Attorney profile preview"
                    className="mt-3 h-20 w-20 rounded-full border border-slate-200 object-cover"
                  />
                )}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PRACTICE_AREAS.map((area) => {
                const selected = profile.practiceAreas.includes(area);
                return (
                  <label key={area} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        setProfile((prev) => ({
                          ...prev,
                          practiceAreas: selected
                            ? prev.practiceAreas.filter((item) => item !== area)
                            : [...prev.practiceAreas, area],
                        }))
                      }
                    />
                    {area}
                  </label>
                );
              })}
            </div>
            <button
              type="submit"
              className="rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
            >
              Save profile
            </button>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Weekly Availability</h2>
            <form onSubmit={addAvailability} className="mt-4 grid gap-3">
              <select
                value={availabilityForm.dayOfWeek}
                onChange={(e) =>
                  setAvailabilityForm((prev) => ({
                    ...prev,
                    dayOfWeek: Number(e.target.value),
                  }))
                }
                className="rounded-md border border-slate-300 bg-white px-3 py-2"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={availabilityForm.startTime}
                  onChange={(e) =>
                    setAvailabilityForm((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2"
                />
                <input
                  type="time"
                  value={availabilityForm.endTime}
                  onChange={(e) =>
                    setAvailabilityForm((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                Add availability
              </button>
            </form>
            <ul className="mt-4 space-y-2">
              {availability.map((slot) => (
                <li
                  key={slot.id}
                  className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm"
                >
                  <span>
                    {DAYS_OF_WEEK[slot.dayOfWeek]} | {slot.startTime} - {slot.endTime}
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeAvailability(slot.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Blocked Dates</h2>
            <form onSubmit={addBlockedDate} className="mt-4 flex gap-2">
              <input
                type="date"
                required
                value={blockedDateInput}
                onChange={(e) => setBlockedDateInput(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                Add
              </button>
            </form>
            <ul className="mt-4 space-y-2">
              {blockedDates.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm"
                >
                  <span>{new Date(entry.date).toISOString().slice(0, 10)}</span>
                  <button
                    type="button"
                    onClick={() => void removeBlockedDate(entry.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Upcoming Bookings</h2>
          <div className="mt-4 space-y-3">
            {bookings.length === 0 && (
              <p className="text-sm text-slate-600">No upcoming bookings.</p>
            )}
            {bookings.map((booking) => (
              <article key={booking.id} className="rounded border border-slate-200 p-3">
                <p className="text-sm font-medium">
                  {new Date(booking.date).toISOString().slice(0, 10)} | {booking.startTime} -{" "}
                  {booking.endTime}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Client: {booking.client?.name} ({booking.client?.email})
                </p>
                <p className="mt-1 text-sm text-slate-700">Status: {booking.status}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void updateBookingStatus(booking.id, "CONFIRMED")}
                    className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateBookingStatus(booking.id, "CANCELLED")}
                    className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500"
                  >
                    Cancel
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Booking History</h2>
          <div className="mt-4 space-y-3">
            {history.length === 0 && (
              <p className="text-sm text-slate-600">No past bookings.</p>
            )}
            {history.map((booking) => (
              <article key={booking.id} className="rounded border border-slate-200 p-3">
                <p className="text-sm font-medium">
                  {new Date(booking.date).toISOString().slice(0, 10)} | {booking.startTime} -{" "}
                  {booking.endTime}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Client: {booking.client?.name} ({booking.client?.email})
                </p>
                <p className="mt-1 text-sm text-slate-700">Status: {booking.status}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">My Reviews</h2>
          <div className="mt-4 space-y-3">
            {reviews.length === 0 && <p className="text-sm text-slate-600">No reviews yet.</p>}
            {reviews.map((review) => (
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
    </RequireAuth>
  );
}
