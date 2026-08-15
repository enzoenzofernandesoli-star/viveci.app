export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-brand">V</span>iveci
    </span>
  )
}
