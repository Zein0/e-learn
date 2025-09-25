import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/auth/admin-login-form";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  if (user && user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <section className="flex justify-center">
      <div className="w-full max-w-lg space-y-6 rounded-3xl bg-white/80 p-8 shadow-soft ring-1 ring-brand-100">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-3xl text-brand-800">Admin Portal Access</h1>
          <p className="text-sm text-brand-500">
            Sign in with your administrator credentials to manage courses, bookings, and learners.
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </section>
  );
}

