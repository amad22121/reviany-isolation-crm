import { useState } from "react";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { resetPassword } from "@/lib/auth/authClient";
import { Building2, Lock, User, Loader2, ArrowLeft } from "lucide-react";

const LoginPage = () => {
  const { signIn } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Veuillez entrer votre courriel."); return; }
    if (!password) { setError("Veuillez entrer votre mot de passe."); return; }
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }

    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim()) { setForgotError("Veuillez entrer votre courriel."); return; }
    setForgotLoading(true);
    const result = await resetPassword(forgotEmail.trim());
    setForgotLoading(false);
    if (result.error) { setForgotError(result.error); return; }
    setForgotSent(true);
  };

  if (showForgot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="glass-card p-8 w-full max-w-sm glow-green">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Growth Sales CRM</h1>
          </div>

          {forgotSent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-foreground">
                Si un compte existe pour <span className="font-medium">{forgotEmail}</span>, un courriel de réinitialisation a été envoyé.
              </p>
              <button
                onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                className="flex items-center gap-2 mx-auto text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground text-center">Mot de passe oublié</h2>
              <p className="text-sm text-muted-foreground text-center">
                Entrez votre courriel pour recevoir un lien de réinitialisation.
              </p>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Courriel</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {forgotError && (
                <p className="text-sm text-destructive text-center">{forgotError}</p>
              )}
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Envoyer le lien
              </button>
              <button
                type="button"
                onClick={() => { setShowForgot(false); setForgotError(null); }}
                className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Retour à la connexion
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="glass-card p-8 w-full max-w-sm glow-green">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Growth Sales CRM</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Courriel</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="nom@exemple.com"
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center"
          >
            Mot de passe oublié ?
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
