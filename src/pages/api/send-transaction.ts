import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, Keypair, PublicKey, sendAndConfirmRawTransaction, Transaction } from '@solana/web3.js';
import { notifyPoolCreated } from '@/lib/flywheel';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';

const RPC_URL = process.env.RPC_URL as string;

if (!RPC_URL) {
  throw new Error('Missing required environment variables');
}

type SendTransactionRequest = {
  signedTransaction: string; // base64 encoded signed transaction
  additionalSigners: Keypair[];
  // Pool info for flywheel registration
  poolInfo?: {
    baseMint: string;
    creator: string;
    name?: string;
    symbol?: string;
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('req.body', req.body);
  try {
    const { signedTransaction, additionalSigners, poolInfo } = req.body as SendTransactionRequest;

    if (!signedTransaction) {
      return res.status(400).json({ error: 'Missing signed transaction' });
    }

    const connection = new Connection(RPC_URL, 'confirmed');
    const transaction = Transaction.from(Buffer.from(signedTransaction, 'base64'));

    // if (!transaction.recentBlockhash) {
    //   const { blockhash } = await connection.getLatestBlockhash();
    //   transaction.recentBlockhash = blockhash;
    // }

    // // Simulate transaction
    // const simulation = await connection.simulateTransaction(transaction);
    // if (simulation.value.err) {
    //   throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
    // }

    // console.log('additionalSigners', additionalSigners);

    // if (additionalSigners) {
    //   additionalSigners.forEach((signer) => {
    //     transaction.sign(signer);
    //   });
    // }

    // Send transaction
    const txSignature = await sendAndConfirmRawTransaction(connection, transaction.serialize(), {
      commitment: 'confirmed',
    });

    // Register pool with flywheel for backfill tracking
    if (poolInfo) {
      try {
        // Fetch the pool address by looking it up from the baseMint
        const client = new DynamicBondingCurveClient(connection, 'confirmed');
        const poolState = await client.state.getPoolByBaseMint(new PublicKey(poolInfo.baseMint));
        
        if (poolState) {
          const poolAddress = poolState.publicKey.toBase58();
          console.log('Registering pool with flywheel:', poolAddress);
          await notifyPoolCreated({
            poolAddress,
            baseMint: poolInfo.baseMint,
            creator: poolInfo.creator,
            name: poolInfo.name,
            symbol: poolInfo.symbol,
          });
        } else {
          console.warn('Pool not found after creation, skipping flywheel registration');
        }
      } catch (flywheelError) {
        // Don't fail the request if flywheel registration fails
        console.error('Failed to register with flywheel:', flywheelError);
      }
    }

    // Wait for confirmation
    // await connection.confirmTransaction(signature, 'confirmed');

    res.status(200).json({
      success: true,
      signature: txSignature,
    });
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
