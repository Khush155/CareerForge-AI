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
 * Automatically infers style from curated presets or falls back gracefully
 */
export function getCartoonAvatarUrl(
  seed?: string | null,
  style?: 'bottts' | 'adventurer' | 'lorelei'
): string {
  let cleanSeed = (seed || 'cyber-neon').trim().toLowerCase().replace(/\s+/g, '-');
  if (cleanSeed === 'bottts' || cleanSeed === 'careerforge-cadet') {
    cleanSeed = 'cyber-neon';
  }

  // Look up matching curated avatar definition to automatically pick its appropriate style
  const matched = CURATED_CARTOON_AVATARS.find((a) => a.id === cleanSeed);
  const resolvedStyle = style || (matched ? matched.style : 'bottts');

  return `https://api.dicebear.com/7.x/${resolvedStyle}/svg?seed=${encodeURIComponent(
    cleanSeed
  )}&backgroundColor=0f172a,1e1b4b,172554,022c22,31104b`;
}

/**
 * Pick a deterministic avatar for a profile name/id so different profiles never share the same avatar
 */
export function getAvatarForProfile(nameOrId: string, index = 0): { id: string; name: string; url: string } {
  let hash = index;
  const str = (nameOrId || 'student').trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % CURATED_CARTOON_AVATARS.length;
  }
  const chosen = CURATED_CARTOON_AVATARS[Math.abs(hash) % CURATED_CARTOON_AVATARS.length];
  return {
    id: chosen.id,
    name: chosen.name,
    url: getCartoonAvatarUrl(chosen.id, chosen.style),
  };
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
