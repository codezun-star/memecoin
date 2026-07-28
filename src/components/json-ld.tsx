/**
 * Datos estructurados en la página.
 *
 * Los esquemas se construyen siempre a partir de ficheros de este repositorio y
 * del registro de monedas, nunca con texto que venga de fuera, así que
 * serializarlos a JSON e inyectarlos es seguro. `JSON.stringify` ya escapa las
 * comillas; lo único que hace falta además es cortar la secuencia que cerraría
 * la etiqueta antes de tiempo.
 */
export function JsonLd({ esquemas }: { esquemas: (Record<string, unknown> | null)[] }) {
  const validos = esquemas.filter((e): e is Record<string, unknown> => e !== null);

  return (
    <>
      {validos.map((esquema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(esquema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
