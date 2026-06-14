export default function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-72">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-gray-900 text-white text-sm font-medium rounded-lg shadow-lg px-4 py-3 animate-in"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
