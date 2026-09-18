import { Colors } from "@/lib/manifesto/daily-cosmic-colors";

type LayerVariant = "default" | "highlight" | "muted";

const LAYER_CLASS: Record<LayerVariant, string> = {
  default: Colors.layer,
  highlight: Colors.layerHighlight,
  muted: Colors.layerMuted,
};

interface DailyCosmicLayerBlockProps {
  label: string;
  text: string;
  variant?: LayerVariant;
  highlight?: boolean;
}

export default function DailyCosmicLayerBlock({
  label,
  text,
  variant = "default",
  highlight = false,
}: DailyCosmicLayerBlockProps) {
  if (!text.trim()) {
    return null;
  }

  return (
    <article className={`p-4 ${LAYER_CLASS[variant]}`}>
      <p className={Colors.label}>{label}</p>
      <p className={`mt-2 leading-relaxed ${highlight ? Colors.bodyHighlight : Colors.body}`}>
        {text}
      </p>
    </article>
  );
}
