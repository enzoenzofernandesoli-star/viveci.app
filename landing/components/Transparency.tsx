import Reveal from "./ui/Reveal";
import Section from "./ui/Section";

export default function Transparency() {
  return (
    <Section className="border-t border-border">
      <Reveal>
        <div className="rounded-xl border border-border p-8 md:p-12">
          <h2 className="max-w-2xl font-display text-xl font-semibold tracking-tight text-ink md:text-2xl">
            O VIVECI nunca finge saber algo que não sabe.
          </h2>
          <p className="mt-6 max-w-xl leading-relaxed text-muted">
            Toda funcionalidade que ainda depende de IA que não está
            conectada — leitura de foto de prato, análise corporal por
            imagem — é claramente sinalizada como simulação na própria tela.
            Transparente sobre o que é real e o que ainda está a caminho.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-warn/40 bg-warn/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-wide text-warn">
              Simulação
            </span>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
