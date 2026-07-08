const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold no-underline transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary: 'bg-violet-600 text-white hover:bg-violet-700',
  secondary:
    'border border-gray-300 bg-transparent text-gray-900 hover:border-violet-500 hover:text-violet-600 dark:border-gray-700 dark:text-gray-100 dark:hover:text-violet-400',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
