interface StatCardProps {
  label: string;
  price: number;
  date: string;
  color: string;
}

export default function StatCard({ label, price, date, color }: StatCardProps) {
  return (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-label">{label}</div>
      <div className="stat-price">${price.toFixed(2)}</div>
      <div className="stat-date">{date}</div>
    </div>
  );
}
