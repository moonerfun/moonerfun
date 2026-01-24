import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { z } from 'zod';
import Header from '../components/Header';

import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Keypair, Transaction } from '@solana/web3.js';
import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter';
import { toast } from 'sonner';

// Define the schema for form validation
const poolSchema = z.object({
  tokenName: z.string().min(3, 'Token name must be at least 3 characters'),
  tokenSymbol: z.string().min(1, 'Token symbol is required'),
  tokenLogo: z.instanceof(File, { message: 'Token logo is required' }).optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().or(z.literal('')),
  website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  twitter: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  telegram: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  discord: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

interface FormValues {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: File | undefined;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export default function CreatePool() {
  const { publicKey, signTransaction } = useWallet();
  const address = useMemo(() => publicKey?.toBase58(), [publicKey]);

  const [isLoading, setIsLoading] = useState(false);
  const [poolCreated, setPoolCreated] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      tokenName: '',
      tokenSymbol: '',
      tokenLogo: undefined,
      description: '',
      website: '',
      twitter: '',
      telegram: '',
      discord: '',
    } as FormValues,
    onSubmit: async ({ value }) => {
      try {
        setIsLoading(true);
        const { tokenLogo } = value;
        if (!tokenLogo) {
          toast.error('Token logo is required');
          return;
        }

        if (!signTransaction) {
          toast.error('Wallet not connected');
          return;
        }

        const reader = new FileReader();

        // Convert file to base64
        const base64File = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(tokenLogo);
        });

        const keyPair = Keypair.generate();

        // Step 1: Upload to R2 and get transaction
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenLogo: base64File,
            mint: keyPair.publicKey.toBase58(),
            tokenName: value.tokenName,
            tokenSymbol: value.tokenSymbol,
            userWallet: address,
            description: value.description || undefined,
            website: value.website || undefined,
            twitter: value.twitter || undefined,
            telegram: value.telegram || undefined,
            discord: value.discord || undefined,
          }),
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error);
        }

        const { poolTx, poolInfo } = await uploadResponse.json();
        const transaction = Transaction.from(Buffer.from(poolTx, 'base64'));

        // Step 2: Sign with keypair first
        transaction.sign(keyPair);

        // Step 3: Then sign with user's wallet
        const signedTransaction = await signTransaction(transaction);

        // Step 4: Send signed transaction with pool info for flywheel registration
        const sendResponse = await fetch('/api/send-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signedTransaction: signedTransaction.serialize().toString('base64'),
            poolInfo, // Pass pool info for flywheel registration
          }),
        });

        if (!sendResponse.ok) {
          const error = await sendResponse.json();
          throw new Error(error.error);
        }

        const { success } = await sendResponse.json();
        if (success) {
          toast.success('Pool created successfully');
          setPoolCreated(true);
        }
      } catch (error) {
        console.error('Error creating pool:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create pool');
      } finally {
        setIsLoading(false);
      }
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = poolSchema.safeParse(value);
        if (!result.success) {
          return result.error.formErrors.fieldErrors;
        }
        return undefined;
      },
    },
  });

  return (
    <>
      <Head>
        <title>Create Pool - mooner.fun</title>
        <meta
          name="description"
          content="Launch your token on mooner.fun with built-in flywheel mechanics."
        />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-white">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div>
              <h1 className="text-4xl font-bold mb-2">Create Pool</h1>
              <p className="text-neutral-300">Launch your token with flywheel-powered bonding curve</p>
            </div>
          </div>

          {poolCreated && !isLoading ? (
            <PoolCreationSuccess />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="space-y-8"
            >
              {/* Token Details Section */}
              <div className="bg-neutral-900 rounded-xl p-8 border border-neutral-800">
                <h2 className="text-2xl font-bold mb-4">Token Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <label
                        htmlFor="tokenName"
                        className="block text-sm font-medium text-neutral-300 mb-1"
                      >
                        Token Name*
                      </label>
                      {form.Field({
                        name: 'tokenName',
                        children: (field) => (
                          <input
                            id="tokenName"
                            name={field.name}
                            type="text"
                            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                            placeholder="e.g. Virtual Coin"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            required
                            minLength={3}
                          />
                        ),
                      })}
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="tokenSymbol"
                        className="block text-sm font-medium text-neutral-300 mb-1"
                      >
                        Token Symbol*
                      </label>
                      {form.Field({
                        name: 'tokenSymbol',
                        children: (field) => (
                          <input
                            id="tokenSymbol"
                            name={field.name}
                            type="text"
                            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                            placeholder="e.g. VRTL"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            required
                            maxLength={10}
                          />
                        ),
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="tokenLogo"
                      className="block text-sm font-medium text-neutral-300 mb-1"
                    >
                      Token Logo*
                    </label>
                    {form.Field({
                      name: 'tokenLogo',
                      children: (field) => (
                        <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center">
                          {logoPreview ? (
                            <div className="relative inline-block">
                              <img
                                src={logoPreview}
                                alt="Token logo preview"
                                className="w-24 h-24 rounded-lg object-cover mx-auto mb-2"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoPreview(null);
                                  field.handleChange(undefined);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 transition"
                              >
                                <span className="iconify w-4 h-4 ph--x-bold" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="iconify w-6 h-6 mx-auto mb-2 text-neutral-400 ph--upload-bold" />
                              <p className="text-neutral-400 text-xs mb-2">PNG, JPG or SVG (max. 2MB)</p>
                            </>
                          )}
                          <input
                            type="file"
                            id="tokenLogo"
                            accept="image/png,image/jpeg,image/svg+xml"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.handleChange(file);
                                // Create preview URL
                                const previewUrl = URL.createObjectURL(file);
                                setLogoPreview(previewUrl);
                              }
                            }}
                          />
                          <label
                            htmlFor="tokenLogo"
                            className="bg-neutral-700 px-4 py-2 rounded-lg text-sm hover:bg-neutral-600 transition cursor-pointer"
                          >
                            {logoPreview ? 'Change Image' : 'Browse Files'}
                          </label>
                        </div>
                      ),
                    })}
                  </div>
                </div>

                {/* Description Field */}
                <div className="mt-6">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-neutral-300 mb-1"
                  >
                    Description
                  </label>
                  {form.Field({
                    name: 'description',
                    children: (field) => (
                      <div>
                        <textarea
                          id="description"
                          name={field.name}
                          className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white resize-none"
                          placeholder="Describe your token project, its purpose, and vision..."
                          rows={4}
                          maxLength={500}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <p className="text-neutral-500 text-xs mt-1 text-right">
                          {field.state.value?.length || 0}/500 characters
                        </p>
                      </div>
                    ),
                  })}
                </div>
              </div>

              {/* Social Links Section */}
              <div className="bg-neutral-900 rounded-xl p-8 border border-neutral-800">
                <h2 className="text-2xl font-bold mb-6">Social Links (Optional)</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="mb-4">
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium text-neutral-300 mb-1"
                    >
                      Website
                    </label>
                    {form.Field({
                      name: 'website',
                      children: (field) => (
                        <input
                          id="website"
                          name={field.name}
                          type="url"
                          className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                          placeholder="https://yourwebsite.com"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      ),
                    })}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="twitter"
                      className="block text-sm font-medium text-neutral-300 mb-1"
                    >
                      Twitter
                    </label>
                    {form.Field({
                      name: 'twitter',
                      children: (field) => (
                        <input
                          id="twitter"
                          name={field.name}
                          type="url"
                          className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                          placeholder="https://twitter.com/yourusername"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      ),
                    })}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="telegram"
                      className="block text-sm font-medium text-neutral-300 mb-1"
                    >
                      Telegram
                    </label>
                    {form.Field({
                      name: 'telegram',
                      children: (field) => (
                        <input
                          id="telegram"
                          name={field.name}
                          type="url"
                          className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                          placeholder="https://t.me/yourgroup"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      ),
                    })}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="discord"
                      className="block text-sm font-medium text-neutral-300 mb-1"
                    >
                      Discord
                    </label>
                    {form.Field({
                      name: 'discord',
                      children: (field) => (
                        <input
                          id="discord"
                          name={field.name}
                          type="url"
                          className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                          placeholder="https://discord.gg/yourinvite"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      ),
                    })}
                  </div>
                </div>
              </div>

              {form.state.errors && form.state.errors.length > 0 && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 space-y-2">
                  {form.state.errors.map((error, index) =>
                    Object.entries(error || {}).map(([, value]) => (
                      <div key={index} className="flex items-start gap-2">
                        <p className="text-red-200">
                          {Array.isArray(value)
                            ? value.map((v: any) => v.message || v).join(', ')
                            : typeof value === 'string'
                              ? value
                              : String(value)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <SubmitButton isSubmitting={isLoading} />
              </div>
            </form>
          )}
        </main>
      </div>
    </>
  );
}

const SubmitButton = ({ isSubmitting }: { isSubmitting: boolean }) => {
  const { publicKey } = useWallet();
  const { setShowModal } = useUnifiedWalletContext();

  if (!publicKey) {
    return (
      <Button type="button" onClick={() => setShowModal(true)}>
        <span>Connect Wallet</span>
      </Button>
    );
  }

  return (
    <Button className="flex items-center gap-2" type="submit" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <span className="iconify ph--spinner w-5 h-5 animate-spin" />
          <span>Creating Pool...</span>
        </>
      ) : (
        <>
          <span className="iconify ph--rocket-bold w-5 h-5" />
          <span>Launch Pool</span>
        </>
      )}
    </Button>
  );
};

const PoolCreationSuccess = () => {
  return (
    <>
      <div className="bg-neutral-900 rounded-xl p-8 border border-neutral-800 text-center">
        <div className="bg-green-500/20 p-4 rounded-full inline-flex mb-6">
          <span className="iconify ph--check-bold w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Pool Created Successfully!</h2>
        <p className="text-gray-300 mb-8 max-w-lg mx-auto">
          Your token pool has been created and is now live on the Virtual Curve platform. Users can
          now buy and trade your tokens.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-neutral-800 px-6 py-3 rounded-xl font-medium hover:bg-neutral-700 transition"
          >
            Explore Pools
          </Link>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="cursor-pointer bg-primary hover:bg-primary-600 text-neutral-950 px-6 py-3 rounded-xl font-medium transition"
          >
            Create Another Pool
          </button>
        </div>
      </div>
    </>
  );
};