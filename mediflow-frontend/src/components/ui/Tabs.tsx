import { ReactNode, useState } from 'react';
import { cn } from '../../lib/design-system';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
  content: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'enclosed';
  className?: string;
  fullWidth?: boolean;
}

const variantClasses = {
  default: 'border-b border-neutral-100',
  pills: '',
  underline: 'border-b border-neutral-100',
  enclosed: 'inline-flex max-w-full overflow-x-auto scrollbar-none p-1 rounded-2xl bg-white border border-neutral-200/80 shadow-xs',
};

const tabClasses = {
  default: 'border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300',
  pills: 'rounded-lg bg-transparent text-neutral-500 hover:bg-neutral-100',
  underline: 'border-b-2 border-transparent text-neutral-500 hover:text-neutral-700',
  enclosed: 'rounded-xl whitespace-nowrap text-neutral-500 hover:text-ink-900 hover:bg-neutral-50',
};

const activeTabClasses = {
  default: 'border-brand-500 text-brand-600',
  pills: 'bg-brand-50 text-brand-700',
  underline: 'border-brand-500 text-brand-600',
  enclosed: 'rounded-xl whitespace-nowrap bg-ink-900 text-white shadow-sm',
};

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  className,
  fullWidth = false,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab?.disabled) return;
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'flex gap-1',
          variantClasses[variant],
          fullWidth && 'w-full'
        )}
        role="tablist"
        aria-label="Pestañas"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-trigger`}
            onClick={() => handleTabClick(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2',
              'relative inline-flex items-center gap-2',
              fullWidth && 'flex-1 justify-center',
              activeTab === tab.id ? activeTabClasses[variant] : tabClasses[variant],
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {tab.icon && <span className="flex items-center">{tab.icon}</span>}
            {tab.label}
            {tab.badge && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-neutral-200 text-neutral-600">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-trigger`}>
        {activeTabContent}
      </div>
    </div>
  );
}

// Versión simple para uso rápido
export interface SimpleTabsProps {
  tabs: Array<{ id: string; label: string; content: ReactNode; disabled?: boolean }>;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export function SimpleTabs({ tabs, defaultTab, onChange, variant = 'default', className }: SimpleTabsProps) {
  return (
    <Tabs
      tabs={tabs.map((t) => ({ ...t, icon: undefined, badge: undefined }))}
      defaultTab={defaultTab}
      onChange={onChange}
      variant={variant}
      className={className}
    />
  );
}