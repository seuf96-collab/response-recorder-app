-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "causeNumber" TEXT,
    "defendantName" TEXT,
    "offenseType" TEXT,
    "date" DATETIME,
    "jurySize" INTEGER NOT NULL DEFAULT 12,
    "numAlternates" INTEGER NOT NULL DEFAULT 1,
    "stateStrikes" INTEGER NOT NULL DEFAULT 10,
    "defenseStrikes" INTEGER NOT NULL DEFAULT 10,
    "stateAltStrikes" INTEGER NOT NULL DEFAULT 1,
    "defenseAltStrikes" INTEGER NOT NULL DEFAULT 1,
    "stateStrikesUsed" INTEGER NOT NULL DEFAULT 0,
    "defenseStrikesUsed" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "jurors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "jurorNumber" INTEGER NOT NULL,
    "seatNumber" INTEGER,
    "firstName" TEXT,
    "lastName" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "race" TEXT,
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
    "forCause" BOOLEAN NOT NULL DEFAULT false,
    "isStruck" BOOLEAN NOT NULL DEFAULT false,
    "panelType" TEXT NOT NULL DEFAULT 'REGULAR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "jurors_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jurorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notes_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "jurors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "juror_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jurorId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "juror_tags_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "jurors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scaleMax" INTEGER,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "questions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jurorId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "scaledValue" INTEGER,
    "textValue" TEXT,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "responses_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "jurors" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batson_challenges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "jurorId" TEXT NOT NULL,
    "raceNeutralReasons" TEXT,
    "explanation" TEXT,
    "comparisonJurorIds" TEXT,
    "raisedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "batson_challenges_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "batson_challenges_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "jurors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
