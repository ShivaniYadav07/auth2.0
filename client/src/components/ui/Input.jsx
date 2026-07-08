const base =
  'w-full rounded-md border px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:bg-gray-950 dark:text-gray-100';

// Works with react-hook-form's `{...register(name)}` spread: in React 19 `ref` arrives
// as a normal prop, so no forwardRef is needed. `as="textarea"` renders a textarea with
// the same styling. `hasError` swaps the border to the danger color.
export default function Input({ as = 'input', hasError = false, className = '', ref, ...props }) {
  const Tag = as;
  const border = hasError ? 'border-red-400' : 'border-gray-300 dark:border-gray-700';
  const extra = as === 'textarea' ? 'min-h-20 resize-y font-mono' : '';
  return <Tag ref={ref} className={`${base} ${border} ${extra} ${className}`} {...props} />;
}
