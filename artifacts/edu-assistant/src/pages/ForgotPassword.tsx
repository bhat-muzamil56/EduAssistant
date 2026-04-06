import { useState } from "react";
import { Link } from "wouter";
import { GraduationCap, Mail, AlertCircle, CheckCircle2, ArrowLeft, Copy, Check, KeyRound } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setResetToken(data.resetToken);
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyToken() {
    if (!resetToken) return;
    navigator.clipboard.writeText(resetToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 hover:bg-primary/20 transition-colors">
            <GraduationCap className="w-8 h-8 text-primary" />
          </Link>
          <h1 className="text-3xl font-bold">Reset your password</h1>
          <p className="text-muted-foreground mt-2">Enter your email to receive a reset token</p>
        </div>

        {!resetToken ? (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            {error && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your account email"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Generating token…" : "Send Reset Token"}
              </button>
            </div>

            <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
              <Link href="/login" className="flex items-center gap-1 hover:text-primary transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
              <Link href="/signup" className="hover:text-primary transition-colors">
                Create account
              </Link>
            </div>
          </form>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">Reset token generated successfully!</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Copy your reset token below. Then go to the reset page and use it along with your new password.
                <span className="text-amber-500 font-medium"> This token expires in 1 hour.</span>
              </p>

              <div className="flex items-center gap-2 p-4 bg-secondary rounded-xl border border-border font-mono text-lg font-bold tracking-widest text-foreground text-center justify-center">
                <KeyRound className="w-5 h-5 text-primary shrink-0" />
                <span className="select-all">{resetToken}</span>
              </div>

              <button
                onClick={copyToken}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy token"}
              </button>
            </div>

            <Link
              href="/reset-password"
              className="block w-full py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all text-center"
            >
              Go to Reset Password →
            </Link>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="flex items-center justify-center gap-1 hover:text-primary transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
