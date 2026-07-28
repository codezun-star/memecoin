import Image from "next/image";
import Link from "next/link";

import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { FEATURED_COINS } from "@/lib/coins";
import { getSessionUser } from "@/lib/supabase/server";

export async function SiteHeader() {
  const session = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="shell flex h-16 items-center gap-6">
        <Link href="/" className="group flex items-center gap-2 font-display text-lg font-extrabold">
          {/* No se recorta a círculo: el logo lleva destellos fuera del disco. */}
          <Image
            src="/logo-mark.png"
            alt=""
            aria-hidden
            width={48}
            height={48}
            priority
            className="size-11 shrink-0 transition-transform duration-[180ms] group-hover:rotate-[-8deg] md:size-12"
          />
          <span className="hidden sm:inline">
            Memecoin<span className="text-hype"> Plaza</span>
          </span>
        </Link>

        {/* Solo las destacadas: con el catálogo completo la cabecera se desbordaría. */}
        <nav aria-label="Monedas destacadas" className="hidden flex-1 items-center gap-1 lg:flex">
          {FEATURED_COINS.map((coin) => (
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
          <Link
            href="/#mercado"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-brand-strong transition-colors hover:underline"
          >
            Ver todas
          </Link>
          <Link
            href="/blog"
            className="ml-2 rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            Blog
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {session ? (
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
