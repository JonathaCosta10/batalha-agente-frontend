import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryState = { error: Error | null };

const toError = (value: unknown) => value instanceof Error ? value : new Error(String(value));

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', toError(error), info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;
    return <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-xl font-semibold text-gray-900">Algo deu errado</h1>
        <p className="mt-2 text-sm text-gray-600">Esta parte do app encontrou um erro.</p>
        {import.meta.env.DEV ? <pre className="mt-4 overflow-x-auto rounded bg-gray-100 p-3 text-left text-xs text-gray-800">{error.message}</pre> : null}
        <button type="button" onClick={()=>this.setState({ error: null })} className="mt-4 rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">Tentar de novo</button>
      </div>
    </div>;
  }
}
