import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Copy, MessageSquareText, Sparkles } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { useResosData } from '../services/ResosDataProvider.jsx';
import { chartRowsFromCounts, countBy, getProfileMismatches, getReviewAnalytics } from '../utils/analytics.js';
import { generateProfileUpdatePlan, generateReviewReply, summarizeReviews } from '../utils/mockAi.js';

const all = 'all';

export default function Reputation() {
  const { data, saveCollection } = useResosData();
  const [reviews, setReviews] = useState(data.reviews);
  const [platform, setPlatform] = useState(all);
  const [category, setCategory] = useState(all);
  const [urgency, setUrgency] = useState(all);
  const [summary, setSummary] = useState('');
  const [profilePlan, setProfilePlan] = useState('');
  const profiles = data.businessProfiles;
  const analytics = getReviewAnalytics(reviews);
  const mismatches = getProfileMismatches(profiles);
  const filtered = useMemo(() => reviews.filter((review) =>
    (platform === all || review.platform === platform) &&
    (category === all || review.category === category) &&
    (urgency === all || review.urgency === urgency)
  ), [reviews, platform, category, urgency]);

  useEffect(() => {
    setReviews(data.reviews);
  }, [data.reviews]);

  function save(next) {
    setReviews(next);
    void saveCollection('reviews', next).catch(() => {});
  }

  function draftReply(id) {
    save(reviews.map((review) => (review.id === id ? { ...review, replyDraft: generateReviewReply(review), replied: true } : review)));
  }

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div><p className="eyebrow">Mock Reputation/Profile Assistant</p><h2>Manual reviews and profile consistency</h2></div>
      </div>
      <Card className="notice">Demo mode: reviews and profile data are manually imported or connected through official APIs in a future version. ResOS does not scrape websites.</Card>
      <section className="metrics-grid small">
        <MetricCard label="Average Rating" value={analytics.averageRating.toFixed(1)} />
        <MetricCard label="Total Reviews" value={analytics.total} />
        <MetricCard label="Urgent Reviews" value={analytics.urgentReviews} tone={analytics.urgentReviews ? 'danger' : 'good'} />
        <MetricCard label="Common Category" value={analytics.mostCommonComplaintCategory.replace('_', ' ')} />
      </section>

      <div className="section-heading">
        <div className="filter-row">
          <select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value={all}>All platforms</option>{[...new Set(reviews.map((r) => r.platform))].map((value) => <option key={value}>{value}</option>)}</select>
          <select value={category} onChange={(event) => setCategory(event.target.value)}><option value={all}>All categories</option>{[...new Set(reviews.map((r) => r.category))].map((value) => <option key={value}>{value}</option>)}</select>
          <select value={urgency} onChange={(event) => setUrgency(event.target.value)}><option value={all}>All urgency</option>{[...new Set(reviews.map((r) => r.urgency))].map((value) => <option key={value}>{value}</option>)}</select>
        </div>
        <Button icon={Sparkles} onClick={() => setSummary(summarizeReviews(reviews))}>Summarize Reviews</Button>
      </div>
      {summary ? <Card className="insight">{summary}</Card> : null}
      <section className="two-col uneven">
        <div className="review-list">
          {filtered.map((review) => (
            <Card key={review.id} className={`review-card urgency-${review.urgency}`}>
              <div className="task-head">
                <strong>{review.platform} - {review.rating} stars</strong>
                <Badge tone={review.urgency === 'high' ? 'danger' : review.urgency === 'medium' ? 'warning' : 'good'}>{review.urgency}</Badge>
              </div>
              <p>{review.text}</p>
              <span className="muted">{review.date} - {review.category.replace('_', ' ')}</span>
              {review.replyDraft ? <div className="reply-draft"><strong>Reply draft</strong><p>{review.replyDraft}</p></div> : null}
              <Button variant="ghost" icon={MessageSquareText} onClick={() => draftReply(review.id)}>Generate Reply</Button>
            </Card>
          ))}
        </div>
        <Card>
          <h3>Review Categories</h3>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart data={chartRowsFromCounts(countBy(reviews, 'category'))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#b36b2c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="page-stack">
        <div className="section-heading">
          <div><p className="eyebrow">Profile Consistency</p><h2>Source of truth vs platforms</h2></div>
          <Button icon={Sparkles} onClick={() => setProfilePlan(generateProfileUpdatePlan(mismatches))}>Generate Profile Update Plan</Button>
        </div>
        {profilePlan ? <Card className="insight">{profilePlan}</Card> : null}
        <section className="profile-grid">
          {Object.entries(profiles).map(([name, profile]) => (
            <Card key={name}>
              <div className="task-head">
                <strong>{name === 'sourceOfTruth' ? 'Source of Truth' : name}</strong>
                <Badge tone={name === 'sourceOfTruth' ? 'info' : mismatches.some((row) => row.platform === name) ? 'warning' : 'good'}>
                  {name === 'sourceOfTruth' ? 'master' : `${mismatches.filter((row) => row.platform === name).length} mismatches`}
                </Badge>
              </div>
              {Object.entries(profile).map(([field, value]) => <p key={field}><strong>{field}</strong>: {value}</p>)}
            </Card>
          ))}
        </section>
        <Card>
          <h3>Mismatch Rows</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Platform</th><th>Field</th><th>Expected</th><th>Actual</th><th>Instruction</th></tr></thead>
              <tbody>
                {mismatches.map((row) => (
                  <tr key={`${row.platform}-${row.field}`}>
                    <td>{row.platform}</td>
                    <td>{row.field}</td>
                    <td>{row.expected}</td>
                    <td>{row.actual}</td>
                    <td><Copy size={14} /> Update {row.field} to match source of truth.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
