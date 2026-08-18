import Reveal from "./ui/Reveal";
import Section from "./ui/Section";

export default function Problem() {
  return (
    <Section>
      <Reveal>
        <p className="max-w-2xl font-display text-xl leading-relaxed tracking-tight text-ink md:text-[26px]">
          A maioria dos apps de treino faz uma de duas coisas: te entrega uma
          planilha fixa de 12 semanas que ignora como você realmente está
          treinando, ou vira uma rede social genérica sem nenhuma inteligência
          por trás.
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-8 max-w-2xl text-2xl leading-relaxed tracking-tight text-ink md:text-[32px]">
          O VIVECI não gera treino nenhum por você — você monta suas próprias
          rotinas, do seu jeito.{" "}
          <span className="text-action">
            O diferencial é o que ele faz com isso depois.
          </span>
        </p>
      </Reveal>
    </Section>
  );
}
