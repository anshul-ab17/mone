-- CreateTable
CREATE TABLE "DepositAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedTx" (
    "signature" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "asset" TEXT NOT NULL DEFAULT 'SOL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedTx_pkey" PRIMARY KEY ("signature")
);

-- CreateIndex
CREATE UNIQUE INDEX "DepositAddress_userId_key" ON "DepositAddress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositAddress_publicKey_key" ON "DepositAddress"("publicKey");

-- AddForeignKey
ALTER TABLE "DepositAddress" ADD CONSTRAINT "DepositAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
