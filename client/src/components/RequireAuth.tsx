"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { Role } from "../lib/types";

export function RequireAuth({
  children,
  role,
}: {
  children: ReactNode;
  role?: Role;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role && user.role !== role) {
      router.replace(user.role === "ATTORNEY" ? "/dashboard/attorney" : "/dashboard/client");
    }
  }, [user, loading, role, router]);

  if (loading || !user || (role && user.role !== role)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
