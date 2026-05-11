import { Link } from 'react-router-dom';
import { BarChart3, ClipboardCheck, Sparkles, Star, TrendingUp, Truck } from 'lucide-react';
import Card from '../components/Card.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { useResosData } from '../services/ResosDataProvider.jsx';
import { currency, getComplianceAnalytics, getMenuAnalytics, getReviewAnalytics, getSupplierAnalytics } from '../utils/analytics.js';
import { generateOverallActionPlan } from '../utils/mockAi.js';

const cards = [
  { to: 'menu', label: 'Menu Intelligence', text: 'Profitability, prep burden, and dish recommendations.', icon: BarChart3 },
  { to: 'compliance', label: 'Compliance', text: 'Permits, inspections, renewals, and risk tracking.', icon: ClipboardCheck },
  { to: 'suppliers', label: 'Suppliers', text: 'Lightweight price comparison and history.', icon: Truck },
  { to: 'reputation', label: 'Reputation', text: 'Manual review insights and profile consistency.', icon: Sparkles },
];

export default function Dashboard() {
  const { data } = useResosData();
  const menu = getMenuAnalytics(data.menuItems, data.recipeIngredients, data.supplierItems);
  const compliance = getComplianceAnalytics(data.complianceTasks);
  const suppliers = getSupplierAnalytics(data.supplierItems).filter((row) => !row.unitMismatch && row.savings > 0);
  const reviews = getReviewAnalytics(data.reviews);
  const actionPlan = generateOverallActionPlan(data);


  return (
    <div className="page-stack">
      <section className="metrics-grid">
        <MetricCard icon={TrendingUp} label="Weekly Gross Profit" value={currency(menu.weeklyGrossProfit)} help="from seeded menu sales" />

        <Link to="/dashboard/menu">
        <MetricCard icon={BarChart3} label="Menu Items Needing Action" value={menu.actionCount} tone={menu.actionCount ? 'warning' : 'good'} />
        </Link>
        <Link to="/dashboard/compliance">
        <MetricCard icon={ClipboardCheck} label="Overdue Compliance" value={compliance.overdue} tone={compliance.overdue ? 'danger' : 'good'} />
        </Link>
        <Link to="/dashboard/suppliers">
        <MetricCard icon={Truck} label="Supplier Savings" value={suppliers.length} help="same-unit opportunities" />
        </Link>
        <Link to="/dashboard/reputation">
        <MetricCard icon={Star} label="Average Rating" value={reviews.averageRating.toFixed(1)} help={`${reviews.total} mock reviews`} />
        </Link>
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

     
    </div>
  );
}
