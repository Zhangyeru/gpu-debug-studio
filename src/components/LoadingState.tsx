export default function LoadingState() {
  return (
    <div className="tab-content">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-block"
          style={{ width: `${100 - (i % 3) * 20}%` }}
        />
      ))}
    </div>
  );
}
