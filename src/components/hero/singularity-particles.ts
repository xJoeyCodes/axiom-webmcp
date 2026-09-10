export type SingularityQuality = "low" | "medium" | "high";

export const singularityTiers = {
  low: { particles: 4500, stars: 45, dpr: 1 },
  medium: { particles: 10000, stars: 90, dpr: 1.25 },
  high: { particles: 18000, stars: 160, dpr: 1.5 },
} as const;

export function selectSingularityQuality(
  width: number,
  cores: number,
): SingularityQuality {
  if (width < 640 || cores <= 4) return "low";
  return width >= 1200 && cores >= 8 ? "high" : "medium";
}

function random(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

/** Static orbital attributes; the vertex shader moves every particle. */
export function createAccretionParticles(count: number) {
  const positions = new Float32Array(count * 3);
  const orbits = new Float32Array(count * 4);
  for (let index = 0; index < count; index++) {
    const seed = index * 7 + 1;
    const radius = 1.02 + Math.pow(random(seed), 1.85) * 4.2;
    orbits.set(
      [
        radius,
        random(seed + 1) * Math.PI * 2,
        (random(seed + 2) + random(seed + 3) - 1) * (0.055 + radius * 0.025),
        random(seed + 4),
      ],
      index * 4,
    );
  }
  return { positions, orbits };
}

export function createSingularityStars(count: number) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index++) {
    positions.set(
      [
        (random(index * 3 + 91) - 0.5) * 23,
        (random(index * 3 + 92) - 0.5) * 14,
        -3 - random(index * 3 + 93) * 9,
      ],
      index * 3,
    );
  }
  return positions;
}
