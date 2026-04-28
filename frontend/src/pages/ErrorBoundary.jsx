import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Update state so the next render will show the fallback UI
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Log the error to your logging service (or console)
  componentDidCatch(error, errorInfo) {
    console.error("DecisionCard Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom Fallback UI
      return (
        <div className="p-8 my-8 text-center bg-rose-50 border border-rose-100 rounded-3xl">
          <h2 className="text-rose-800 font-bold mb-2">Analysis View Unavailable</h2>
          <p className="text-rose-600 text-sm mb-4">
            We encountered an issue displaying this tender summary. 
            The data structure might be unexpected.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;