"use client";

import Image from "next/image";
import { useState } from "react";
import { logout } from "@/services/clientAuthService";

export default function DashboardTopbar() {
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
    <header className="topbar">
      <Image
        className="topbar-logo"
        src="/sxc_logo_biru.png"
        alt="SXC Logo"
        width={130}
        height={50}
        style={{ width: "auto", height: "50px" }}
        priority
      />

      <button
        className="logout-button"
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-label={isLoggingOut ? "Logging out" : "Logout"}
      >
        {/* TODO ICON:
            Ganti teks ini dengan SVG/icon component jika sudah tersedia. */}
        <span className="logout-icon" aria-hidden="true">
          ➜]
        </span>
      </button>
    </header>
  );
}
