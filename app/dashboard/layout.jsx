import { redirect } from "next/navigation";
import DashboardTopbar from "./_components/DashboardTopbar";
import {
  getCurrentUserFromServerCookies,
  isAdminUser,
} from "@/services/authService";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUserFromServerCookies();

  // User yang belum login tidak boleh membuka route /dashboard.
  if (!user) {
    redirect("/login");
  }

  // ROLE RULE:
  // Hapus blok ini apabila admin tetap diperbolehkan membuka dashboard biasa.
  if (isAdminUser(user)) {
    redirect("/admin_dashboard");
  }

  return (
    <>
      <DashboardTopbar />
      {children}
    </>
  );
}
