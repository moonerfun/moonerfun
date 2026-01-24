/**
 * Flywheel Integration Utility
 * 
 * Use this to notify the flywheel service when a new pool is created.
 * The flywheel service will then track this pool for fee collection,
 * buyback, and burn operations.
 */

const FLYWHEEL_API_URL = process.env.FLYWHEEL_API_URL || 'https://mooner.fun';

export interface PoolCreatedPayload {
  poolAddress: string;
  baseMint: string;
  quoteMint?: string;
  configKey?: string;
  creator: string;
  name?: string;
  symbol?: string;
}

/**
 * Notify the flywheel service that a new pool has been created
 */
export async function notifyPoolCreated(payload: PoolCreatedPayload): Promise<boolean> {
  try {
    const response = await fetch(`${FLYWHEEL_API_URL}/webhook/pool-created`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Flywheel notification failed:', await response.text());
      return false;
    }

    console.log('Pool registered with flywheel:', payload.poolAddress);
    return true;
  } catch (error) {
    // Don't fail the main operation if flywheel notification fails
    console.error('Failed to notify flywheel service:', error);
    return false;
  }
}

/**
 * Get flywheel stats
 */
export async function getFlywheelStats(): Promise<{
  total_fees_collected_sol: number;
  total_sol_used_for_buyback: number;
  total_tokens_bought: number;
  total_tokens_burned: number;
  total_pools: number;
  active_pools: number;
} | null> {
  try {
    const response = await fetch(`${FLYWHEEL_API_URL}/stats`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Get recent flywheel operations
 */
export async function getRecentOperations(): Promise<
  Array<{
    operation_type: string;
    id: string;
    amount: number;
    currency: string;
    tx_signature: string;
    executed_at: string;
  }>
> {
  try {
    const response = await fetch(`${FLYWHEEL_API_URL}/stats/recent`);
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}
