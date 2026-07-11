"use client";

import { useState } from "react";
import { logout } from "@/services/clientAuthService";

export default function AdminLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();

      // Gunakan full navigation agar cookie/session terbaru langsung diterapkan.
      window.location.assign("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      className="logout-button"
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label={isLoggingOut ? "Logging out" : "Logout"}
    >
      <span className="logout-icon" aria-hidden="true">
        ➜]
      </span>
    </button>
  );
}
