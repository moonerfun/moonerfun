import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  variant: {
    default: 'bg-primary hover:bg-primary-600 text-neutral-950',
    outline: 'border border-primary bg-transparent text-primary hover:bg-primary/10',
    ghost: 'bg-transparent text-neutral-100 hover:bg-neutral-800',
    secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700',
  },
  size: {
    default: 'text-xs md:text-base px-4 md:px-8 py-2 md:py-3',
    sm: 'text-xs px-3 py-1.5',
    lg: 'text-sm md:text-base px-6 md:px-10 py-3 md:py-4',
    icon: 'h-9 w-9 p-0',
  },
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const buttonClasses = cn(
      'inline-flex items-center justify-center rounded-lg transition cursor-pointer font-semibold',
      buttonVariants.variant[variant],
      buttonVariants.size[size],
      className
    );

    // If asChild, clone the child element and pass button classes
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(buttonClasses, (children as React.ReactElement<{ className?: string }>).props.className),
      });
    }

    return (
      <button
        className={buttonClasses}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
