const variants = {
  error: 'bg-red-500/10 text-red-600 dark:text-red-400',
  success: 'bg-green-600/10 text-green-700 dark:text-green-400',
  info: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

export default function Alert({ variant = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`mb-4 rounded-md px-3.5 py-3 text-left text-sm ${variants[variant]}`} role="alert">
      {children}
    </div>
  );
}
