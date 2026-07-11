import { redirect } from "next/navigation";
import {
  getCurrentUserFromServerCookies,
  isAdminUser,
} from "@/services/authService";
import AdminLogoutButton from "./_components/AdminLogoutButton";

export default async function AdminDashboardLayout({ children }) {
  const user = await getCurrentUserFromServerCookies();

  // User yang belum login tidak boleh membuka route /admin_dashboard.
  if (!user) {
    redirect("/login");
  }

  // User non-admin dikembalikan ke dashboard biasa.
  if (!isAdminUser(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="performance-portal">
      <header className="portal-header">
        <h1 className="portal-header__brand">Performance Portal</h1>

        <AdminLogoutButton />
      </header>

      {children}
    </div>
  );
}
