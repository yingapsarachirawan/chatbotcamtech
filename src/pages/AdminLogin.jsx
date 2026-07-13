import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import logo from "../assets/logo.jpg";

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      onLoginSuccess?.();
    } catch (error) {
      setErrorMessage(error.message || "Unable to login.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleForgotPassword() {
    setErrorMessage("Please contact the system administrator to reset your password.");
  }

  return (
    <main className="camtech-login-page-card">
      <section className="camtech-login-shell-card">
        <div className="camtech-login-brand-side">
          <div className="camtech-login-logo-wrap">
            <img src={logo} alt="CamTech logo" />
          </div>

          <h1>CamTech Admin</h1>

          <p>
            Manage student enquiries, Telegram sessions, Facebook messages, and
            admissions support in one clean dashboard.
          </p>

          <span className="camtech-login-line" />
        </div>

        <div className="camtech-login-form-side">
          <div className="camtech-login-badge">
            <ShieldCheck size={15} />
            <span>Admin Access</span>
          </div>

          <div className="camtech-login-heading">
            <h2>Welcome back</h2>
            <p>Sign in with your registered admin account.</p>
          </div>

          <form className="camtech-login-form" onSubmit={handleLogin}>
            <label>
              <span>Email</span>

              <div className="camtech-login-input">
                <Mail size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@camtech.edu.kh"
                  autoComplete="email"
                />
              </div>
            </label>

            <label>
              <span>Password</span>

              <div className="camtech-login-input">
                <Lock size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="camtech-login-eye"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {errorMessage && (
              <p className="camtech-login-error">{errorMessage}</p>
            )}

            <button
              type="submit"
              className="camtech-login-submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>

            <p className="camtech-login-note">
              Only registered admins can access this internal dashboard.
            </p>

            <div className="camtech-login-help">
              <span>Need help?</span>
              <button type="button" onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}