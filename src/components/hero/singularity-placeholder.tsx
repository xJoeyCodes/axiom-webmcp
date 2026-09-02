export function SingularityPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-[430px] overflow-hidden"
    >
      <div className="absolute inset-[16%] rounded-full border border-white/10" />
      <div className="absolute inset-[29%] rounded-full border border-white/15" />
      <div className="absolute inset-[42%] rounded-full bg-white/[0.06]" />
      <div className="absolute top-1/2 right-[4%] left-[4%] h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
      <span className="text-muted absolute right-[8%] bottom-[15%] font-mono text-[9px] tracking-[0.14em]">
        VISUALIZATION / RESERVED
      </span>
    </div>
  );
}
