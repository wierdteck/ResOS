import { Link } from 'react-router-dom';
import { BarChart3, ClipboardCheck, ShieldAlert, ShieldCheck, Sparkles, Star, TrendingUp, Truck } from 'lucide-react';
import Card from '../components/Card.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { getAllData } from '../services/dataStore.js';
import { currency, getComplianceAnalytics, getMenuAnalytics, getReviewAnalytics, getSafetyAnalytics, getSupplierAnalytics } from '../utils/analytics.js';
import { generateOverallActionPlan } from '../utils/mockAi.js';

const cards = [
  { to: 'menu', label: 'Menu Intelligence', text: 'Profitability, prep burden, and dish recommendations.', icon: BarChart3 },
  { to: 'compliance', label: 'Compliance', text: 'Permits, inspections, renewals, and risk tracking.', icon: ClipboardCheck },
  { to: 'safety', label: 'Safety', text: 'Cleaning checklist and temperature rule checks.', icon: ShieldCheck },
  { to: 'suppliers', label: 'Suppliers', text: 'Lightweight price comparison and history.', icon: Truck },
  { to: 'reputation', label: 'Reputation', text: 'Manual review insights and profile consistency.', icon: Sparkles },
];

export default function Dashboard() {
  const data = getAllData();
  const menu = getMenuAnalytics(data.menuItems, data.recipeIngredients, data.supplierItems);
  const compliance = getComplianceAnalytics(data.complianceTasks);
  const safety = getSafetyAnalytics(data.safetyTasks);
  const suppliers = getSupplierAnalytics(data.supplierItems).filter((row) => !row.unitMismatch && row.savings > 0);
  const reviews = getReviewAnalytics(data.reviews);
  const actionPlan = generateOverallActionPlan(data);

  return (
    <div className="page-stack">
      <section className="metrics-grid">
        <MetricCard icon={TrendingUp} label="Weekly Gross Profit" value={currency(menu.weeklyGrossProfit)} help="from seeded menu sales" />
        <MetricCard icon={BarChart3} label="Menu Items Needing Action" value={menu.actionCount} tone={menu.actionCount ? 'warning' : 'good'} />
        <MetricCard icon={ClipboardCheck} label="Overdue Compliance" value={compliance.overdue} tone={compliance.overdue ? 'danger' : 'good'} />
        <MetricCard icon={ShieldCheck} label="Overdue Safety" value={safety.overdue} tone={safety.overdue ? 'danger' : 'good'} />
        <MetricCard icon={ShieldAlert} label="Unsafe Temperatures" value={safety.unsafeTemperatures} tone={safety.unsafeTemperatures ? 'danger' : 'good'} />
        <MetricCard icon={Truck} label="Supplier Savings" value={suppliers.length} help="same-unit opportunities" />
        <MetricCard icon={Star} label="Average Rating" value={reviews.averageRating.toFixed(1)} help={`${reviews.total} mock reviews`} />
      </section>

      <Card className="action-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Today</p>
            <h2>Manager Action Plan</h2>
          </div>
        </div>
        <ol className="action-list">
          {actionPlan.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </Card>

      <section className="nav-card-grid">
        {cards.map((card) => (
          <Link to={card.to} className="nav-card" key={card.to}>
            <card.icon size={22} />
            <div>
              <strong>{card.label}</strong>
              <span>{card.text}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
