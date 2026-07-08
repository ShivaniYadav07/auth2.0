export default function Card({ title, children, className = '' }) {
  return (
    <div
      className={`mb-5 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {title && (
        <h2 className="mt-0 mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
