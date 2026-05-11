import { useMemo, useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import NumericInput from '../components/NumericInput.jsx';
import { getSupplierItems, getSupplierPriceHistory, saveSupplierItems, saveSupplierPriceHistory } from '../services/dataStore.js';
import { currency, getSupplierAnalytics } from '../utils/analytics.js';
import { suggestSupplierActions } from '../utils/mockAi.js';

const units = ['lb', 'oz', 'gal', 'qt', 'pt', 'fl oz', 'each', 'case', 'dozen', 'bag', 'box'];

export default function Suppliers() {
  const [items, setItems] = useState(getSupplierItems());
  const [history, setHistory] = useState(getSupplierPriceHistory());
  const [selectedId, setSelectedId] = useState(items[0]?.id || '');
  const [showOptimize, setShowOptimize] = useState(false);
  const [actions, setActions] = useState('');
  const analytics = getSupplierAnalytics(items);
  const selectedHistory = useMemo(() => history.filter((row) => row.supplierItemId === selectedId).slice(-6).reverse(), [history, selectedId]);

  function saveItems(next) {
    setItems(saveSupplierItems(next));
  }

  function appendHistory(item, note) {
    const next = [...history, { id: `hist-${Date.now()}`, supplierItemId: item.id, supplierName: item.supplierName, ingredientName: item.ingredientName, price: Number(item.price), unit: item.unit, updatedAt: new Date().toISOString().slice(0, 10), note }];
    setHistory(saveSupplierPriceHistory(next));
  }

  function update(id, key, value) {
    const next = items.map((item) => (item.id === id ? { ...item, [key]: value, lastUpdated: new Date().toISOString().slice(0, 10) } : item));
    const updated = next.find((item) => item.id === id);
    saveItems(next);
    if (key === 'price' || key === 'unit') appendHistory(updated, `${key} updated in demo table.`);
  }

  function addItem() {
    const item = { id: `sup-${Date.now()}`, supplierName: 'New Supplier', ingredientName: 'ingredient', price: 1, unit: 'lb', lastUpdated: new Date().toISOString().slice(0, 10), reliabilityScore: 80, deliveryDays: 'Mon', notes: '' };
    saveItems([...items, item]);
    setSelectedId(item.id);
    appendHistory(item, 'New supplier item created.');
  }

  function removeItem(id) {
    const next = items.filter((item) => item.id !== id);
    saveItems(next);
    if (selectedId === id) setSelectedId(next[0]?.id || '');
  }

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div><p className="eyebrow">Supplier Cost Tracking</p><h2>Same-unit price comparison</h2></div>
        <div className="button-row">
          <Button variant="secondary" icon={Plus} onClick={addItem}>Add Item</Button>
          <Button icon={Sparkles} onClick={() => setShowOptimize(true)}>Optimize Supplier Choices</Button>
          <Button variant="secondary" icon={Sparkles} onClick={() => setActions(suggestSupplierActions(items, history))}>Suggest Supplier Actions</Button>
        </div>
      </div>
      <p className="muted">This is lightweight supplier cost tracking, not inventory management. ResOS compares exact unit matches only.</p>
      <Card className="notice">Menu items using Auto From Recipe/Suppliers update automatically when supplier prices change.</Card>
      {actions ? <Card className="insight">{actions}</Card> : null}
      {showOptimize ? (
        <section className="supplier-grid">
          {analytics.map((row) => (
            <Card key={row.ingredientName}>
              <div className="task-head">
                <strong>{row.ingredientName}</strong>
                {row.unitMismatch ? <Badge tone="warning">unit mismatch</Badge> : <Badge tone="good">{row.unit}</Badge>}
              </div>
              {row.unitMismatch ? <p className="muted">Suppliers use different units. Keep this as a manual manager comparison.</p> : (
                <p><strong>{row.cheapest.supplierName}</strong> is cheapest at {currency(row.cheapest.price)} per {row.unit}. Potential spread: {currency(row.savings)}.</p>
              )}
            </Card>
          ))}
        </section>
      ) : null}

      <Card>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Supplier</th><th>Ingredient</th><th>Price</th><th>Unit</th><th>Reliability</th><th>Delivery</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={selectedId === item.id ? 'selected-row' : ''} onClick={() => setSelectedId(item.id)}>
                  <td><input value={item.supplierName} onChange={(event) => update(item.id, 'supplierName', event.target.value)} /></td>
                  <td><input value={item.ingredientName} onChange={(event) => update(item.id, 'ingredientName', event.target.value)} /></td>
                  <td><NumericInput value={item.price} step="0.01" onCommit={(value) => update(item.id, 'price', value)} /></td>
                  <td><select value={item.unit} onChange={(event) => update(item.id, 'unit', event.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></td>
                  <td><NumericInput value={item.reliabilityScore} min="0" max="100" onCommit={(value) => update(item.id, 'reliabilityScore', value)} /></td>
                  <td><input value={item.deliveryDays} onChange={(event) => update(item.id, 'deliveryDays', event.target.value)} /></td>
                  <td><input value={item.notes} onChange={(event) => update(item.id, 'notes', event.target.value)} /></td>
                  <td><button className="icon-only danger" type="button" onClick={() => removeItem(item.id)} aria-label="Remove supplier item"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3>Recent Price History</h3>
        {selectedHistory.length ? (
          <div className="history-list">
            {selectedHistory.map((row) => <p key={row.id}><strong>{row.updatedAt}</strong> {row.supplierName} {row.ingredientName}: {currency(row.price)} / {row.unit} - {row.note}</p>)}
          </div>
        ) : <p className="muted">Select an item to inspect its updates.</p>}
      </Card>
    </div>
  );
}
