export function ClarisixSpinner({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/Untitled_design_(3).png"
      alt="Loading..."
      className="clarisix-spinner"
      style={{ width: size, height: size }}
    />
  );
}

export function TableLoader({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="table-loader">
      <ClarisixSpinner size={48} />
      <span>{message}</span>
    </div>
  );
}

export function TableOverlay({ message = 'Refreshing...' }: { message?: string }) {
  return (
    <div className="table-overlay">
      <ClarisixSpinner size={40} />
      <span style={{ color: '#e2e8f0', fontSize: 13 }}>{message}</span>
    </div>
  );
}

export function SectionLoader({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <ClarisixSpinner size={56} />
      <span className="text-sm text-gray-400 font-medium">{message}</span>
    </div>
  );
}
