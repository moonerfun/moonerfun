import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '@/lib/supabase';

/**
 * API endpoint to get all mooner.fun pools from the database
 * This serves as a fallback/supplement when Jupiter API's 24h timeframe
 * doesn't include older tokens
 */

type PoolFromDB = {
  id: string;
  pool_address: string;
  damm_pool_address: string | null;
  base_mint: string;
  name: string | null;
  symbol: string | null;
  icon: string | null;
  is_migrated: boolean;
  status: string;
  total_fees_collected_sol: number;
  current_marketcap_usd: number | null;
  current_price_usd: number | null;
  total_supply: number | null;
  circulating_supply: number | null;
  volume_24h: number | null;
  liquidity: number | null;
  holder_count: number | null;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};

type PoolsResponse = {
  pools: PoolFromDB[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PoolsResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const {
      page = '1',
      pageSize = '50',
      status = 'all', // 'active', 'migrated', 'all'
      sortBy = 'created_at', // 'created_at', 'marketcap', 'fees'
      sortDir = 'desc',
      search, // Optional search by name/symbol
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 50));
    const offset = (pageNum - 1) * pageSizeNum;

    const supabase = getSupabase();

    // Build query
    let query = supabase
      .from('flywheel_pools')
      .select('*', { count: 'exact' });

    // Filter by status
    if (status === 'active') {
      query = query.eq('status', 'active');
    } else if (status === 'migrated') {
      query = query.eq('status', 'migrated');
    }
    // 'all' means no status filter

    // Search by name or symbol
    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,symbol.ilike.%${search}%,base_mint.eq.${search}`);
    }

    // Sorting
    const validSortFields = ['created_at', 'current_marketcap_usd', 'total_fees_collected_sol', 'updated_at'];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'created_at';
    const ascending = sortDir === 'asc';

    query = query
      .order(sortField, { ascending, nullsFirst: false })
      .range(offset, offset + pageSizeNum - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ error: 'Failed to fetch pools' });
      return;
    }

    const pools: PoolFromDB[] = (data || []).map((p: Record<string, unknown>) => ({
      id: String(p.id),
      pool_address: String(p.pool_address || ''),
      damm_pool_address: p.damm_pool_address ? String(p.damm_pool_address) : null,
      base_mint: String(p.base_mint || ''),
      name: p.name ? String(p.name) : null,
      symbol: p.symbol ? String(p.symbol) : null,
      icon: p.icon ? String(p.icon) : null,
      is_migrated: Boolean(p.is_migrated),
      status: String(p.status || 'active'),
      total_fees_collected_sol: Number(p.total_fees_collected_sol || 0),
      current_marketcap_usd: p.current_marketcap_usd ? Number(p.current_marketcap_usd) : null,
      current_price_usd: p.current_price_usd ? Number(p.current_price_usd) : null,
      total_supply: p.total_supply ? Number(p.total_supply) : null,
      circulating_supply: p.circulating_supply ? Number(p.circulating_supply) : null,
      volume_24h: p.volume_24h ? Number(p.volume_24h) : null,
      liquidity: p.liquidity ? Number(p.liquidity) : null,
      holder_count: p.holder_count ? Number(p.holder_count) : null,
      twitter: p.twitter ? String(p.twitter) : null,
      telegram: p.telegram ? String(p.telegram) : null,
      website: p.website ? String(p.website) : null,
      created_at: String(p.created_at || ''),
      updated_at: String(p.updated_at || ''),
    }));

    const total = count || 0;
    const hasMore = offset + pools.length < total;

    res.status(200).json({
      pools,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      hasMore,
    });
  } catch (error) {
    console.error('Failed to get pools:', error);
    res.status(500).json({ error: 'Failed to fetch pools' });
  }
}
