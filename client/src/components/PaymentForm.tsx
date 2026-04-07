"use client";

import { FormEvent, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

type PaymentFormProps = {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
};

type PaymentFormInnerProps = {
  amount: number;
  onSuccess: () => void;
};

function PaymentFormInner({ amount, onSuccess }: PaymentFormInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!stripe || !elements) {
      setError("Payment form is still loading. Please try again.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        setError(result.error.message || "Payment authorization failed.");
        return;
      }

      if (
        result.paymentIntent &&
        (result.paymentIntent.status === "succeeded" ||
          result.paymentIntent.status === "requires_capture")
      ) {
        setSuccess("Payment authorized successfully.");
        onSuccess();
        return;
      }

      setError("Payment could not be completed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement />
      <p className="text-sm text-slate-600">
        Authorization amount: <span className="font-medium">${amount.toFixed(2)}</span>
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
      <button
        type="submit"
        disabled={submitting || !stripe || !elements}
        className="w-full rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Authorizing..." : "Authorize payment"}
      </button>
    </form>
  );
}

export function PaymentForm({ clientSecret, amount, onSuccess }: PaymentFormProps) {
  const stripeUnavailable = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const options = useMemo(
    () => ({
      clientSecret,
    }),
    [clientSecret],
  );

  if (stripeUnavailable) {
    return (
      <p className="text-sm text-red-600">
        Stripe is not configured on the frontend. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}
