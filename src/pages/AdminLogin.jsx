import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import logo from "../assets/logo.jpg";

export default function AdminLogin({ onLoginSuccess, onBackToChat }) {
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
    <div className="admin-auth-page clean-admin-auth-page">
      <button
        type="button"
        className="admin-auth-back"
        onClick={onBackToChat}
        aria-label="Back to chatbot"
      >
        <ArrowLeft size={18} />
        <span>Back to Chatbot</span>
      </button>

      <main className="clean-admin-auth-shell">
        <section className="clean-admin-auth-left">
          <div className="clean-admin-auth-card">
            <div className="clean-admin-auth-badge">
              <ShieldCheck size={17} />
              <span>Admin Access</span>
            </div>

            <div className="clean-admin-auth-title">
              <h1>Log in</h1>
              <p>
                Sign in to manage student enquiries, Telegram sessions, and
                admissions support messages.
              </p>
            </div>

            <form className="clean-admin-auth-form" onSubmit={handleLogin}>
              <label>
                <span>Email address</span>

                <div className="clean-admin-field">
                  <Mail size={17} />
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

                <div className="clean-admin-field">
                  <Lock size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="clean-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
              </label>

              {errorMessage && (
                <p className="clean-admin-auth-error">{errorMessage}</p>
              )}

              <button
                type="submit"
                className="clean-admin-login-button"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Login"}
              </button>

              <div className="clean-admin-auth-help">
                <span>Don&apos;t have an account yet?</span>

                <button type="button" onClick={handleForgotPassword}>
                  Forgot your password?
                </button>
              </div>
            </form>
          </div>
        </section>

        <div className="clean-admin-divider">
          <span>OR</span>
        </div>

        <section className="clean-admin-auth-right">
          <div className="clean-admin-logo-panel">
            <img src={logo} alt="CamTech logo" />

            <div>
              <h2>CamTech Admin</h2>
              <p>Support Dashboard</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}