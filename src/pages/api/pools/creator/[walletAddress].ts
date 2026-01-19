import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '@/lib/supabase';

type Pool = {
  id: string;
  pool_address: string;
  damm_pool_address: string | null;
  base_mint: string;
  name: string | null;
  symbol: string | null;
  is_migrated: boolean;
  rewards_available: boolean;
  total_fees_collected_sol: number;
  created_at: string;
  current_marketcap_usd?: number;
  current_price_usd?: number;
  status?: string;
};

type CreatorPoolsResponse = {
  pools: Pool[];
  total_pools: number;
  migrated_pools: number;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreatorPoolsResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { walletAddress } = req.query;

  if (!walletAddress || typeof walletAddress !== 'string') {
    res.status(400).json({ error: 'Wallet address required' });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('flywheel_pools')
      .select('*')
      .eq('creator', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ error: 'Failed to fetch pools' });
      return;
    }

    const pools = (data || []) as Array<Record<string, unknown>>;
    const migratedPools = pools.filter((p) => p.is_migrated === true);

    res.status(200).json({
      pools: pools.map((p) => ({
        id: String(p.id),
        pool_address: String(p.pool_address || ''),
        damm_pool_address: p.damm_pool_address ? String(p.damm_pool_address) : null,
        base_mint: String(p.base_mint || ''),
        name: p.name ? String(p.name) : null,
        symbol: p.symbol ? String(p.symbol) : null,
        is_migrated: Boolean(p.is_migrated),
        rewards_available: Boolean(p.is_migrated),
        total_fees_collected_sol: Number(p.total_fees_collected_sol || 0),
        created_at: String(p.created_at || ''),
        current_marketcap_usd: p.current_marketcap_usd ? Number(p.current_marketcap_usd) : undefined,
        current_price_usd: p.current_price_usd ? Number(p.current_price_usd) : undefined,
        status: p.status ? String(p.status) : undefined,
      })),
      total_pools: pools.length,
      migrated_pools: migratedPools.length,
    });
  } catch (error) {
    console.error('Failed to get creator pools:', error);
    res.status(500).json({ error: 'Failed to fetch creator pools' });
  }
}
