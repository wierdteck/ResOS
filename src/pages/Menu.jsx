import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Sparkles } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import EditableTable from '../components/EditableTable.jsx';
import { getMenuItems, saveMenuItems } from '../services/dataStore.js';
import { analyzeMenu } from '../utils/mockAi.js';
import { currency, getMenuAnalytics, percent } from '../utils/analytics.js';

const toneByRecommendation = {
  Keep: 'good',
  Promote: 'info',
  Reprice: 'warning',
  'Simplify/Remove': 'danger',
};

export default function Menu() {
  const [items, setItems] = useState(getMenuItems());
  const [summary, setSummary] = useState('');
  const analytics = getMenuAnalytics(items);

  function updateItem(id, key, value) {
    const next = items.map((item) => (item.id === id ? { ...item, [key]: value } : item));
    setItems(saveMenuItems(next));
  }

  const columns = [
    { key: 'name', label: 'Dish', render: (row) => <strong>{row.name}</strong> },
    { key: 'category', label: 'Category', render: (row) => row.category },
    { key: 'price', label: 'Price', type: 'number', step: '0.01' },
    { key: 'ingredientCost', label: 'Cost', type: 'number', step: '0.01' },
    { key: 'avgPrepMinutes', label: 'Prep Min', type: 'number', step: '1' },
    { key: 'salesThisWeek', label: 'Sales', type: 'number', step: '1' },
    { key: 'grossProfit', label: 'Gross Profit', render: (row) => currency(row.grossProfit) },
    { key: 'foodCostPercent', label: 'Food Cost', render: (row) => percent(row.foodCostPercent) },
    { key: 'weeklyGrossProfit', label: 'Weekly GP', render: (row) => currency(row.weeklyGrossProfit) },
    { key: 'profitPerPrepMinute', label: 'GP/Min', render: (row) => currency(row.profitPerPrepMinute) },
    { key: 'prepBurden', label: 'Prep Burden', render: (row) => `${row.prepBurden} min` },
    { key: 'recommendation', label: 'Action', render: (row) => <Badge tone={toneByRecommendation[row.recommendation]}>{row.recommendation}</Badge> },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div><p className="eyebrow">Menu Intelligence</p><h2>Profit and prep decisions</h2></div>
        <Button icon={Sparkles} onClick={() => setSummary(analyzeMenu(items))}>Analyze Menu</Button>
      </div>
      <p className="muted">Recommendations are deterministic analytics explained in natural language. No external AI service is called.</p>
      {summary ? <Card className="insight">{summary}</Card> : null}
      <EditableTable columns={columns} rows={analytics.rows} onChange={updateItem} />
      <section className="two-col">
        <Card>
          <h3>Weekly Gross Profit by Dish</h3>
          <Chart data={analytics.rows} dataKey="weeklyGrossProfit" />
        </Card>
        <Card>
          <h3>Prep Burden by Dish</h3>
          <Chart data={analytics.rows} dataKey="prepBurden" />
        </Card>
      </section>
    </div>
  );
}

function Chart({ data, dataKey }) {
  return (
    <div className="chart">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#206a5d" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
