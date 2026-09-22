import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Toaster } from 'sonner';
import { useAppStore } from '../../lib/store';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[var(--border)]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--text)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};

interface AppShellProps {
  children: React.ReactNode;
  onNavigateHome?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, onNavigateHome }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { currentSection, theme } = useAppStore();

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-200 overflow-hidden">
        {/* Sticky Top Bar */}
        <TopBar onNavigateHome={onNavigateHome} />

        {/* Main Workstation Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Left Sidebar / Bottom Mobile Tabs */}
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
            onNavigateHome={onNavigateHome}
          />

          {/* Main Content Viewport */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-8 min-h-0">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Global Command Palette */}
        <CommandPalette />

        {/* Global Sonner Toast Engine */}
        <Toaster
          position="bottom-right"
          theme={theme}
          toastOptions={{
            style: {
              background: 'var(--bg-elev-1)',
              color: 'var(--text)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
};
