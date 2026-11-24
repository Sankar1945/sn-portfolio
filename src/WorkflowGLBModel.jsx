import React, { lazy, Suspense } from 'react';

const LoadedWorkflowGLB = lazy(() => import('./LoadedWorkflowGLB'));

class ModelBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function WorkflowGLBModel({ url, fallback }) {
  return (
    <ModelBoundary key={url} fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedWorkflowGLB url={url} />
      </Suspense>
    </ModelBoundary>
  );
}
