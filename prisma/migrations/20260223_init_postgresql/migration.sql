-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "causeNumber" TEXT,
    "defendantName" TEXT,
    "offenseType" TEXT,
    "date" TIMESTAMP(3),
    "venireSize" INTEGER NOT NULL DEFAULT 36,
    "jurySize" INTEGER NOT NULL DEFAULT 12,
    "numAlternates" INTEGER NOT NULL DEFAULT 1,
    "stateStrikes" INTEGER NOT NULL DEFAULT 10,
    "defenseStrikes" INTEGER NOT NULL DEFAULT 10,
    "stateAltStrikes" INTEGER NOT NULL DEFAULT 1,
    "defenseAltStrikes" INTEGER NOT NULL DEFAULT 1,
    "stateStrikesUsed" INTEGER NOT NULL DEFAULT 0,
    "defenseStrikesUsed" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurors" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "jurorNumber" INTEGER NOT NULL,
    "seatNumber" INTEGER,
    "firstName" TEXT,
    "lastName" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "occupation" TEXT,
    "employer" TEXT,
    "educationLevel" TEXT,
    "maritalStatus" TEXT,
    "numberOfChildren" INTEGER,
    "childrenAges" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "neighborhood" TEXT,
    "overallScore" INTEGER,
    "attorneyRating" INTEGER NOT NULL DEFAULT 0,
    "forCause" BOOLEAN NOT NULL DEFAULT false,
    "isStruck" BOOLEAN NOT NULL DEFAULT false,
    "panelType" TEXT NOT NULL DEFAULT 'REGULAR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jurors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "jurorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "juror_tags" (
    "id" TEXT NOT NULL,
    "jurorId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "juror_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scaleMax" INTEGER,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "jurorId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "scaledValue" INTEGER,
    "textValue" TEXT,
    "boolValue" BOOLEAN,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batson_challenges" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "jurorId" TEXT NOT NULL,
    "raceNeutralReasons" TEXT,
    "explanation" TEXT,
    "comparisonJurorIds" TEXT,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batson_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "for_cause_strategies" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "jurorId" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "outcome" TEXT,
    "outcomeNotes" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "for_cause_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "for_cause_strategies_caseId_jurorId_key" ON "for_cause_strategies"("caseId", "jurorId");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurors" ADD CONSTRAINT "jurors_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "jurors" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "juror_tags" ADD CONSTRAINT "juror_tags_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "jurors" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "jurors" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batson_challenges" ADD CONSTRAINT "batson_challenges_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batson_challenges" ADD CONSTRAINT "batson_challenges_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "jurors" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "for_cause_strategies" ADD CONSTRAINT "for_cause_strategies_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "for_cause_strategies" ADD CONSTRAINT "for_cause_strategies_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "jurors" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
