import { Component, type ErrorInfo, type ReactNode } from "react";
import { Icon } from "@/shared/ui/Icon";

interface AdminPanelErrorBoundaryProps {
  children: ReactNode;
}

interface AdminPanelErrorBoundaryState {
  error: Error | null;
}

/** Yönetim kabuğu — tek bileşen hatası tüm paneli beyaza düşürmesin. */
export default class AdminPanelErrorBoundary extends Component<
  AdminPanelErrorBoundaryProps,
  AdminPanelErrorBoundaryState
> {
  state: AdminPanelErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AdminPanelErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Admin panel error boundary:", error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-club-light p-6">
          <div className="card max-w-lg p-8 text-center">
            <Icon name="reject" size={40} className="mx-auto mb-4 text-red-500" />
            <h1 className="font-display text-xl font-bold text-slate-900">
              Yönetim paneli yüklenemedi
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Beklenmeyen bir hata oluştu. Sayfayı yenilemeden önce tekrar deneyebilirsiniz.
            </p>
            {import.meta.env.DEV && (
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-left text-xs text-slate-500 break-words">
                {this.state.error.message}
              </p>
            )}
            <button type="button" className="btn-primary mt-6" onClick={this.handleRetry}>
              Yeniden dene
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
