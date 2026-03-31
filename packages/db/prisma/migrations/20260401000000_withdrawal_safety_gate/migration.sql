ALTER TABLE "Withdrawal" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Withdrawal" ADD COLUMN "processAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "Withdrawal_status_processAfter_idx" ON "Withdrawal"("status", "processAfter");
