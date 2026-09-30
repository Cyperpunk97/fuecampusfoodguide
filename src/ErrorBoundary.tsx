import { Component, type ErrorInfo, type ReactNode } from 'react';

type State = { failed: boolean };

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CS Family screen error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const clearSourceCache = () => {
      try { for (const key of ['cs-star-original-snapshot-v4', 'cs-star-original-snapshot-v3', 'cs-star-original-snapshot-v2']) localStorage.removeItem(key); }
      catch { /* A blocked storage API should not block reloading the app. */ }
      window.location.reload();
    };
    return <main className="recovery-screen">
      <div className="recovery-mark">CS</div>
      <h1>Something didn't load.</h1>
      <p>Your saved places and reviews are safe on this device.</p>
      <button onClick={() => window.location.reload()}>Try again</button>
      <button className="recovery-secondary" onClick={clearSourceCache}>Reload food catalog</button>
      <small>لو الصفحة مش بتفتح، جرّب تحديث التطبيق. بياناتك المحفوظة لسه موجودة.</small>
    </main>;
  }
}