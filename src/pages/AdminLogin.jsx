import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import logo from "../assets/logo.jpg";

export default function AdminLogin({ onLoginSuccess, onBackToChat }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <div className="admin-auth-brand">
          <div className="admin-auth-logo">
            <img src={logo} alt="CamTech logo" />
          </div>

          <div>
            <h1>CamTech</h1>
            <p>Support Dashboard</p>
          </div>
        </div>

        <h2>Admin Login</h2>

        <p className="admin-auth-subtext">
          Sign in to manage student enquiries and reply to admissions support
          messages.
        </p>

        <form className="admin-auth-form" onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Admin email"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />

          {errorMessage && <p className="admin-auth-error">{errorMessage}</p>}

          <div className="admin-auth-actions">
            <button type="button" onClick={onBackToChat}>
              Back
            </button>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}