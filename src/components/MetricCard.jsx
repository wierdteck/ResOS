import Card from './Card.jsx';

export default function MetricCard({ label, value, help, icon: Icon, tone = 'default' }) {
  return (
    <Card className={`metric metric-${tone}`}>
      <div>
        <p className="metric-label">{label}</p>
        <strong>{value}</strong>
        {help ? <span>{help}</span> : null}
      </div>
      {Icon ? <Icon size={24} /> : null}
    </Card>
  );
}
