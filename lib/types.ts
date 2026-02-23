// Case types
export type Case = {
  id: string
  name: string
  causeNumber: string | null
  defendantName: string | null
  offenseType: string | null
  date: Date | null
  jurySize: number
  numAlternates: number
  stateStrikes: number
  defenseStrikes: number
  stateAltStrikes: number
  defenseAltStrikes: number
  stateStrikesUsed: number
  defenseStrikesUsed: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

export type CaseFormData = Omit<Case, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

// Juror types
export type Juror = {
  id: string
  caseId: string
  jurorNumber: number
  seatNumber: number | null
  firstName: string | null
  lastName: string | null
  age: number | null
  gender: string | null
  occupation: string | null
  employer: string | null
  educationLevel: string | null
  maritalStatus: string | null
  numberOfChildren: number | null
  childrenAges: string | null
  city: string | null
  zipCode: string | null
  neighborhood: string | null
  overallScore: number | null
  attorneyRating: number
  forCause: boolean
  isStruck: boolean
  panelType: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export type JurorFormData = Omit<Juror, 'id' | 'caseId' | 'createdAt' | 'updatedAt'>

export enum JurorStatus {
  ACTIVE = 'ACTIVE',
  STRUCK_BY_STATE = 'STRUCK_BY_STATE',
  STRUCK_BY_DEFENSE = 'STRUCK_BY_DEFENSE',
  STRUCK_FOR_CAUSE = 'STRUCK_FOR_CAUSE',
  EXCUSED = 'EXCUSED'
}

// Question types
export type Question = {
  id: string
  caseId: string
  text: string
  type: string
  scaleMax: number | null
  weight: number
  category: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type QuestionFormData = Omit<Question, 'id' | 'caseId' | 'createdAt' | 'updatedAt'>

// Response types
export type Response = {
  id: string
  jurorId: string
  questionId: string
  scaledValue: number | null
  textValue: string | null
  answeredAt: Date
  createdAt: Date
  updatedAt: Date
}

export type ResponseFormData = Omit<Response, 'id' | 'createdAt' | 'updatedAt' | 'answeredAt'> & {
  answeredAt?: Date | null
}

// Batson challenge types
export type BatsonChallenge = {
  id: string
  caseId: string
  jurorId: string
  raceNeutralReasons: string | null
  explanation: string | null
  comparisonJurorIds: string | null
  raisedAt: Date
  createdAt: Date
  updatedAt: Date
}

export type BatsonFormData = Omit<BatsonChallenge, 'id' | 'caseId' | 'createdAt' | 'updatedAt' | 'raisedAt'>

// Juror tag type
export type JurorTag = {
  id: string
  jurorId: string
  tag: string
  createdAt: Date
}

// Strike zone calculation
export type StrikeZone = {
  regular: {
    total: number
    start: number
    end: number
  }
  alternate: {
    total: number
    start: number
    end: number
  }
}

// ─── AI For-Cause Strategy Types ──────────────────────────────────
export interface StrategyQuestion {
  text: string;
  purpose: string;
  followUpIf: string;
}

export interface QuestionSequence {
  label: string;
  technique: string;
  targetVulnerability: string;
  questions: StrategyQuestion[];
  closingCommitment: string;
}

export interface Vulnerability {
  area: string;
  evidence: string;
  exploitability: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ForCauseStrategyData {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  priorityReasoning: string;
  vulnerabilities: Vulnerability[];
  questionSequences: QuestionSequence[];
  anticipatedRehabilitation: string;
  overallAssessment: string;
}

export interface JurorStrategy {
  jurorId: string;
  strategy: ForCauseStrategyData;
  outcome: string | null;
  outcomeNotes: string | null;
  generatedAt: string;
  loading?: boolean;
  error?: string | null;
}
