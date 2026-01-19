'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type FAQItemProps = {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
};

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => (
  <div className="border-b border-neutral-800 last:border-b-0">
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-primary"
    >
      <span className="pr-4 font-medium text-neutral-100">{question}</span>
      <span
        className={cn(
          'iconify h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-200',
          isOpen ? 'ph--minus-bold rotate-0' : 'ph--plus-bold'
        )}
      />
    </button>
    <div
      className={cn(
        'grid transition-all duration-200',
        isOpen ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'
      )}
    >
      <div className="overflow-hidden">
        <p className="text-neutral-400">{answer}</p>
      </div>
    </div>
  </div>
);

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is mooner.fun?',
      answer:
        'mooner.fun is a token launchpad built on Solana using Meteora\'s Dynamic Bonding Curve. Launch your token fairly, and once it migrates to DAMM, trading fees power the flywheel—automatically buying back and burning $MOONER tokens.',
    },
    {
      question: 'How does the flywheel work?',
      answer:
        'The flywheel activates after your token migrates to Meteora DAMM. Trading fees are split: 80% goes to the platform (used to buy back and burn $MOONER), and 20% goes directly to the token creator. This cycle repeats continuously.',
    },
    {
      question: 'What is a bonding curve?',
      answer:
        "A bonding curve is a mathematical formula that determines token price based on supply. Meteora's Dynamic Bonding Curve (DBC) provides instant liquidity and fair pricing from the first trade. As more tokens are bought, the price increases, and as tokens are sold, the price decreases.",
    },
    {
      question: 'When does my token migrate?',
      answer:
        'Your token migrates to Meteora DAMM (Dynamic AMM) once the bonding curve reaches its target. After migration, your token has deep liquidity on DAMM, and trading fees start powering the flywheel.',
    },
    {
      question: 'How do I launch a token?',
      answer:
        "Launching is simple: click 'Create Pool', enter your token details (name, symbol, logo), connect your wallet, and confirm the transaction. Your token will be immediately tradeable on the bonding curve.",
    },
    {
      question: 'Are there any fees to launch?',
      answer:
        'There is a small creation fee to launch a pool, which covers Solana network costs and initial setup. Once launched, the pool operates autonomously. After migration, trading fees power the flywheel.',
    },
    {
      question: 'How is this different from other launchpads?',
      answer:
        'Unlike traditional launchpads, mooner.fun has no presales, no team allocations, and no private rounds. Everyone enters at fair bonding curve prices. Plus, after migration, the flywheel mechanism creates continuous $MOONER buybacks and burns.',
    },
    {
      question: 'Is this safe?',
      answer:
        'All operations are non-custodial and happen through on-chain smart contracts. You maintain full control of your tokens. The flywheel system runs autonomously based on verified code, and all transactions are publicly verifiable on the Solana blockchain.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-neutral-900/30">
      <div className="mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-neutral-100 md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-neutral-400">
            Have questions? We've got answers.
          </p>
        </div>

        {/* FAQ List */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 px-6">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
