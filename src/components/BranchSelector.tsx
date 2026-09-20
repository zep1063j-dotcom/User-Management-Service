import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Building2 } from 'lucide-react';

interface BranchSelectorProps {
  branches: string[];
  selected: string;
  onSelect: (branch: string) => void;
}

export default function BranchSelector({
  branches,
  selected,
  onSelect,
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-fit">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        {selected} 오퍼레이션
        <ChevronDown
          size={22}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-2 w-56 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-none z-20 overflow-hidden"
        >
          {branches.map((branch) => {
            const isSelected = branch === selected;
            return (
              <button
                key={branch}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(branch);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-bold text-left transition-colors ${
                  isSelected
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Building2
                    size={15}
                    className={`shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}
                  />
                  {branch}
                </span>
                {isSelected && <Check size={15} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
