import Link from "next/link";

import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { TRACKED_COINS } from "@/lib/coins";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function SiteHeader() {
  const session = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="shell flex h-16 items-center gap-6">
        <Link href="/" className="group flex items-center gap-2 font-display text-lg font-extrabold">
          <span className="grid size-8 place-items-center rounded-full bg-hype text-base text-ink shadow-inset-top transition-transform duration-[180ms] group-hover:rotate-12">
            🐕
          </span>
          <span className="hidden sm:inline">
            Memecoin<span className="text-hype"> Plaza</span>
          </span>
        </Link>

        <nav aria-label="Monedas" className="hidden flex-1 items-center gap-1 lg:flex">
          {TRACKED_COINS.map((coin) => (
            <Link
              key={coin.id}
              href={`/coin/${coin.slug}`}
              style={{ ["--coin-accent" as string]: coin.accent }}
              className="group relative rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-soft transition-colors hover:text-ink"
            >
              {coin.symbol}
              {/* Subrayado que crece desde el centro (DESIGN.md §7) */}
              <span
                aria-hidden
                className="absolute inset-x-3 bottom-0.5 h-0.5 origin-center scale-x-0 rounded-full bg-[color:var(--coin-accent)] transition-transform duration-[180ms] ease-out group-hover:scale-x-100"
              />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!isSupabaseConfigured ? (
            <span className="hidden rounded-full border border-doge/40 bg-doge-soft px-3 py-1 text-xs text-doge-ink sm:inline">
              Supabase sin configurar
            </span>
          ) : session ? (
            <UserMenu
              username={session.profile?.username ?? "degen"}
              avatarUrl={session.profile?.avatar_url ?? null}
            />
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Crear cuenta</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
