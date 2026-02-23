import LoginForm from './_components/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Jury Selection</h1>
            <p className="text-slate-600">Professional voir dire management</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
