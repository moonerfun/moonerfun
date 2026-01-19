import { cn } from '@/lib/utils';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export const SectionHeader = ({ title, subtitle, className }: SectionHeaderProps) => {
  return (
    <div className={cn('mb-8', className)}>
      <h2 className="text-2xl font-bold text-neutral-100 md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-neutral-400">{subtitle}</p>}
    </div>
  );
};

export default SectionHeader;
