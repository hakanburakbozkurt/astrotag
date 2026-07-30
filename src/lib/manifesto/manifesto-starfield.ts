import {
  SOCIAL_CANVAS_HEIGHT,
  SOCIAL_CANVAS_WIDTH,
  SOCIAL_COLORS,
} from "@/lib/social/constants";

export type ManifestoStarParticle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  baseOpacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
  tint: "white" | "amber" | "violet";
};

export function createManifestoStarfield(
  count = 96,
  width = SOCIAL_CANVAS_WIDTH,
  height = SOCIAL_CANVAS_HEIGHT
): ManifestoStarParticle[] {
  const particles: ManifestoStarParticle[] = [];

  for (let i = 0; i < count; i += 1) {
    const tintRoll = i % 11;
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: Math.random() * 0.55 + 0.08,
      baseOpacity: Math.random() * 0.45 + 0.15,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.04 + 0.012,
      tint: tintRoll === 0 ? "amber" : tintRoll === 1 ? "violet" : "white",
    });
  }

  return particles;
}

export function updateManifestoStarfield(
  particles: ManifestoStarParticle[],
  width = SOCIAL_CANVAS_WIDTH,
  height = SOCIAL_CANVAS_HEIGHT
): void {
  for (const particle of particles) {
    particle.x += particle.speedX;
    particle.y += particle.speedY;
    particle.twinklePhase += particle.twinkleSpeed;

    if (particle.y > height + 4) {
      particle.y = -4;
      particle.x = Math.random() * width;
    }
    if (particle.x < -4) {
      particle.x = width + 4;
    }
    if (particle.x > width + 4) {
      particle.x = -4;
    }
  }
}

function particleColor(particle: ManifestoStarParticle, alpha: number): string {
  if (particle.tint === "amber") {
    return `rgba(251,191,36,${alpha})`;
  }
  if (particle.tint === "violet") {
    return `rgba(167,139,250,${alpha})`;
  }
  return `rgba(255,255,255,${alpha})`;
}

export function drawManifestoCosmicGlow(
  ctx: CanvasRenderingContext2D,
  width = SOCIAL_CANVAS_WIDTH,
  height = SOCIAL_CANVAS_HEIGHT,
  pulse = 0
): void {
  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.22 + pulse * 12,
    20,
    width * 0.5,
    height * 0.35,
    width * 0.55
  );
  glow.addColorStop(0, `rgba(139,92,246,${0.2 + pulse * 0.06})`);
  glow.addColorStop(0.45, `rgba(251,191,36,${0.07 + pulse * 0.03})`);
  glow.addColorStop(1, "rgba(10,15,26,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

export function drawManifestoStarfield(
  ctx: CanvasRenderingContext2D,
  particles: ManifestoStarParticle[],
  width = SOCIAL_CANVAS_WIDTH,
  height = SOCIAL_CANVAS_HEIGHT,
  timeMs = 0
): void {
  ctx.fillStyle = SOCIAL_COLORS.background;
  ctx.fillRect(0, 0, width, height);

  const pulse = (Math.sin(timeMs * 0.0012) + 1) / 2;
  drawManifestoCosmicGlow(ctx, width, height, pulse);

  for (const particle of particles) {
    const twinkle =
      particle.baseOpacity * (0.55 + 0.45 * Math.sin(particle.twinklePhase));
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = particleColor(particle, twinkle);
    ctx.fill();
  }

  for (let i = 0; i < 18; i += 1) {
    const dustX = ((i * 173.7 + timeMs * 0.015) % width);
    const dustY = ((i * 97.3 + timeMs * 0.022) % height);
    ctx.beginPath();
    ctx.arc(dustX, dustY, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.08 + (i % 3) * 0.04})`;
    ctx.fill();
  }
}
