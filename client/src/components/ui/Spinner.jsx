export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-gray-500" role="status" aria-live="polite">
      <span
        className="size-[18px] animate-spin rounded-full border-2 border-gray-300 border-t-violet-500 dark:border-gray-700 dark:border-t-violet-400"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
