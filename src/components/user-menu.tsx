"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/app/auth/actions";

export function UserMenu({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-ink-700 py-1 pl-1 pr-3 transition-colors hover:border-white/20"
      >
        <Avatar username={username} avatarUrl={avatarUrl} size="sm" />
        <span className="hidden max-w-28 truncate text-sm text-cream sm:inline">{username}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-card border border-white/[0.08] bg-ink-800 p-1.5 shadow-soft"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-input px-3 py-2 text-sm text-sand transition-colors hover:bg-ink-700 hover:text-cream"
          >
            <User className="size-4" aria-hidden />
            Mi perfil
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-input px-3 py-2 text-left text-sm text-sand transition-colors hover:bg-ink-700 hover:text-cream"
            >
              <LogOut className="size-4" aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
