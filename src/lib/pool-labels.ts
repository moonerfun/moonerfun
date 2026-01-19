/**
 * Pool Label Utilities
 * 
 * Determines whether a pool is "legacy" or "regular" based on creation date.
 * Since the Jupiter API doesn't return the config key directly, we use the
 * creation timestamp as a heuristic - pools created before the cutoff date
 * are considered "legacy".
 */

export type PoolLabel = 'legacy' | 'regular' | null;

// Environment variables for pool config identification
const LEGACY_POOL_CONFIG = process.env.NEXT_PUBLIC_LEGACY_POOL_CONFIG;
const REGULAR_POOL_CONFIG = process.env.NEXT_PUBLIC_REGULAR_POOL_CONFIG;
const LEGACY_CUTOFF_DATE = process.env.NEXT_PUBLIC_LEGACY_CUTOFF_DATE;

/**
 * Get the pool label based on creation date
 * @param createdAt - ISO date string of when the pool was created
 * @returns 'legacy' | 'regular' | null
 */
export function getPoolLabel(createdAt: string | undefined): PoolLabel {
  if (!createdAt || !LEGACY_CUTOFF_DATE) {
    return null;
  }

  const poolDate = new Date(createdAt);
  const cutoffDate = new Date(LEGACY_CUTOFF_DATE);

  if (poolDate < cutoffDate) {
    return 'legacy';
  }

  return 'regular';
}

/**
 * Check if legacy/regular labels are enabled
 */
export function isPoolLabelsEnabled(): boolean {
  return !!(LEGACY_POOL_CONFIG && REGULAR_POOL_CONFIG && LEGACY_CUTOFF_DATE);
}

/**
 * Get label display configuration
 */
export function getPoolLabelConfig(label: PoolLabel): {
  text: string;
  className: string;
} | null {
  if (!label) return null;

  switch (label) {
    case 'legacy':
      return {
        text: 'Legacy',
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      };
    case 'regular':
      return {
        text: 'V2',
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      };
    default:
      return null;
  }
}
