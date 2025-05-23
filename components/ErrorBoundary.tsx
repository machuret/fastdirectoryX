import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    // You could also send this to a logging service like Sentry, LogRocket, etc.
    // Example: logErrorToMyService(error, errorInfo);
  }

  private handleResetError = () => {
    // Attempt to reset the error state.
    // This might not always work as expected if the underlying issue persists.
    // A better approach for "retry" might involve re-fetching data or re-initializing state
    // at a higher level, or simply navigating the user away.
    this.setState({ hasError: false, error: undefined });
    // Consider a full page reload or navigation if a simple state reset isn't enough.
    // window.location.reload();
    // Or, if you have access to router:
    // router.push('/');
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Default fallback UI
      return (
        <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #ff000030', margin: '20px', borderRadius: '8px', backgroundColor: '#fff0f0' }}>
          <h2>Something went wrong.</h2>
          <p>We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.</p>
          {this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', background: '#f9f9f9', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
              <summary>Error Details (for development)</summary>
              {this.state.error.toString()}
              <br />
              {/* In development, you might want to show componentStack from errorInfo */}
            </details>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '15px', padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '4px', backgroundColor: '#007bff', color: 'white' }}
          >
            Refresh Page
          </button>
          {/* <button onClick={this.handleResetError} style={{ marginLeft: '10px' }}>Try again</button> */}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
