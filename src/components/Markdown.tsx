/** Rendu Markdown minimal et sûr (titres ##, listes -, paragraphes) — sans HTML brut */
export default function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="prose-rimal">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines[0].startsWith("## ")) {
          return (
            <div key={i}>
              <h2>{lines[0].slice(3)}</h2>
              {lines.length > 1 && <Lines lines={lines.slice(1)} />}
            </div>
          );
        }
        return <Lines key={i} lines={lines} />;
      })}
    </div>
  );
}

function Lines({ lines }: { lines: string[] }) {
  if (lines.every((l) => l.startsWith("- ")))
    return (
      <ul>
        {lines.map((l, i) => (
          <li key={i}>{l.slice(2)}</li>
        ))}
      </ul>
    );
  return <p>{lines.join(" ")}</p>;
}
