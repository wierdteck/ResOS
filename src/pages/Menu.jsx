import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import NumericInput from '../components/NumericInput.jsx';
import { useResosData } from '../services/ResosDataProvider.jsx';
import { analyzeMenu } from '../utils/mockAi.js';
import { currency, getMenuAnalytics, getRecipeCost, percent } from '../utils/analytics.js';
import { createId } from '../utils/ids.js';

const units = ['lb', 'oz', 'gal', 'qt', 'pt', 'fl oz', 'each', 'case', 'dozen', 'bag', 'box'];
const toneByRecommendation = {
  Keep: 'good',
  Promote: 'info',
  Reprice: 'warning',
  'Simplify/Remove': 'danger',
};

export default function Menu() {
  const { data, saveCollection } = useResosData();
  const [items, setItems] = useState(data.menuItems);
  const [recipes, setRecipes] = useState(data.recipeIngredients);
  const [selectedId, setSelectedId] = useState(items[0]?.id || '');
  const [summary, setSummary] = useState('');
  const supplierItems = data.supplierItems;
  const analytics = getMenuAnalytics(items, recipes, supplierItems);
  const selectedItem = items.find((item) => item.id === selectedId) || items[0];
  const selectedAnalytics = analytics.rows.find((item) => item.id === selectedItem?.id);

  useEffect(() => {
    setItems(data.menuItems);
    setRecipes(data.recipeIngredients);
    setSelectedId((current) => (data.menuItems.some((item) => item.id === current) ? current : data.menuItems[0]?.id || ''));
  }, [data.menuItems, data.recipeIngredients]);

  function saveItems(next) {
    setItems(next);
    void saveCollection('menuItems', next).catch(() => {});
  }

  function saveRecipes(next) {
    setRecipes(next);
    void saveCollection('recipeIngredients', next).catch(() => {});
  }

  function updateItem(id, key, value) {
    saveItems(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function addMenuItem() {
    const item = {
      id: createId('menu'),
      name: 'New Menu Item',
      category: 'Entree',
      price: 0,
      ingredientCost: 0,
      costMode: 'manual',
      avgPrepMinutes: 0,
      salesThisWeek: 0,
      station: 'Kitchen',
      notes: '',
    };
    saveItems([...items, item]);
    setSelectedId(item.id);
  }

  function removeMenuItem(id) {
    const nextItems = items.filter((item) => item.id !== id);
    const nextRecipes = recipes.filter((row) => row.menuItemId !== id);
    saveItems(nextItems);
    saveRecipes(nextRecipes);
    if (selectedId === id) setSelectedId(nextItems[0]?.id || '');
  }

  function addRecipeRow() {
    if (!selectedItem) return;
    const firstSupplier = supplierItems[0];
    saveRecipes([
      ...recipes,
      {
        id: createId('rec'),
        menuItemId: selectedItem.id,
        ingredientName: firstSupplier?.ingredientName || '',
        quantity: 0,
        unit: firstSupplier?.unit || 'lb',
        costingMode: 'cheapest',
        supplierItemId: '',
        notes: '',
      },
    ]);
  }

  function updateRecipe(id, key, value) {
    saveRecipes(recipes.map((row) => {
      if (row.id !== id) return row;
      const next = { ...row, [key]: value };
      if (key === 'costingMode' && value === 'cheapest') next.supplierItemId = '';
      if (key === 'supplierItemId') {
        const supplier = supplierItems.find((item) => item.id === value);
        if (supplier) {
          next.ingredientName = supplier.ingredientName;
          next.unit = supplier.unit;
        }
      }
      return next;
    }));
  }

  function removeRecipe(id) {
    saveRecipes(recipes.filter((row) => row.id !== id));
  }

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div><p className="eyebrow">Menu Intelligence</p><h2>Profit and recipe-linked costing</h2></div>
        <div className="button-row">
          <Button variant="secondary" icon={Plus} onClick={addMenuItem}>Add Menu Item</Button>
          <Button icon={Sparkles} onClick={() => setSummary(analyzeMenu(items, recipes, supplierItems))}>Analyze Menu</Button>
        </div>
      </div>
      <p className="muted"> Manual cost have to be typed in while auto-costed dishes are calculated from supplier pricing. Further customization is in the recipe cost builder section. Recommendations are computed are based on a combination of profit, food cost, prep time, and sales number.</p>
      {summary ? <Card className="insight">{summary}</Card> : null}

      <Card>
        <div className="table-wrap menu-table">
          <table>
            <thead>
              <tr>
                <th>Dish</th><th>Category</th><th>Cost Mode</th><th>Price</th><th>Ingredient Cost</th><th>Prep</th><th>Sales</th><th>Station</th><th>Profit</th><th>Food Cost</th><th>Notes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {analytics.rows.map((row) => (
                <tr key={row.id} className={selectedId === row.id ? 'selected-row' : ''} onClick={() => setSelectedId(row.id)}>
                  <td><input value={row.name} onChange={(event) => updateItem(row.id, 'name', event.target.value)} /></td>
                  <td><input value={row.category} onChange={(event) => updateItem(row.id, 'category', event.target.value)} /></td>
                  <td>
                    <select value={row.costMode} onChange={(event) => updateItem(row.id, 'costMode', event.target.value)}>
                      <option value="manual">Manual Cost</option>
                      <option value="recipe">Auto From Recipe/Suppliers</option>
                    </select>
                  </td>
                  <td><NumericInput value={row.price} step="0.01" onCommit={(value) => updateItem(row.id, 'price', value)} /></td>
                  <td>
                    {row.costMode === 'recipe' ? (
                      <span className="derived-value">{currency(row.effectiveIngredientCost)}</span>
                    ) : (
                      <NumericInput value={row.ingredientCost} step="0.01" onCommit={(value) => updateItem(row.id, 'ingredientCost', value)} />
                    )}
                  </td>
                  <td><NumericInput value={row.avgPrepMinutes} step="1" onCommit={(value) => updateItem(row.id, 'avgPrepMinutes', value)} /></td>
                  <td><NumericInput value={row.salesThisWeek} step="1" onCommit={(value) => updateItem(row.id, 'salesThisWeek', value)} /></td>
                  <td><input value={row.station} onChange={(event) => updateItem(row.id, 'station', event.target.value)} /></td>
                  <td><span className="derived-value">{currency(row.grossProfit)}</span></td>
                  <td><span className="derived-value">{percent(row.foodCostPercent)}</span></td>
                  <td><input value={row.notes} onChange={(event) => updateItem(row.id, 'notes', event.target.value)} /></td>
                  <td>
                    <button
                      className="icon-only danger"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeMenuItem(row.id);
                      }}
                      aria-label="Remove menu item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedItem ? (
        <RecipeBuilder
          menuItem={selectedItem}
          analyticsRow={selectedAnalytics}
          recipeRows={recipes.filter((row) => row.menuItemId === selectedItem.id)}
          supplierItems={supplierItems}
          onUpdateMenuItem={updateItem}
          onAdd={addRecipeRow}
          onUpdate={updateRecipe}
          onRemove={removeRecipe}
        />
      ) : null}

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

function RecipeBuilder({ menuItem, analyticsRow, recipeRows, supplierItems, onUpdateMenuItem, onAdd, onUpdate, onRemove }) {
  const recipeCost = getRecipeCost(menuItem.id, recipeRows, supplierItems);
  const ingredientNames = useMemo(() => [...new Set(supplierItems.map((item) => item.ingredientName))], [supplierItems]);
  const specificSuppliers = (row) => supplierItems.filter((item) => item.ingredientName === row.ingredientName || item.id === row.supplierItemId);

  if (menuItem.costMode === 'manual') {
    return (
      <Card className="recipe-builder">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Manual Cost Builder</p>
            <h2>{menuItem.name}</h2>
          </div>
        </div>
        <p className="muted">This item is using a manually entered ingredient cost, so supplier recipe rows are not required.</p>
        <div className="manual-cost-panel">
          <label>
            Manual ingredient cost
            <NumericInput value={menuItem.ingredientCost} step="0.01" onCommit={(value) => onUpdateMenuItem(menuItem.id, 'ingredientCost', value)} />
          </label>
          <div><span>Price</span><strong>{currency(menuItem.price)}</strong></div>
          <div><span>Estimated gross profit</span><strong>{currency(analyticsRow?.grossProfit || 0)}</strong></div>
          <div><span>Food cost margin</span><strong>{percent(analyticsRow?.foodCostPercent || 0)}</strong></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="recipe-builder">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Recipe Cost Builder</p>
          <h2>{menuItem.name}</h2>
        </div>
        <div className="button-row">
          <Button variant="secondary" icon={Plus} onClick={onAdd}>Add Ingredient</Button>
        </div>
      </div>
      <p className="muted">Use Cheapest Supplier to automatically follow the lowest matching supplier price. Use Specific Supplier to lock a recipe to one supplier.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Ingredient</th><th>Quantity</th><th>Unit</th><th>Costing</th><th>Supplier</th><th>Line Cost</th><th>Status</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            {recipeCost.rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input list="supplier-ingredients" value={row.ingredientName} onChange={(event) => onUpdate(row.id, 'ingredientName', event.target.value)} />
                  <datalist id="supplier-ingredients">{ingredientNames.map((name) => <option key={name} value={name} />)}</datalist>
                </td>
                <td><NumericInput value={row.quantity} step="0.01" onCommit={(value) => onUpdate(row.id, 'quantity', value)} /></td>
                <td><select value={row.unit} onChange={(event) => onUpdate(row.id, 'unit', event.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></td>
                <td>
                  <select value={row.costingMode} onChange={(event) => onUpdate(row.id, 'costingMode', event.target.value)}>
                    <option value="cheapest">Cheapest supplier</option>
                    <option value="specificSupplier">Specific supplier</option>
                  </select>
                </td>
                <td>
                  <select disabled={row.costingMode !== 'specificSupplier'} value={row.supplierItemId || ''} onChange={(event) => onUpdate(row.id, 'supplierItemId', event.target.value)}>
                    <option value="">Select supplier</option>
                    {specificSuppliers(row).map((item) => <option key={item.id} value={item.id}>{item.supplierName} - {currency(item.price)} / {item.unit}</option>)}
                  </select>
                </td>
                <td><span className="derived-value">{currency(row.lineCost)}</span></td>
                <td>{row.warning ? <Badge tone="warning">{row.warning.includes('unit') ? 'Unit Mismatch' : 'Incomplete Cost'}</Badge> : <Badge tone="good">Matched</Badge>}</td>
                <td><input value={row.notes || ''} onChange={(event) => onUpdate(row.id, 'notes', event.target.value)} /></td>
                <td><button className="icon-only danger" type="button" onClick={() => onRemove(row.id)} aria-label="Remove recipe ingredient"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {recipeCost.incomplete ? <p className="muted warning-text">One or more recipe rows are excluded from the total until a matching supplier and unit are available.</p> : null}
    </Card>
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
