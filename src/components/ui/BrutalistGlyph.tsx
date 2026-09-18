/** Minimal çizgisel glif — SaaS ikonları yerine */
export default function BrutalistGlyph({
 className ="",
 label ="+",
}: {
 className?: string;
 label?: "+" | "×" |"·" |"◆";
}) {
 return (
 <span
 className={`inline-flex items-center justify-center font-mono text-xs leading-none text-zinc-500 ${className}`}
 aria-hidden
 >
 {label}
 </span>
 );
}
