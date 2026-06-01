import type { Tab } from '../types';
import { useAppStore } from '../store/useAppStore';

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: 'create', icon: '✨', label: 'Crear' },
  { id: 'gallery', icon: '🖼️', label: 'Galería' },
  { id: 'config', icon: '⚙️', label: 'Config' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { tab, setTab } = useAppStore();

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0a0a]">
      {/* Header */}
      <header className="px-5 pt-safe pt-4 pb-3 border-b border-[#1e1e1e]">
        <h1 className="text-lg font-semibold tracking-tight text-[#f5f0eb]">
          ARI<span className="text-[#ff6b6b]"> STUDIO</span>
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#1e1e1e] pb-safe">
        <div className="flex">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                tab === t.id ? 'text-[#ff6b6b]' : 'text-[#555]'
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className="text-[11px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
