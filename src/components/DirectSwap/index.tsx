import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Connection, PublicKey, VersionedTransaction, TransactionMessage } from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { 
  CpAmm, 
  swapQuoteExactInput, 
  getCurrentPoint, 
  PoolState as CpAmmPoolState,
  ActivationType,
  deriveTokenVaultAddress,
  getTokenProgram,
  deriveCustomizablePoolAddress,
} from '@meteora-ag/cp-amm-sdk';
import { NATIVE_MINT, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';
import BN from 'bn.js';
import { toast } from 'sonner';
import { Skeleton } from '../ui/Skeleton';
import { useTokenInfo } from '@/hooks/queries';

// Custom fetch that proxies RPC requests through our API to hide the API key
const proxyFetch: typeof fetch = async (input, init) => {
  // Only proxy JSON-RPC requests (POST with JSON body)
  if (typeof window !== 'undefined' && init?.method === 'POST') {
    const proxyUrl = '/api/rpc';
    return fetch(proxyUrl, init);
  }
  return fetch(input, init);
};

// Use public RPC URL for Connection (the actual API key is hidden via proxy fetch)
const RPC_ENDPOINT = 'https://api.devnet.solana.com';

// Create a shared connection instance with custom fetch to proxy requests
const sharedConnection = new Connection(RPC_ENDPOINT, {
  commitment: 'confirmed',
  fetch: proxyFetch,
});

interface DirectSwapProps {
  mint: string;
}

type PoolType = 'dbc' | 'damm2';

interface PoolInfo {
  poolType: PoolType;
  poolAddress: PublicKey;
  quoteMint: PublicKey;
  baseMint: PublicKey;
  quoteDecimals: number;
  baseDecimals: number;
  quoteSymbol: string;
  baseSymbol: string;
  quoteBalance: BN;
  baseBalance: BN;
  isGraduated: boolean;
  migrationQuoteThreshold: BN;
  // DAMM v2 specific
  dammPoolState?: CpAmmPoolState;
}

interface SwapQuoteResult {
  amountOut: BN;
  minimumAmountOut: BN;
  fee: BN;
  priceImpact: number;
}

// Shared clients to avoid recreation
const sharedDbcClient = new DynamicBondingCurveClient(sharedConnection, 'confirmed');
const sharedCpAmmClient = new CpAmm(sharedConnection);

export function DirectSwap({ mint }: DirectSwapProps) {
  const { publicKey, signTransaction, connected } = useWallet();
  const { data: tokenInfo } = useTokenInfo();
  
  // Use shared instances
  const connection = sharedConnection;
  const dbcClient = sharedDbcClient;
  const cpAmmClient = sharedCpAmmClient;
  
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Swap form state
  const [isBuying, setIsBuying] = useState(true);
  const [inputAmount, setInputAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuoteResult | null>(null);
  const [slippageBps, setSlippageBps] = useState(100); // 1% default
  
  // User balances
  const [userQuoteBalance, setUserQuoteBalance] = useState<BN>(new BN(0));
  const [userBaseBalance, setUserBaseBalance] = useState<BN>(new BN(0));

  // Refs to prevent duplicate fetches
  const fetchingRef = useRef(false);
  const lastMintRef = useRef<string | null>(null);
  const hasFetchedRef = useRef(false);
  
  // Get token symbol from tokenInfo (stable reference via useMemo)
  const baseSymbol = useMemo(() => tokenInfo?.baseAsset?.symbol || 'TOKEN', [tokenInfo?.baseAsset?.symbol]);

  // Fetch pool info - try DBC first, then DAMM v2
  const fetchPoolInfo = useCallback(async (forceRefresh = false) => {
    // Prevent duplicate fetches
    if (fetchingRef.current) return;
    if (!forceRefresh && hasFetchedRef.current && lastMintRef.current === mint) return;
    if (!mint) return;
    
    fetchingRef.current = true;
    lastMintRef.current = mint;
    setIsLoading(true);
    setError(null);
    
    try {
      const baseMintPubkey = new PublicKey(mint);
      
      // Try DBC first
      const poolState = await dbcClient.state.getPoolByBaseMint(baseMintPubkey);
      
      if (poolState && !poolState.account.isMigrated) {
        // Pool is still on DBC
        const poolConfig = await dbcClient.state.getPoolConfig(poolState.account.config);
        if (!poolConfig) {
          setError('Pool config not found');
          return;
        }

        // Get token decimals
        const quoteMint = poolConfig.quoteMint;
        const quoteMintInfo = await connection.getParsedAccountInfo(quoteMint);
        const quoteDecimals = (quoteMintInfo.value?.data as any)?.parsed?.info?.decimals ?? 9;
        
        const baseMintInfo = await connection.getParsedAccountInfo(baseMintPubkey);
        const baseDecimals = (baseMintInfo.value?.data as any)?.parsed?.info?.decimals ?? 6;

        const quoteSymbol = quoteMint.equals(NATIVE_MINT) ? 'SOL' : 'QUOTE';

        setPoolInfo({
          poolType: 'dbc',
          poolAddress: poolState.publicKey,
          quoteMint,
          baseMint: baseMintPubkey,
          quoteDecimals,
          baseDecimals,
          quoteSymbol,
          baseSymbol,
          quoteBalance: poolState.account.quoteReserve,
          baseBalance: poolState.account.baseReserve,
          isGraduated: false,
          migrationQuoteThreshold: poolConfig.migrationQuoteThreshold,
        });
        hasFetchedRef.current = true;
        return;
      }

  
      let dammPool: { publicKey: PublicKey; account: CpAmmPoolState } | null = null;
      
      // First, try to derive the customizable pool address directly
      // When DBC migrates, it creates a customizable pool with base token as tokenA and SOL as tokenB
      try {
        const derivedPoolAddress = deriveCustomizablePoolAddress(baseMintPubkey, NATIVE_MINT);
        
        const poolAccount = await cpAmmClient.fetchPoolState(derivedPoolAddress);
        if (poolAccount) {
          dammPool = { publicKey: derivedPoolAddress, account: poolAccount };
        }
      } catch (e) {
      }
      
      // If not found, try searching by tokenA mint
      if (!dammPool) {
        const dammPools = await cpAmmClient.fetchPoolStatesByTokenAMint(baseMintPubkey);
        if (dammPools.length > 0) {
          dammPool = dammPools[0];
        }
      }
      
      // Also try with reversed order (SOL as tokenA, base as tokenB)
      if (!dammPool) {
        try {
          const derivedPoolAddressReversed = deriveCustomizablePoolAddress(NATIVE_MINT, baseMintPubkey);
          
          const poolAccount = await cpAmmClient.fetchPoolState(derivedPoolAddressReversed);
          if (poolAccount) {
            dammPool = { publicKey: derivedPoolAddressReversed, account: poolAccount };
          }
        } catch (e) {
        }
      }

      if (dammPool) {
        const poolAccount = dammPool.account;
        
        // Determine which token is quote (usually SOL) and which is base
        const isTokenABase = poolAccount.tokenAMint.equals(baseMintPubkey);
        const quoteMint = isTokenABase ? poolAccount.tokenBMint : poolAccount.tokenAMint;
        
        // Get decimals
        const quoteMintInfo = await connection.getParsedAccountInfo(quoteMint);
        const quoteDecimals = (quoteMintInfo.value?.data as any)?.parsed?.info?.decimals ?? 9;
        
        const baseMintInfo = await connection.getParsedAccountInfo(baseMintPubkey);
        const baseDecimals = (baseMintInfo.value?.data as any)?.parsed?.info?.decimals ?? 6;

        const quoteSymbol = quoteMint.equals(NATIVE_MINT) ? 'SOL' : 'QUOTE';

        // Get reserves from vault token accounts
        const tokenAVault = deriveTokenVaultAddress(poolAccount.tokenAMint, dammPool.publicKey);
        const tokenBVault = deriveTokenVaultAddress(poolAccount.tokenBMint, dammPool.publicKey);
        
        let tokenABalance = new BN(0);
        let tokenBBalance = new BN(0);
        
        try {
          const tokenAVaultAccount = await getAccount(connection, tokenAVault);
          tokenABalance = new BN(tokenAVaultAccount.amount.toString());
        } catch (e) {
          console.warn('Could not fetch tokenA vault balance');
        }
        
        try {
          const tokenBVaultAccount = await getAccount(connection, tokenBVault);
          tokenBBalance = new BN(tokenBVaultAccount.amount.toString());
        } catch (e) {
          console.warn('Could not fetch tokenB vault balance');
        }
        
        const quoteReserve = isTokenABase ? tokenBBalance : tokenABalance;
        const baseReserve = isTokenABase ? tokenABalance : tokenBBalance;

        setPoolInfo({
          poolType: 'damm2',
          poolAddress: dammPool.publicKey,
          quoteMint,
          baseMint: baseMintPubkey,
          quoteDecimals,
          baseDecimals,
          quoteSymbol,
          baseSymbol,
          quoteBalance: quoteReserve,
          baseBalance: baseReserve,
          isGraduated: true,
          migrationQuoteThreshold: new BN(0),
          dammPoolState: poolAccount,
        });
        hasFetchedRef.current = true;
        return;
      }

      // No pool found anywhere
      setError('Pool not found. Token may not be traded yet.');
      setPoolInfo(null);
      
    } catch (err: any) {
      console.error('Error fetching pool info:', err);
      setError(err.message || 'Failed to fetch pool info');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [mint, baseSymbol]);

  // Fetch user balances
  const fetchUserBalances = useCallback(async () => {
    if (!publicKey || !poolInfo) return;
    
    try {
      // Quote balance (SOL or other token)
      if (poolInfo.quoteMint.equals(NATIVE_MINT)) {
        const balance = await connection.getBalance(publicKey);
        setUserQuoteBalance(new BN(balance));
      } else {
        try {
          const ata = await getAssociatedTokenAddress(poolInfo.quoteMint, publicKey);
          const account = await getAccount(connection, ata);
          setUserQuoteBalance(new BN(account.amount.toString()));
        } catch (e) {
          if (e instanceof TokenAccountNotFoundError) {
            setUserQuoteBalance(new BN(0));
          }
        }
      }

      // Base token balance
      try {
        const ata = await getAssociatedTokenAddress(poolInfo.baseMint, publicKey);
        const account = await getAccount(connection, ata);
        setUserBaseBalance(new BN(account.amount.toString()));
      } catch (e) {
        if (e instanceof TokenAccountNotFoundError) {
          setUserBaseBalance(new BN(0));
        }
      }
    } catch (err) {
      console.error('Error fetching user balances:', err);
    }
  }, [publicKey, poolInfo?.quoteMint?.toString(), poolInfo?.baseMint?.toString()]);

  // Get swap quote - handles both DBC and DAMM v2
  const getSwapQuote = useCallback(async () => {
    if (!poolInfo || !inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      return;
    }

    try {
      const inputDecimals = isBuying ? poolInfo.quoteDecimals : poolInfo.baseDecimals;
      const amountIn = new BN(Math.floor(parseFloat(inputAmount) * 10 ** inputDecimals));

      if (poolInfo.poolType === 'dbc') {
        // DBC quote
        const poolState = await dbcClient.state.getPoolByBaseMint(poolInfo.baseMint);
        if (!poolState) return;

        const poolConfig = await dbcClient.state.getPoolConfig(poolState.account.config);
        if (!poolConfig) return;

        let currentPoint: number;
        if (poolConfig.activationType === 0) {
          currentPoint = await connection.getSlot();
        } else {
          const slot = await connection.getSlot();
          const blockTime = await connection.getBlockTime(slot);
          currentPoint = blockTime || Math.floor(Date.now() / 1000);
        }

        const quoteResult = await dbcClient.pool.swapQuote({
          virtualPool: poolState.account,
          config: poolConfig,
          swapBaseForQuote: !isBuying,
          amountIn,
          hasReferral: false,
          currentPoint: new BN(currentPoint),
        });

        // Calculate price impact
        const currentRatio = poolInfo.quoteBalance.toNumber() / Math.max(poolInfo.baseBalance.toNumber(), 1);
        const newRatio = isBuying 
          ? (poolInfo.quoteBalance.toNumber() + amountIn.toNumber()) / Math.max(poolInfo.baseBalance.toNumber() - quoteResult.outputAmount.toNumber(), 1)
          : (poolInfo.quoteBalance.toNumber() - quoteResult.outputAmount.toNumber()) / Math.max(poolInfo.baseBalance.toNumber() + amountIn.toNumber(), 1);
        const priceImpact = Math.abs((newRatio - currentRatio) / currentRatio) * 100;

        setQuote({
          amountOut: quoteResult.outputAmount,
          minimumAmountOut: quoteResult.minimumAmountOut,
          fee: quoteResult.tradingFee,
          priceImpact: Math.min(priceImpact, 100),
        });
      } else if (poolInfo.poolType === 'damm2' && poolInfo.dammPoolState) {
        // DAMM v2 quote
        const poolState = poolInfo.dammPoolState;
        
        // Determine trade direction based on which token is being sold
        const isTokenABase = poolState.tokenAMint.equals(poolInfo.baseMint);
        // aToB = true means selling tokenA for tokenB
        // For buying base (selling quote for base):
        //   - if tokenA is base: aToB = false (we're buying A, selling B)
        //   - if tokenB is base: aToB = true (we're buying B, selling A)
        // For selling base (selling base for quote):
        //   - if tokenA is base: aToB = true (we're selling A for B)
        //   - if tokenB is base: aToB = false (we're selling B for A)
        const aToB = isBuying ? !isTokenABase : isTokenABase;
        
        // Get current point based on pool's activation type
        const activationType = poolState.activationType as ActivationType;
        const currentPointBN = await getCurrentPoint(connection, activationType);

        const quoteResult = swapQuoteExactInput(
          poolState,
          currentPointBN,
          amountIn,
          slippageBps / 10000, // Convert bps to decimal
          aToB,
          false, // hasReferral
          isTokenABase ? poolInfo.baseDecimals : poolInfo.quoteDecimals, // tokenADecimal
          isTokenABase ? poolInfo.quoteDecimals : poolInfo.baseDecimals, // tokenBDecimal
        );

        // Quote2Result has outputAmount and minimumAmountOut from SwapResult2
        // includedFeeInputAmount represents the fee
        setQuote({
          amountOut: quoteResult.outputAmount,
          minimumAmountOut: quoteResult.minimumAmountOut ?? quoteResult.outputAmount,
          fee: quoteResult.includedFeeInputAmount,
          priceImpact: quoteResult.priceImpact.toNumber(),
        });
      }
    } catch (err: any) {
      // Handle specific errors gracefully without logging
      const errMessage = err?.message || '';
      if (errMessage.includes('Amount out must be greater than 0') || 
          errMessage.includes('Swap is disabled')) {
        // Input amount too small to produce any output - just clear quote
        setQuote(null);
        return;
      }
      console.error('Error getting quote:', err);
      setQuote(null);
    }
  }, [poolInfo, inputAmount, isBuying, slippageBps]);

  // Execute swap - handles both DBC and DAMM v2
  const executeSwap = useCallback(async () => {
    if (!publicKey || !signTransaction || !poolInfo || !quote || !inputAmount) {
      toast.error('Missing required parameters for swap');
      return;
    }

    setIsSwapping(true);
    
    try {
      const inputDecimals = isBuying ? poolInfo.quoteDecimals : poolInfo.baseDecimals;
      const amountIn = new BN(Math.floor(parseFloat(inputAmount) * 10 ** inputDecimals));

      let txSignature: string;

      if (poolInfo.poolType === 'dbc') {
        // DBC swap
        const swapTx = await dbcClient.pool.swap({
          amountIn,
          minimumAmountOut: quote.minimumAmountOut,
          owner: publicKey,
          pool: poolInfo.poolAddress,
          swapBaseForQuote: !isBuying,
          referralTokenAccount: null,
        });

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        swapTx.recentBlockhash = blockhash;
        swapTx.feePayer = publicKey;

        // Check if user needs ATA for base token (when buying)
        if (isBuying) {
          const ata = await getAssociatedTokenAddress(poolInfo.baseMint, publicKey);
          try {
            await getAccount(connection, ata);
          } catch (e) {
            if (e instanceof TokenAccountNotFoundError) {
              const createAtaIx = createAssociatedTokenAccountInstruction(
                publicKey,
                ata,
                publicKey,
                poolInfo.baseMint
              );
              swapTx.instructions.unshift(createAtaIx);
            }
          }
        }

        const simulation = await connection.simulateTransaction(swapTx);
        if (simulation.value.err) {
          throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }

        const signedTx = await signTransaction(swapTx);
        
        txSignature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
          maxRetries: 3,
        });

        toast.loading('Confirming transaction...', { id: 'swap-confirm' });

        await connection.confirmTransaction({
          signature: txSignature,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');

      } else if (poolInfo.poolType === 'damm2' && poolInfo.dammPoolState) {
        // DAMM v2 swap
        const poolState = poolInfo.dammPoolState;
        
        // Derive vault addresses (returns PublicKey directly, not tuple)
        const tokenAVault = deriveTokenVaultAddress(poolState.tokenAMint, poolInfo.poolAddress);
        const tokenBVault = deriveTokenVaultAddress(poolState.tokenBMint, poolInfo.poolAddress);
        
        // Get token programs from pool state flags
        const tokenAProgram = getTokenProgram(poolState.tokenAFlag);
        const tokenBProgram = getTokenProgram(poolState.tokenBFlag);
        
        console.log('DAMM v2 swap params:', {
          pool: poolInfo.poolAddress.toString(),
          tokenAMint: poolState.tokenAMint.toString(),
          tokenBMint: poolState.tokenBMint.toString(),
          tokenAVault: tokenAVault.toString(),
          tokenBVault: tokenBVault.toString(),
          tokenAProgram: tokenAProgram.toString(),
          tokenBProgram: tokenBProgram.toString(),
          inputMint: (isBuying ? poolInfo.quoteMint : poolInfo.baseMint).toString(),
          outputMint: (isBuying ? poolInfo.baseMint : poolInfo.quoteMint).toString(),
        });

        // Build swap transaction using cp-amm-sdk
        // TxBuilder is just Promise<Transaction>
        const swapTx = await cpAmmClient.swap({
          payer: publicKey,
          pool: poolInfo.poolAddress,
          inputTokenMint: isBuying ? poolInfo.quoteMint : poolInfo.baseMint,
          outputTokenMint: isBuying ? poolInfo.baseMint : poolInfo.quoteMint,
          amountIn,
          minimumAmountOut: quote.minimumAmountOut,
          tokenAMint: poolState.tokenAMint,
          tokenBMint: poolState.tokenBMint,
          tokenAVault,
          tokenBVault,
          tokenAProgram,
          tokenBProgram,
          referralTokenAccount: null,
          poolState, // Pass pool state for additional context
        });

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        
        // swapTx is a Transaction, get its instructions
        const instructions = [...swapTx.instructions];
        
        // Ensure user has ATAs for both input and output tokens (if not native SOL)
        const inputMint = isBuying ? poolInfo.quoteMint : poolInfo.baseMint;
        const outputMint = isBuying ? poolInfo.baseMint : poolInfo.quoteMint;
        
        // Check output token ATA
        if (!outputMint.equals(NATIVE_MINT)) {
          const ata = await getAssociatedTokenAddress(outputMint, publicKey);
          try {
            await getAccount(connection, ata);
          } catch (e) {
            if (e instanceof TokenAccountNotFoundError) {
              const createAtaIx = createAssociatedTokenAccountInstruction(
                publicKey,
                ata,
                publicKey,
                outputMint
              );
              instructions.unshift(createAtaIx);
            }
          }
        }
        
        // Check input token ATA (for non-SOL tokens)
        if (!inputMint.equals(NATIVE_MINT)) {
          const ata = await getAssociatedTokenAddress(inputMint, publicKey);
          try {
            await getAccount(connection, ata);
          } catch (e) {
            if (e instanceof TokenAccountNotFoundError) {
              // User doesn't have input token - this shouldn't happen but handle gracefully
              throw new Error('You do not have the input token');
            }
          }
        }

        const messageV0 = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        
        console.log('Simulating DAMM v2 swap transaction...');
        const simulation = await connection.simulateTransaction(transaction);
        if (simulation.value.err) {
          console.error('Simulation error:', simulation.value.err);
          console.error('Simulation logs:', simulation.value.logs);
          throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }

        const signedTx = await signTransaction(transaction);
        
        txSignature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
          maxRetries: 3,
        });

        toast.loading('Confirming transaction...', { id: 'swap-confirm' });

        await connection.confirmTransaction({
          signature: txSignature,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');
      } else {
        throw new Error('Invalid pool type');
      }

      toast.dismiss('swap-confirm');
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Swap successful!</span>
          <a 
            href={`https://solscan.io/tx/${txSignature}?cluster=devnet`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline"
          >
            View on Solscan
          </a>
        </div>
      );

      // Reset form and refresh
      setInputAmount('');
      setQuote(null);
      fetchPoolInfo(true); // Force refresh after swap
      fetchUserBalances();

    } catch (err: any) {
      console.error('Swap error:', err);
      toast.dismiss('swap-confirm');
      
      // Parse common errors for user-friendly messages
      const errMsg = err.message || '';
      if (errMsg.includes('insufficient lamports')) {
        toast.error('Insufficient SOL balance for this swap');
      } else if (errMsg.includes('insufficient funds')) {
        toast.error('Insufficient funds for this swap');
      } else if (errMsg.includes('AccountNotFound')) {
        toast.error('Token account not found. Try a smaller amount.');
      } else {
        toast.error(errMsg || 'Swap failed');
      }
    } finally {
      setIsSwapping(false);
    }
  }, [publicKey, signTransaction, poolInfo, quote, inputAmount, isBuying, fetchPoolInfo, fetchUserBalances]);

  // Effects - only fetch once on mount or when mint changes
  useEffect(() => {
    // Reset refs when mint changes
    hasFetchedRef.current = false;
    fetchingRef.current = false;
    fetchPoolInfo();
  }, [mint]); // Only depend on mint, not fetchPoolInfo

  useEffect(() => {
    if (poolInfo && publicKey) {
      fetchUserBalances();
    }
  }, [poolInfo?.poolAddress?.toString(), publicKey?.toString()]); // Stable dependencies

  useEffect(() => {
    const debounce = setTimeout(() => {
      getSwapQuote();
    }, 300);
    return () => clearTimeout(debounce);
  }, [getSwapQuote]);

  // Format helpers - use string conversion to avoid 53-bit overflow
  const formatAmount = (amount: BN, decimals: number) => {
    try {
      // Convert BN to string and handle decimal placement manually
      const amountStr = amount.toString();
      if (amountStr === '0') return '0.0';
      
      // Pad with leading zeros if needed
      const padded = amountStr.padStart(decimals + 1, '0');
      const intPart = padded.slice(0, -decimals) || '0';
      const decPart = padded.slice(-decimals);
      
      // Parse as float for formatting (safe now since we've reduced precision)
      const value = parseFloat(`${intPart}.${decPart}`);
      if (value < 0.0001 && value > 0) return '< 0.0001';
      return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
    } catch {
      return '0.0';
    }
  };

  const formatBalance = (amount: BN, decimals: number) => {
    try {
      const amountStr = amount.toString();
      if (amountStr === '0') return '0.0';
      
      const padded = amountStr.padStart(decimals + 1, '0');
      const intPart = padded.slice(0, -decimals) || '0';
      const decPart = padded.slice(-decimals);
      
      const value = parseFloat(`${intPart}.${decPart}`);
      return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    } catch {
      return '0.0';
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // Render error state
  if (error || !poolInfo) {
    return (
      <div className="p-4 text-center">
        <p className="text-moon-300 mb-2">
          {error || 'Unable to load pool'}
        </p>
        <p className="text-sm text-moon-500">
          Use Jupiter tab for aggregated trading.
        </p>
      </div>
    );
  }

  // Graduation progress (only for DBC pools)
  const graduationProgress = poolInfo.poolType === 'dbc' && poolInfo.migrationQuoteThreshold.gtn(0)
    ? Math.min(100, (poolInfo.quoteBalance.toNumber() / poolInfo.migrationQuoteThreshold.toNumber()) * 100)
    : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Pool Type Badge */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full ${
          poolInfo.poolType === 'dbc' 
            ? 'bg-gold-500/20 text-gold-400' 
            : 'bg-cosmic-500/20 text-cosmic-400'
        }`}>
          {poolInfo.poolType === 'dbc' ? '🌙 Bonding Curve' : '⚡ DAMM v2'}
        </span>
      </div>

      {/* Pool Status - only for DBC */}
      {poolInfo.poolType === 'dbc' && poolInfo.migrationQuoteThreshold.gtn(0) && (
        <div className="bg-moon-800/50 rounded-lg p-3">
          <div className="flex justify-between text-xs text-moon-300 mb-1">
            <span>Bonding Curve Progress</span>
            <span>{graduationProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-moon-700 rounded-full h-2">
            <div 
              className="bg-gold-400 h-2 rounded-full transition-all"
              style={{ width: `${graduationProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-moon-400 mt-1">
            <span>{formatAmount(poolInfo.quoteBalance, poolInfo.quoteDecimals)} {poolInfo.quoteSymbol}</span>
            <span>{formatAmount(poolInfo.migrationQuoteThreshold, poolInfo.quoteDecimals)} {poolInfo.quoteSymbol}</span>
          </div>
        </div>
      )}

      {/* Buy/Sell Toggle */}
      <div className="flex rounded-lg bg-moon-800 p-1">
        <button
          onClick={() => {
            setIsBuying(true);
            setInputAmount('');
            setQuote(null);
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            isBuying 
              ? 'bg-emerald-600 text-white' 
              : 'text-moon-300 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => {
            setIsBuying(false);
            setInputAmount('');
            setQuote(null);
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            !isBuying 
              ? 'bg-rose-600 text-white' 
              : 'text-moon-300 hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Input Amount */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-moon-300">
            {isBuying ? 'You Pay' : 'You Sell'}
          </span>
          {connected && (
            <span className="text-moon-400">
              Balance: {formatBalance(
                isBuying ? userQuoteBalance : userBaseBalance,
                isBuying ? poolInfo.quoteDecimals : poolInfo.baseDecimals
              )} {isBuying ? poolInfo.quoteSymbol : poolInfo.baseSymbol}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-moon-800 rounded-lg p-3">
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 bg-transparent text-xl text-white outline-none placeholder-moon-500"
          />
          <span className="text-moon-300 font-medium">
            {isBuying ? poolInfo.quoteSymbol : poolInfo.baseSymbol}
          </span>
        </div>
        {/* Quick amount buttons */}
        {connected && (
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  const balance = isBuying ? userQuoteBalance : userBaseBalance;
                  const decimals = isBuying ? poolInfo.quoteDecimals : poolInfo.baseDecimals;
                  const amount = (balance.toNumber() * pct / 100) / 10 ** decimals;
                  // Reserve some SOL for fees when buying with SOL
                  const reserveForFees = isBuying && poolInfo.quoteMint.equals(NATIVE_MINT) ? 0.01 : 0;
                  setInputAmount(Math.max(0, amount - reserveForFees).toFixed(6));
                }}
                className="flex-1 py-1 px-2 text-xs bg-moon-700 hover:bg-moon-600 rounded text-moon-200"
              >
                {pct}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Arrow divider */}
      <div className="flex justify-center">
        <div className="bg-moon-700 rounded-full p-2">
          <svg className="w-4 h-4 text-moon-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Output Amount */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-moon-300">
            {isBuying ? 'You Receive' : 'You Get'}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-moon-800 rounded-lg p-3">
          <span className="flex-1 text-xl text-white">
            {quote 
              ? formatAmount(quote.amountOut, isBuying ? poolInfo.baseDecimals : poolInfo.quoteDecimals)
              : '0.0'
            }
          </span>
          <span className="text-moon-300 font-medium">
            {isBuying ? poolInfo.baseSymbol : poolInfo.quoteSymbol}
          </span>
        </div>
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="bg-moon-800/50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between text-moon-400">
            <span>Price Impact</span>
            <span className={quote.priceImpact > 5 ? 'text-gold-400' : 'text-moon-200'}>
              {quote.priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between text-moon-400">
            <span>Min. Received</span>
            <span className="text-moon-200">
              {formatAmount(quote.minimumAmountOut, isBuying ? poolInfo.baseDecimals : poolInfo.quoteDecimals)} {isBuying ? poolInfo.baseSymbol : poolInfo.quoteSymbol}
            </span>
          </div>
          <div className="flex justify-between text-moon-400">
            <span>Slippage</span>
            <span className="text-moon-200">{slippageBps / 100}%</span>
          </div>
        </div>
      )}

      {/* Slippage Settings */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-moon-400">Slippage:</span>
        {[50, 100, 200, 500].map((bps) => (
          <button
            key={bps}
            onClick={() => setSlippageBps(bps)}
            className={`px-2 py-1 rounded text-xs ${
              slippageBps === bps
                ? 'bg-cosmic-600 text-white'
                : 'bg-moon-700 text-moon-300 hover:bg-moon-600'
            }`}
          >
            {bps / 100}%
          </button>
        ))}
      </div>

      {/* Swap Button */}
      {!connected ? (
        <button
          className="w-full py-3 rounded-lg bg-cosmic-600 hover:bg-cosmic-500 text-white font-medium"
          onClick={() => {
            toast.info('Please connect your wallet');
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={executeSwap}
          disabled={isSwapping || !quote || parseFloat(inputAmount) <= 0}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isSwapping || !quote || parseFloat(inputAmount) <= 0
              ? 'bg-moon-700 text-moon-500 cursor-not-allowed'
              : isBuying
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
          }`}
        >
          {isSwapping 
            ? 'Swapping...' 
            : isBuying 
              ? `Buy ${poolInfo.baseSymbol}` 
              : `Sell ${poolInfo.baseSymbol}`
          }
        </button>
      )}


    </div>
  );
}

export default DirectSwap;
