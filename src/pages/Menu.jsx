import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import NumericInput from '../components/NumericInput.jsx';
import { getMenuItems, getRecipeIngredients, getSupplierItems, saveMenuItems, saveRecipeIngredients } from '../services/dataStore.js';
import { analyzeMenuWithGemini } from '../services/geminiApi.js';
import { currency, getMenuAnalytics, getRecipeCost } from '../utils/analytics.js';

const units = ['lb', 'oz', 'gal', 'qt', 'pt', 'fl oz', 'each', 'case', 'dozen', 'bag', 'box'];

export default function Menu() {
  const [items, setItems] = useState(getMenuItems());
  const [recipes, setRecipes] = useState(getRecipeIngredients());
  const [supplierItems] = useState(getSupplierItems());
  const [selectedId, setSelectedId] = useState(items[0]?.id || '');
  const [summary, setSummary] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analytics = getMenuAnalytics(items, recipes, supplierItems);
  const selectedItem = items.find((item) => item.id === selectedId) || items[0];
  const selectedAnalytics = analytics.rows.find((item) => item.id === selectedItem?.id);

  function saveItems(next) {
    setItems(saveMenuItems(next));
  }

  function saveRecipes(next) {
    setRecipes(saveRecipeIngredients(next));
  }

  function updateItem(id, key, value) {
    saveItems(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function addMenuItem() {
    const item = {
      id: `menu-${Date.now()}`,
      name: 'New Menu Item',
      category: 'Entree',
      price: 0,
      ingredientCost: 0,
      costMode: 'recipe',
      avgPrepMinutes: 0,
      salesThisWeek: 0,
      station: 'Kitchen',
      notes: '',
      lastManualUpdate: 0,
      lastAutoUpdate: Date.now(),
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
        id: `rec-${Date.now()}`,
        menuItemId: selectedItem.id,
        ingredientName: firstSupplier?.ingredientName || '',
        quantity: 0,
        unit: firstSupplier?.unit || 'lb',
        costingMode: 'cheapest',
        supplierItemId: '',
        notes: '',
      },
    ]);
    updateItem(selectedItem.id, 'lastAutoUpdate', Date.now());
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
    // Update lastAutoUpdate for the menu item
    const recipeRow = recipes.find((row) => row.id === id);
    if (recipeRow) {
      updateItem(recipeRow.menuItemId, 'lastAutoUpdate', Date.now());
    }
  }

  function removeRecipe(id) {
    const recipeRow = recipes.find((row) => row.id === id);
    saveRecipes(recipes.filter((row) => row.id !== id));
    if (recipeRow) {
      updateItem(recipeRow.menuItemId, 'lastAutoUpdate', Date.now());
    }
  }

  async function analyzeMenu() {
    setIsAnalyzing(true);
    try {
      setSummary(await analyzeMenuWithGemini(items, analytics.rows, recipes, supplierItems));
    } catch (error) {
      setSummary(error.message || 'Menu analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div><p className="eyebrow">Menu Intelligence</p><h2>Profit and recipe-linked costing</h2></div>
        <div className="button-row">
          <Button variant="secondary" icon={Plus} onClick={addMenuItem}>Add Menu Item</Button>
          <Button icon={Sparkles} onClick={analyzeMenu}>{isAnalyzing ? 'Analyzing...' : 'Analyze Menu'}</Button>
        </div>
      </div>
      <p className="muted">Auto-costed dishes are calculated from supplier pricing.</p>
      {summary ? <Card className="insight">{summary}</Card> : null}

      <Card>
        <div className="table-wrap menu-table">
          <table>
            <thead>
              <tr>
                <th>Dish</th><th>Price</th><th>Ingredient Cost</th><th>Preparation time</th><th>Sales</th><th>Station</th><th>Profit</th><th></th>
              </tr>
            </thead>
            <tbody>
              {analytics.rows.map((row) => (
                <tr key={row.id} className={selectedId === row.id ? 'selected-row' : ''} onClick={() => setSelectedId(row.id)}>
                  <td><input value={row.name} onChange={(event) => updateItem(row.id, 'name', event.target.value)} /></td>
                  <td><NumericInput value={row.price} step="0.01" decimals={2} onCommit={(value) => updateItem(row.id, 'price', value)} /></td>
                  <td><span className="derived-value">{currency(row.effectiveIngredientCost)}</span></td>
                  <td><NumericInput value={row.avgPrepMinutes} step="1" decimals={0} onCommit={(value) => updateItem(row.id, 'avgPrepMinutes', value)} /> <span className="unit-label">minutes</span></td>
                  <td><NumericInput value={row.salesThisWeek} step="1" decimals={0} onCommit={(value) => updateItem(row.id, 'salesThisWeek', value)} /> <span className="unit-label">per week</span></td>
                  <td><input value={row.station} onChange={(event) => updateItem(row.id, 'station', event.target.value)} /></td>
                  <td><span className="derived-value">{currency(row.grossProfit)}</span></td>
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
      <div className="manual-cost-panel">
        
        <div><span>Auto recipe cost</span><strong>{currency(recipeCost.total)}</strong></div>
        <div><span>Estimated gross profit</span><strong>{currency(analyticsRow?.grossProfit || 0)}</strong></div>
        <div><span>Recommendation</span><strong>{analyticsRow?.recommendation || 'Keep'}</strong></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Ingredient</th><th>Quantity</th><th>Unit</th><th>Costing</th><th>Supplier</th><th>Line Cost</th><th></th></tr></thead>
          <tbody>
            {recipeCost.rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input list="supplier-ingredients" value={row.ingredientName} onChange={(event) => onUpdate(row.id, 'ingredientName', event.target.value)} />
                  <datalist id="supplier-ingredients">{ingredientNames.map((name) => <option key={name} value={name} />)}</datalist>
                </td>
                <td><NumericInput value={row.quantity} step="0.01" decimals={2} onCommit={(value) => onUpdate(row.id, 'quantity', value)} /></td>
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