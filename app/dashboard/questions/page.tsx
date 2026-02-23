import QuestionBankClient from './_components/question-bank-client';

export default function QuestionsPage() {
  // Use default case ID and name for simplicity
  const caseId = 'default-case-1';
  const caseName = 'State v. Johnson';

  return (
    <QuestionBankClient
      caseId={caseId}
      caseName={caseName}
    />
  );
}
