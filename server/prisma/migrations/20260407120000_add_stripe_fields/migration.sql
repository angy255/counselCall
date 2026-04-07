ALTER TABLE "AttorneyProfile"
ADD COLUMN "stripeAccountId" TEXT,
ADD COLUMN "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Booking"
ADD COLUMN "paymentIntentId" TEXT,
ADD COLUMN "amountInCents" INTEGER;
