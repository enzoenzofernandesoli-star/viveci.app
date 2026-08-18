export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-container flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center md:px-10">
        <div>
          <p className="text-sm font-bold tracking-widest text-ink">VIVECI</p>
          <p className="mt-1 text-xs text-muted">Vim. Vi. Venci.</p>
        </div>

        <ul className="flex items-center gap-6 text-xs text-muted">
          <li>
            <a href="#" className="transition-colors hover:text-ink">
              Privacidade
            </a>
          </li>
          <li>
            <a href="#" className="transition-colors hover:text-ink">
              Termos
            </a>
          </li>
        </ul>

        <p className="text-xs text-muted">© {ano} VIVECI</p>
      </div>
    </footer>
  );
}
