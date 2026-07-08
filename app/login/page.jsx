"use client";

import { useState } from "react";
import { login } from "@/services/clientAuthService";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background" />

      <div className="login-content">
        <div className="login-logo-section">
          <Image
            src="/sxc_logo.png"
            alt="Logo"
            width={180}
            height={90}
            className="login-logo"
          />
        </div>

        <div className="login-card">
          <h1 className="login-title">Sign In</h1>

          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />

            {error && <p className="login-error">{error}</p>}

            <button type="submit" disabled={isLoading} className="login-button">
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Forgot Password */}
          {/* <p className="forgot-password">
            Forgot Password
          </p> */}
        </div>

        <div className="login-footer">
          <p className="login-footer-title">
            <span>StudentxCEOs East Java</span>
            <br />
            <span>By Talent Analytics</span>
          </p>
        </div>
      </div>
    </div>
  );
}
