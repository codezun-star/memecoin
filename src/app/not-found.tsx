import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="shell flex flex-col items-center py-24 text-center">
      <p className="font-display text-[5rem] font-extrabold leading-none text-hype">404</p>
      <h1 className="mt-3 font-display text-display-md">Esta moneda no existe (todavía)</h1>
      <p className="mt-2 max-w-md text-ink-soft">
        O te has equivocado de URL, o has inventado una meme coin nueva. Ambas cosas son muy de
        este sitio.
      </p>
      <Link href="/" className="mt-8">
        <Button size="lg">Volver al mercado</Button>
      </Link>
    </div>
  );
}
