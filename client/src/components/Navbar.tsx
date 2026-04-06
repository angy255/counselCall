"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";

function NavItem({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        active
          ? "bg-slate-800 text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/attorneys", label: "Find Attorneys" },
  ];

  if (user?.role === "ATTORNEY") {
    links.push({ href: "/dashboard/attorney", label: "Attorney Dashboard" });
  }
  if (user?.role === "CLIENT") {
    links.push({ href: "/dashboard/client", label: "Client Dashboard" });
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          CounselCall
        </Link>

        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              active={pathname === link.href}
            />
          ))}

          {!loading && !user && (
            <>
              <NavItem href="/login" label="Login" active={pathname === "/login"} />
              <NavItem
                href="/register"
                label="Register"
                active={pathname === "/register"}
              />
            </>
          )}

          {user && (
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Logout
            </button>
          )}
        </nav>
      </div>

      {menuOpen && (
        <nav className="space-y-2 border-t border-slate-200 px-4 py-3 md:hidden">
          {links.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              active={pathname === link.href}
              onClick={() => setMenuOpen(false)}
            />
          ))}
          {!loading && !user && (
            <>
              <NavItem
                href="/login"
                label="Login"
                active={pathname === "/login"}
                onClick={() => setMenuOpen(false)}
              />
              <NavItem
                href="/register"
                label="Register"
                active={pathname === "/register"}
                onClick={() => setMenuOpen(false)}
              />
            </>
          )}
          {user && (
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push("/login");
                setMenuOpen(false);
              }}
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-left text-sm font-medium text-white"
            >
              Logout
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
