import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <span className="text-white text-xl font-bold">R</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Daftar ke Rebar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mulai kelola proyek konstruksi Anda
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
