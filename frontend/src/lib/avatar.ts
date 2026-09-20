/**
 * Cartoon Avatar Generator for CareerForge AI
 *
 * Provides high-res vector cartoon and futuristic cyberpunk robot avatars
 * via DiceBear SVG API. Perfectly matches the tech/AI career accelerator aesthetic.
 */

export interface CartoonAvatar {
  id: string;
  name: string;
  style: 'bottts' | 'adventurer' | 'lorelei';
  url: string;
}

export const CURATED_CARTOON_AVATARS: Array<{
  id: string;
  name: string;
  style: 'bottts' | 'adventurer' | 'lorelei';
}> = [
  { id: 'cyber-neon', name: 'Cyber Neon', style: 'bottts' },
  { id: 'quantum-bot', name: 'Quantum Bot', style: 'bottts' },
  { id: 'matrix-scout', name: 'Matrix Scout', style: 'bottts' },
  { id: 'pixel-hacker', name: 'Pixel Hacker', style: 'bottts' },
  { id: 'byte-samurai', name: 'Byte Samurai', style: 'bottts' },
  { id: 'astro-nova', name: 'Astro Nova', style: 'adventurer' },
  { id: 'solar-pilot', name: 'Solar Pilot', style: 'adventurer' },
  { id: 'vortex-runner', name: 'Vortex Runner', style: 'adventurer' },
  { id: 'techno-sage', name: 'Techno Sage', style: 'lorelei' },
  { id: 'cipher-punk', name: 'Cipher Punk', style: 'lorelei' },
  { id: 'synth-striker', name: 'Synth Striker', style: 'bottts' },
  { id: 'spark-droid', name: 'Spark Droid', style: 'bottts' },
];

/**
 * Generate a Dicebear animated cartoon avatar URL
 */
export function getCartoonAvatarUrl(
  seed?: string | null,
  style: 'bottts' | 'adventurer' | 'lorelei' = 'bottts'
): string {
  const cleanSeed = (seed || 'careerforge-cadet').trim().toLowerCase().replace(/\s+/g, '-');
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(
    cleanSeed
  )}&backgroundColor=0f172a,1e1b4b,172554,022c22,31104b`;
}

/**
 * Pick a random cartoon avatar from curated presets
 */
export function getRandomCartoonAvatar(): { id: string; name: string; url: string } {
  const index = Math.floor(Math.random() * CURATED_CARTOON_AVATARS.length);
  const chosen = CURATED_CARTOON_AVATARS[index];
  return {
    id: chosen.id,
    name: chosen.name,
    url: getCartoonAvatarUrl(chosen.id, chosen.style),
  };
}
