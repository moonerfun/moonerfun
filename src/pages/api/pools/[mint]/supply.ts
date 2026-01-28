import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '@/lib/supabase';

/**
 * API endpoint to get supply data for a specific token from the flywheel database
 * This serves as a fallback when Jupiter API doesn't have the token indexed
 */

type SupplyResponse = {
  mint: string;
  totalSupply: number | null;
  circulatingSupply: number | null;
  found: boolean;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SupplyResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { mint } = req.query;

  if (!mint || typeof mint !== 'string') {
    res.status(400).json({ error: 'Missing or invalid mint address' });
    return;
  }

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('flywheel_pools')
      .select('base_mint, total_supply, circulating_supply')
      .eq('base_mint', mint)
      .single();

    if (error || !data) {
      // Not found in database - return empty response
      res.status(200).json({
        mint,
        totalSupply: null,
        circulatingSupply: null,
        found: false,
      });
      return;
    }

    res.status(200).json({
      mint,
      totalSupply: data.total_supply ? Number(data.total_supply) : null,
      circulatingSupply: data.circulating_supply ? Number(data.circulating_supply) : null,
      found: true,
    });
  } catch (error) {
    console.error('Failed to get supply data:', error);
    res.status(500).json({ error: 'Failed to fetch supply data' });
  }
}
