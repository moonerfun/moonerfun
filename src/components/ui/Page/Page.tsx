import Header from '@/components/Header';
import { cn } from '@/lib/utils';

interface IProps {
  containerClassName?: string;
  pageClassName?: string;
}

const Page: React.FC<React.PropsWithChildren<IProps>> = ({
  containerClassName,
  children,
  pageClassName,
}) => {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col justify-between bg-neutral-950 text-neutral-100',
        pageClassName
      )}
    >
      <Header />
      <div
        className={cn(
          'flex flex-1 flex-col px-4 md:px-6 lg:px-8 pt-4 pb-16',
          containerClassName
        )}
      >
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};

export default Page;
