function LoadingSpinner({ label = "Loading…" }) {
  return (
    <div className="loading-spinner-container">
      <span className="loading-spinner" role="status" aria-label={label} />
    </div>
  );
}

export default LoadingSpinner;
