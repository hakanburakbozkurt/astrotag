"use client";

import { useEffect, useRef } from "react";

type StarfieldVariant = "default" | "sales";

interface StarfieldProps {
  variant?: StarfieldVariant;
}

interface StarfieldProfile {
  maxStaticStars: number;
  maxForegroundStars: number;
  shootingStarsEnabled: boolean;
  shootingIntervalMin: number;
  shootingIntervalMax: number;
  animate: boolean;
  twinkleEnabled: boolean;
  shadowEnabled: boolean;
}

const DEFAULT_MAX_STATIC_STARS = 50;
const DEFAULT_MAX_FOREGROUND_STARS = 6;
const SHOOTING_STAR_INTERVAL_MIN = 3000;
const SHOOTING_STAR_INTERVAL_MAX = 5000;

type StaticLayer = "background" | "midground" | "foreground";
type ShootingDepth = "near" | "far";

interface LayerPreset {
  layer: StaticLayer;
  share: number;
  sizeMin: number;
  sizeMax: number;
  opacityMin: number;
  opacityMax: number;
  speedXMin: number;
  speedXMax: number;
  speedYMin: number;
  speedYMax: number;
  grayMin: number;
  grayMax: number;
}

interface StaticStar {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  gray: number;
  layer: StaticLayer;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface ShootingPreset {
  speedMin: number;
  speedMax: number;
  trailLength: number;
  headSizeMin: number;
  headSizeMax: number;
  trailAlpha: number;
  headAlpha: number;
  glowAlpha: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  maxTrail: number;
  headSize: number;
  depth: ShootingDepth;
  trailAlpha: number;
  headAlpha: number;
  glowAlpha: number;
}

const STATIC_PRESETS: LayerPreset[] = [
  {
    layer: "background",
    share: 0.52,
    sizeMin: 0.25,
    sizeMax: 0.55,
    opacityMin: 0.05,
    opacityMax: 0.14,
    speedXMin: -0.015,
    speedXMax: 0.015,
    speedYMin: 0.012,
    speedYMax: 0.04,
    grayMin: 155,
    grayMax: 195,
  },
  {
    layer: "midground",
    share: 0.38,
    sizeMin: 0.55,
    sizeMax: 1.2,
    opacityMin: 0.14,
    opacityMax: 0.32,
    speedXMin: -0.03,
    speedXMax: 0.03,
    speedYMin: 0.035,
    speedYMax: 0.09,
    grayMin: 185,
    grayMax: 225,
  },
  {
    layer: "foreground",
    share: 0.1,
    sizeMin: 1.6,
    sizeMax: 2.6,
    opacityMin: 0.55,
    opacityMax: 0.75,
    speedXMin: -0.05,
    speedXMax: 0.05,
    speedYMin: 0.1,
    speedYMax: 0.2,
    grayMin: 220,
    grayMax: 255,
  },
];

const SHOOTING_PRESETS: Record<ShootingDepth, ShootingPreset> = {
  far: {
    speedMin: 4,
    speedMax: 7.5,
    trailLength: 10,
    headSizeMin: 0.7,
    headSizeMax: 1.2,
    trailAlpha: 0.45,
    headAlpha: 0.65,
    glowAlpha: 0.12,
  },
  near: {
    speedMin: 10,
    speedMax: 16,
    trailLength: 24,
    headSizeMin: 2,
    headSizeMax: 2.8,
    trailAlpha: 0.9,
    headAlpha: 0.98,
    glowAlpha: 0.4,
  },
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createStaticStar(
  width: number,
  height: number,
  preset: LayerPreset
): StaticStar {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: randomBetween(preset.sizeMin, preset.sizeMax),
    speedX: randomBetween(preset.speedXMin, preset.speedXMax),
    speedY: randomBetween(preset.speedYMin, preset.speedYMax),
    gray: Math.floor(randomBetween(preset.grayMin, preset.grayMax)),
    layer: preset.layer,
    baseOpacity: randomBetween(preset.opacityMin, preset.opacityMax),
    twinkleSpeed: randomBetween(0.012, 0.028),
    twinklePhase: Math.random() * Math.PI * 2,
  };
}

function resolveStarfieldProfile(
  variant: StarfieldVariant,
  width: number,
  reducedMotion: boolean
): StarfieldProfile {
  if (variant === "default") {
    return {
      maxStaticStars: DEFAULT_MAX_STATIC_STARS,
      maxForegroundStars: DEFAULT_MAX_FOREGROUND_STARS,
      shootingStarsEnabled: true,
      shootingIntervalMin: SHOOTING_STAR_INTERVAL_MIN,
      shootingIntervalMax: SHOOTING_STAR_INTERVAL_MAX,
      animate: !reducedMotion,
      twinkleEnabled: true,
      shadowEnabled: true,
    };
  }

  if (reducedMotion) {
    return {
      maxStaticStars: 14,
      maxForegroundStars: 1,
      shootingStarsEnabled: false,
      shootingIntervalMin: 999_999,
      shootingIntervalMax: 999_999,
      animate: false,
      twinkleEnabled: false,
      shadowEnabled: false,
    };
  }

  const isMobile = width < 768;

  if (isMobile) {
    return {
      maxStaticStars: 18,
      maxForegroundStars: 2,
      shootingStarsEnabled: false,
      shootingIntervalMin: 999_999,
      shootingIntervalMax: 999_999,
      animate: true,
      twinkleEnabled: false,
      shadowEnabled: false,
    };
  }

  return {
    maxStaticStars: 32,
    maxForegroundStars: 4,
    shootingStarsEnabled: true,
    shootingIntervalMin: 6000,
    shootingIntervalMax: 9000,
    animate: true,
    twinkleEnabled: true,
    shadowEnabled: false,
  };
}

function buildStaticStars(
  width: number,
  height: number,
  profile: StarfieldProfile
): StaticStar[] {
  const total = Math.min(
    profile.maxStaticStars,
    Math.max(12, Math.floor((width * height) / 16000))
  );

  const stars: StaticStar[] = [];
  let assigned = 0;

  STATIC_PRESETS.forEach((preset, index) => {
    const isLast = index === STATIC_PRESETS.length - 1;
    let layerCount = isLast
      ? total - assigned
      : Math.floor(total * preset.share);

    if (preset.layer === "foreground") {
      layerCount = Math.min(profile.maxForegroundStars, Math.max(1, layerCount));
    }

    assigned += layerCount;

    for (let i = 0; i < layerCount; i += 1) {
      stars.push(createStaticStar(width, height, preset));
    }
  });

  return stars;
}

function spawnShootingStar(width: number, height: number): ShootingStar {
  const depth: ShootingDepth = Math.random() < 0.38 ? "near" : "far";
  const preset = SHOOTING_PRESETS[depth];

  const angleRad = randomBetween(0, Math.PI);
  const speed = randomBetween(preset.speedMin, preset.speedMax);
  let vx = Math.cos(angleRad) * speed;
  let vy = Math.sin(angleRad) * speed;

  const edge = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  switch (edge) {
    case 0:
      x = randomBetween(0, width);
      y = randomBetween(-40, -8);
      if (vy < 0.5) vy = Math.abs(vy) + 0.5;
      break;
    case 1:
      x = randomBetween(width + 8, width + 40);
      y = randomBetween(0, height);
      if (vx > -0.5) vx = -Math.abs(vx) - 0.5;
      break;
    case 2:
      x = randomBetween(0, width);
      y = randomBetween(height + 8, height + 40);
      if (vy > -0.5) vy = -Math.abs(vy) - 0.5;
      break;
    default:
      x = randomBetween(-40, -8);
      y = randomBetween(0, height);
      if (vx < 0.5) vx = Math.abs(vx) + 0.5;
      break;
  }

  return {
    x,
    y,
    vx,
    vy,
    trail: [{ x, y }],
    maxTrail: preset.trailLength,
    headSize: randomBetween(preset.headSizeMin, preset.headSizeMax),
    depth,
    trailAlpha: preset.trailAlpha,
    headAlpha: preset.headAlpha,
    glowAlpha: preset.glowAlpha,
  };
}

function isShootingStarOffscreen(
  star: ShootingStar,
  width: number,
  height: number
) {
  const margin = 80;
  return (
    star.x < -margin ||
    star.x > width + margin ||
    star.y < -margin ||
    star.y > height + margin
  );
}

function wrapStaticStar(star: StaticStar, width: number, height: number) {
  if (star.x < -star.size) star.x = width + star.size;
  if (star.x > width + star.size) star.x = -star.size;
  if (star.y > height + star.size) {
    star.y = -star.size;
    star.x = Math.random() * width;
  }
  if (star.y < -star.size) {
    star.y = height + star.size;
    star.x = Math.random() * width;
  }
}

export default function Starfield({ variant = "default" }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let staticStars: StaticStar[] = [];
    let shootingStars: ShootingStar[] = [];
    let rafId = 0;
    let running = false;
    let time = 0;
    let nextShootingStarAt = 0;
    let profile = resolveStarfieldProfile(variant, window.innerWidth, false);

    const scheduleNextShootingStar = (from = performance.now()) => {
      nextShootingStarAt =
        from + randomBetween(profile.shootingIntervalMin, profile.shootingIntervalMax);
    };

    const drawBackground = () => {
      ctx.fillStyle = "#030614";
      ctx.fillRect(0, 0, width, height);
    };

    const drawStaticLayer = (layer: StaticLayer) => {
      for (const star of staticStars) {
        if (star.layer !== layer) continue;

        if (profile.animate) {
          star.x += star.speedX;
          star.y += star.speedY;
          wrapStaticStar(star, width, height);
        }

        let opacity = star.baseOpacity;

        if (layer === "foreground" && profile.twinkleEnabled) {
          opacity = 0.5 + 0.3 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        }

        ctx.beginPath();

        if (layer === "foreground" && profile.shadowEnabled) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(255, 255, 255, 0.55)";
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = `rgba(${star.gray}, ${star.gray}, ${star.gray}, ${opacity})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const drawShootingStarVisual = (star: ShootingStar) => {
      const trail = star.trail;
      const trailBoost = star.depth === "near" ? 1 : 0.55;

      for (let i = trail.length - 1; i > 0; i -= 1) {
        const t = i / (trail.length - 1);
        const alpha = t * star.trailAlpha * trailBoost;
        const lineWidth = star.depth === "near" ? 0.5 + t * 1.4 : 0.25 + t * 0.55;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(150, 195, 255, ${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.moveTo(trail[i].x, trail[i].y);
        ctx.lineTo(trail[i - 1].x, trail[i - 1].y);
        ctx.stroke();
      }

      if (star.depth === "near") {
        ctx.shadowBlur = 14;
        ctx.shadowColor = "rgba(170, 215, 255, 0.65)";
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(210, 235, 255, ${star.headAlpha})`;
      ctx.arc(star.x, star.y, star.headSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.fillStyle = `rgba(130, 185, 255, ${star.glowAlpha})`;
      ctx.arc(
        star.x,
        star.y,
        star.headSize * (star.depth === "near" ? 2.4 : 1.6),
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const updateShootingStars = () => {
      for (const star of shootingStars) {
        star.x += star.vx;
        star.y += star.vy;

        star.trail.unshift({ x: star.x, y: star.y });
        if (star.trail.length > star.maxTrail) {
          star.trail.length = star.maxTrail;
        }
      }

      shootingStars = shootingStars.filter(
        (star) => !isShootingStarOffscreen(star, width, height)
      );
    };

    const updateAndDraw = () => {
      if (profile.shootingStarsEnabled && time >= nextShootingStarAt) {
        shootingStars.push(spawnShootingStar(width, height));
        scheduleNextShootingStar(time);
      }

      if (profile.shootingStarsEnabled) {
        updateShootingStars();
      }

      drawBackground();
      drawStaticLayer("background");
      drawStaticLayer("midground");

      for (const star of shootingStars) {
        if (star.depth === "far") drawShootingStarVisual(star);
      }

      drawStaticLayer("foreground");

      for (const star of shootingStars) {
        if (star.depth === "near") drawShootingStarVisual(star);
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, variant === "sales" ? 1.5 : 2);
      profile = resolveStarfieldProfile(
        variant,
        width,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      staticStars = buildStaticStars(width, height, profile);
      shootingStars = [];
      scheduleNextShootingStar();

      if (!profile.animate) {
        drawBackground();
        drawStaticLayer("background");
        drawStaticLayer("midground");
        drawStaticLayer("foreground");
      }
    };

    const tick = (now: number) => {
      if (!running) return;
      time = now;
      updateAndDraw();
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || !profile.animate) return;
      running = true;
      scheduleNextShootingStar();
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else if (profile.animate) {
        scheduleNextShootingStar();
        start();
      }
    };

    resize();
    start();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
