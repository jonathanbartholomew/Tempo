import { Construction } from 'lucide-react';

export default function UnderConstruction({ name, icon: Icon }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="w-20 h-20 rounded-2xl bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center mb-6">
        {Icon ? <Icon size={38} className="text-yellow-500" /> : <Construction size={38} className="text-yellow-500" />}
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {name} Integration
      </h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm leading-relaxed">
        We're actively building this integration. It'll be available soon — hang tight!
      </p>
      <span className="mt-4 text-xs font-semibold bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full">
        Coming Soon
      </span>
    </div>
  );
}
