import { NextApiRequest, NextApiResponse } from 'next';

// Server-side only RPC URL - never exposed to client
const RPC_URL = process.env.RPC_URL as string;

if (!RPC_URL) {
  console.error('Missing RPC_URL environment variable');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!RPC_URL) {
    return res.status(500).json({ error: 'RPC not configured' });
  }

  try {
    // Forward the JSON-RPC request to the actual RPC endpoint
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    // Forward the response back to the client
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('RPC proxy error:', error);
    res.status(500).json({ 
      jsonrpc: '2.0',
      error: { 
        code: -32603, 
        message: 'Internal error' 
      },
      id: req.body?.id || null
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
