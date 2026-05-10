import { ArrowRight, ClipboardCheck, ShieldCheck, TrendingUp, Truck } from 'lucide-react';
import Button from '../components/Button.jsx';

export default function Landing() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Hackathon MVP</div>
          <h1>ResOS</h1>
          <p className="tagline">A lightweight operating dashboard for independent restaurants.</p>
          <p>
            ResOS helps small teams turn paper checklists, scattered spreadsheets, and manager memory into one calm place for daily decisions.
          </p>
          <Button to="/dashboard" icon={ArrowRight}>Open Dashboard</Button>
        </div>
        <div className="hero-panel" aria-hidden="true">
          <div className="mini-chart">
            <span style={{ height: '46%' }} />
            <span style={{ height: '64%' }} />
            <span style={{ height: '82%' }} />
            <span style={{ height: '55%' }} />
            <span style={{ height: '74%' }} />
          </div>
          <div className="hero-stat"><strong>$3.8k</strong><span>weekly gross profit signal</span></div>
          <div className="hero-stat"><strong>3</strong><span>manager actions today</span></div>
        </div>
      </section>
      <section className="job-grid">
        <article><TrendingUp /><h2>Menu decisions</h2><p>Spot dishes to keep, promote, reprice, or simplify using deterministic profitability analytics.</p></article>
        <article><ClipboardCheck /><h2>Compliance</h2><p>Track permits, inspections, renewals, training, and tax tasks before they become fire drills.</p></article>
        <article><ShieldCheck /><h2>Cleanliness and food safety</h2><p>Run daily checklists and catch unsafe fridge, freezer, and hot-holding temperatures.</p></article>
        <article><Truck /><h2>Supplier support</h2><p>Compare same-unit supplier prices and keep a simple cost history without becoming inventory software.</p></article>
      </section>
    </main>
  );
}
