"use client";

import { CheckCircle2 } from "lucide-react";
import { FormEvent, useState } from "react";
import Button from "./ui/Button";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FinalCTA() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailRegex.test(email)) {
      setErro("Digite um e-mail válido.");
      setEnviado(false);
      return;
    }

    setErro(null);
    setEnviado(true);
  }

  return (
    <Section id="cta" className="border-t border-border">
      <div className="flex flex-col items-start gap-8">
        <Reveal>
          <h2 className="max-w-xl font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            VIVECI — treine com inteligência, não com adivinhação.
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <Button href="#" variant="primary">
            Começar agora
          </Button>
        </Reveal>

        <Reveal delay={0.14} className="w-full max-w-md">
          {enviado ? (
            <div
              className="flex items-center gap-3 rounded-md border border-success/40 bg-success/10 px-4 py-3 text-sm text-success"
              role="status"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              <span>Pronto — você entrou na lista de espera.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="email-lista" className="sr-only">
                Seu e-mail
              </label>
              <input
                id="email-lista"
                type="email"
                inputMode="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={erro ? "true" : "false"}
                aria-describedby={erro ? "email-erro" : undefined}
                className="w-full flex-1 rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
              />
              <Button variant="ghost" type="submit">
                Entrar na lista de espera
              </Button>
            </form>
          )}
          {erro && (
            <p id="email-erro" className="mt-2 text-xs text-warn">
              {erro}
            </p>
          )}
        </Reveal>
      </div>
    </Section>
  );
}
