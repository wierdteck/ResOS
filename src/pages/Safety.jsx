import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Sparkles } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import MetricCard from '../components/MetricCard.jsx';
import NumericInput from '../components/NumericInput.jsx';
import { getSafetyTasks, saveSafetyTasks } from '../services/dataStore.js';
import { chartRowsFromCounts, countBy, getSafetyAnalytics, isUnsafeTemperature } from '../utils/analytics.js';
import { generateSafetyPlan } from '../utils/mockAi.js';

const statusOptions = ['done', 'due_today', 'overdue'];

export default function Safety() {
  const [tasks, setTasks] = useState(getSafetyTasks());
  const [plan, setPlan] = useState('');
  const analytics = getSafetyAnalytics(tasks);
  const todayTasks = tasks.filter((task) => task.status === 'due_today' || task.status === 'overdue');

  function save(next) {
    setTasks(saveSafetyTasks(next));
  }

  function update(id, key, value) {
    save(tasks.map((task) => (task.id === id ? { ...task, [key]: value } : task)));
  }

  function markDone(id) {
    const today = new Date().toISOString().slice(0, 10);
    save(tasks.map((task) => (task.id === id ? { ...task, status: 'done', lastCompleted: today } : task)));
  }

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div><p className="eyebrow">Cleanliness & Food Safety</p><h2>Today’s checklist</h2></div>
        <Button icon={Sparkles} onClick={() => setPlan(generateSafetyPlan(tasks))}>Generate Safety Plan</Button>
      </div>
      <section className="metrics-grid small">
        <MetricCard label="Overdue" value={analytics.overdue} tone={analytics.overdue ? 'danger' : 'good'} />
        <MetricCard label="Due Today" value={analytics.dueToday} tone="warning" />
        <MetricCard label="Completed" value={analytics.completed} tone="good" />
        <MetricCard label="Unsafe Temperatures" value={analytics.unsafeTemperatures} tone={analytics.unsafeTemperatures ? 'danger' : 'good'} />
      </section>
      {plan ? <Card className="insight">{plan}</Card> : null}
      <Card>
        <h3>Today’s checklist</h3>
        <div className="checklist">
          {todayTasks.map((task) => (
            <button key={task.id} className="check-row" type="button" onClick={() => markDone(task.id)}>
              <CheckCircle2 size={18} />
              <span>{task.title}</span>
              <Badge tone={task.status === 'overdue' ? 'danger' : 'warning'}>{task.status.replace('_', ' ')}</Badge>
            </button>
          ))}
        </div>
      </Card>
      <section className="two-col uneven">
        <div className="task-list">
          {tasks.map((task) => {
            const unsafe = isUnsafeTemperature(task);
            return (
              <Card key={task.id} className={`task-card ${unsafe ? 'unsafe' : ''}`}>
                <div className="task-head">
                  <strong>{task.title}</strong>
                  <Badge tone={unsafe ? 'danger' : task.status === 'done' ? 'good' : task.status === 'overdue' ? 'danger' : 'warning'}>
                    {unsafe ? 'unsafe temp' : task.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="form-grid">
                  <label>Assigned To<input value={task.assignedTo} onChange={(event) => update(task.id, 'assignedTo', event.target.value)} /></label>
                  <label>Status<select value={task.status} onChange={(event) => update(task.id, 'status', event.target.value)}>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>Next Due<input type="date" value={task.nextDue} onChange={(event) => update(task.id, 'nextDue', event.target.value)} /></label>
                  <label>Temp F<NumericInput disabled={!task.requiresTemperatureLog} value={task.temperatureValue ?? 0} onCommit={(value) => update(task.id, 'temperatureValue', value)} /></label>
                  <label>Notes<input value={task.notes} onChange={(event) => update(task.id, 'notes', event.target.value)} /></label>
                </div>
                <Button variant="ghost" icon={CheckCircle2} onClick={() => markDone(task.id)}>Mark Done</Button>
              </Card>
            );
          })}
        </div>
        <Card>
          <h3>Safety Tasks by Area</h3>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart data={chartRowsFromCounts(countBy(tasks, 'area'))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#1f7a8c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
    </div>
  );
}
