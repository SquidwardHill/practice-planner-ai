export function SparklesIcon({ saturated = false }: { saturated?: boolean }) {
  return (
    <img src="/logo/sparkle-trio.svg" alt="Sparkles" className={`h-4 w-4 ${saturated ? "filter saturate-100" : ""}`} />
  );
}
