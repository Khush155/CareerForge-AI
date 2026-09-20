import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CareerForge Uncaught Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--bg)] text-[var(--text)]">
          <div className="max-w-md w-full p-8 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elev-1)] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-critical)]/10 text-[var(--color-critical)] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-display">System State Exception</h2>
            <p className="text-sm text-[var(--text-muted)]">
              An unexpected UI error occurred while rendering. Your plan data in storage is safe.
            </p>
            {this.state.error && (
              <pre className="text-xs p-3 rounded-lg bg-[var(--bg-elev-2)] text-[var(--text-faint)] overflow-x-auto text-left font-mono">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-indigo)] text-white text-sm font-semibold hover:opacity-90 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
