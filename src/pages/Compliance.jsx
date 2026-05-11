import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Plus, Sparkles, Trash2 } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { getComplianceTasks, saveComplianceTasks } from '../services/dataStore.js';
import { chartRowsFromCounts, countBy, getComplianceAnalytics, getComplianceDisplayStatus } from '../utils/analytics.js';
import { generateCompliancePlan } from '../utils/mockAi.js';

const categories = ['License', 'Permit', 'Inspection', 'Training', 'Tax', 'Insurance'];
const riskOptions = ['low', 'medium', 'high'];

export default function Compliance() {
  const [tasks, setTasks] = useState(getComplianceTasks());
  const [plan, setPlan] = useState('');
  const analytics = getComplianceAnalytics(tasks);

  function save(next) {
    setTasks(saveComplianceTasks(next));
  }

  function update(id, key, value) {
    save(tasks.map((task) => (task.id === id ? { ...task, [key]: value } : task)));
  }

  function addTask() {
    save([...tasks, { id: `comp-${Date.now()}`, title: 'New compliance task', category: 'Permit', owner: 'Maya', dueDate: '2026-05-31', recurrence: 'one-time', status: 'scheduled', riskLevel: 'medium', notes: '' }]);
  }

  function markDone(id) {
    save(tasks.map((task) => (
      task.id === id
        ? { ...task, status: 'compliant', completedAt: new Date().toISOString().slice(0, 10) }
        : task
    )));
  }

  function deleteTask(id) {
    save(tasks.filter((task) => task.id !== id));
  }

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div><p className="eyebrow">Compliance Tracker</p><h2>Permits, renewals, inspections</h2></div>
        <div className="button-row">
          <Button variant="secondary" icon={Plus} onClick={addTask}>Add Task</Button>
          <Button icon={Sparkles} onClick={() => setPlan(generateCompliancePlan(tasks))}>Generate Compliance Plan</Button>
        </div>
      </div>
      <section className="metrics-grid small">
        <MetricCard label="Total" value={analytics.total} />
        <MetricCard label="Overdue" value={analytics.overdue} tone={analytics.overdue ? 'danger' : 'good'} />
        <MetricCard label="Urgent" value={analytics.dueSoon} tone="warning" />
        <MetricCard label="Compliant" value={analytics.compliant} tone="good" />
        <MetricCard label="High-Risk Overdue" value={analytics.highRiskOverdue} tone={analytics.highRiskOverdue ? 'danger' : 'good'} />
      </section>
      {plan ? <Card className="insight">{plan}</Card> : null}
      <section className="two-col uneven">
        <div className="task-list">
          {tasks.map((task) => {
            const displayStatus = getComplianceDisplayStatus(task);
            const isDone = displayStatus === 'compliant';
            const statusTone = displayStatus === 'overdue' ? 'danger' : displayStatus === 'urgent' ? 'warning' : displayStatus === 'compliant' ? 'good' : 'info';
            return (
              <Card key={task.id} className={`task-card priority-${displayStatus}-${task.riskLevel}`}>
                <div className="task-head">
                  <input value={task.title} onChange={(event) => update(task.id, 'title', event.target.value)} />
                  <Badge tone={statusTone}>{displayStatus}</Badge>
                </div>
                <div className="form-grid">
                  <label>Category<select value={task.category} onChange={(event) => update(task.id, 'category', event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>Owner<input value={task.owner} onChange={(event) => update(task.id, 'owner', event.target.value)} /></label>
                  <label>Due Date<input type="date" value={task.dueDate} onChange={(event) => update(task.id, 'dueDate', event.target.value)} /></label>
                  <label>Risk<select value={task.riskLevel} onChange={(event) => update(task.id, 'riskLevel', event.target.value)}>{riskOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>Notes<input value={task.notes} onChange={(event) => update(task.id, 'notes', event.target.value)} /></label>
                </div>
                <div className="button-row">
                  {isDone ? (
                    <Button variant="ghost" icon={Trash2} onClick={() => deleteTask(task.id)}>Delete Task</Button>
                  ) : (
                    <Button variant="ghost" icon={CheckCircle2} onClick={() => markDone(task.id)}>Mark Done</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        <Card>
          <h3>Tasks by Status</h3>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart data={chartRowsFromCounts(countBy(analytics.rows, 'derivedStatus'))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#425c8a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
    </div>
  );
}
