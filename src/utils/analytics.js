export function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

export function percent(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

export function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function safeDivide(numerator, denominator, fallback = 0) {
  const top = safeNumber(numerator);
  const bottom = safeNumber(denominator);
  if (bottom === 0) return fallback;
  return top / bottom;
}

export function resolveRecipeIngredientCost(recipeRow, supplierItems) {
  const quantity = safeNumber(recipeRow.quantity);
  let supplier = null;
  let warning = '';

  if (recipeRow.costingMode === 'specificSupplier') {
    supplier = supplierItems.find((item) => item.id === recipeRow.supplierItemId);
    if (!supplier) warning = 'No supplier selected';
    else if (supplier.unit !== recipeRow.unit) warning = 'unit mismatch; compare manually';
  } else {
    const ingredientMatches = supplierItems.filter((item) => item.ingredientName === recipeRow.ingredientName);
    const unitMatches = ingredientMatches.filter((item) => item.unit === recipeRow.unit);
    if (!ingredientMatches.length) warning = 'No matching supplier';
    else if (!unitMatches.length) warning = 'unit mismatch; compare manually';
    else supplier = [...unitMatches].sort((a, b) => safeNumber(a.price) - safeNumber(b.price))[0];
  }

  if (warning) {
    return { ...recipeRow, supplier: supplier || null, lineCost: 0, warning, complete: false };
  }

  return {
    ...recipeRow,
    supplier,
    lineCost: quantity * safeNumber(supplier.price),
    warning: '',
    complete: true,
  };
}

export function getRecipeCost(menuItemId, recipeIngredients = [], supplierItems = []) {
  const rows = recipeIngredients
    .filter((row) => row.menuItemId === menuItemId)
    .map((row) => resolveRecipeIngredientCost(row, supplierItems));
  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.lineCost, 0),
    incomplete: rows.some((row) => !row.complete),
  };
}

export function effectiveIngredientCost(menuItem, recipeIngredients = [], supplierItems = []) {
  if (menuItem.costMode !== 'recipe') {
    return {
      cost: safeNumber(menuItem.ingredientCost),
      incomplete: false,
      source: 'manual',
      recipeRows: [],
    };
  }

  const recipe = getRecipeCost(menuItem.id, recipeIngredients, supplierItems);
  return {
    cost: recipe.total,
    incomplete: recipe.incomplete || recipe.rows.length === 0,
    source: 'recipe',
    recipeRows: recipe.rows,
  };
}

export function getMenuMetrics(item, recipeIngredients = [], supplierItems = []) {
  const price = Number(item.price) || 0;
  const costInfo = effectiveIngredientCost(item, recipeIngredients, supplierItems);
  const ingredientCost = costInfo.cost;
  const avgPrepMinutes = safeNumber(item.avgPrepMinutes);
  const salesThisWeek = safeNumber(item.salesThisWeek);
  const grossProfit = price - ingredientCost;
  const foodCostPercent = safeDivide(ingredientCost, price);
  const weeklyRevenue = price * salesThisWeek;
  const weeklyGrossProfit = grossProfit * salesThisWeek;
  const profitPerPrepMinute = safeDivide(grossProfit, avgPrepMinutes);
  const prepBurden = avgPrepMinutes * salesThisWeek;
  const recommendation = getMenuRecommendation({ salesThisWeek, foodCostPercent, grossProfit, prepBurden, profitPerPrepMinute });

  return {
    grossProfit,
    foodCostPercent,
    weeklyRevenue,
    weeklyGrossProfit,
    profitPerPrepMinute,
    prepBurden,
    recommendation,
    effectiveIngredientCost: ingredientCost,
    costIncomplete: costInfo.incomplete,
    costSource: costInfo.source,
    recipeRows: costInfo.recipeRows,
  };
}

export function getMenuRecommendation(metrics) {
  const highSales = metrics.salesThisWeek >= 60;
  const lowSales = metrics.salesThisWeek < 35;
  const goodMargin = metrics.foodCostPercent <= 0.35;
  const weakMargin = metrics.foodCostPercent > 0.38;
  const highPrepBurden = metrics.prepBurden >= 300;

  if (highSales && goodMargin) return 'Keep';
  if (!highSales && goodMargin && metrics.profitPerPrepMinute >= 1.2) return 'Promote';
  if (highSales && weakMargin) return 'Reprice';
  if (lowSales && metrics.grossProfit < 8 && highPrepBurden) return 'Simplify/Remove';
  if (lowSales && highPrepBurden) return 'Simplify/Remove';
  return 'Keep';
}

export function getMenuAnalytics(menuItems, recipeIngredients = [], supplierItems = []) {
  const rows = menuItems.map((item) => ({ ...item, ...getMenuMetrics(item, recipeIngredients, supplierItems) }));
  return {
    rows,
    weeklyGrossProfit: rows.reduce((sum, item) => sum + item.weeklyGrossProfit, 0),
    actionCount: rows.filter((item) => item.recommendation !== 'Keep').length,
    incompleteRecipeCount: rows.filter((item) => item.costIncomplete).length,
  };
}

export function getComplianceAnalytics(tasks) {
  return {
    total: tasks.length,
    overdue: tasks.filter((task) => task.status === 'overdue').length,
    dueSoon: tasks.filter((task) => task.status === 'due_soon').length,
    compliant: tasks.filter((task) => task.status === 'compliant').length,
    highRiskOverdue: tasks.filter((task) => task.status === 'overdue' && task.riskLevel === 'high').length,
  };
}

export function isUnsafeTemperature(task) {
  if (!task.requiresTemperatureLog || task.temperatureValue === undefined || task.temperatureValue === '') return false;
  const value = Number(task.temperatureValue);
  if (task.temperatureType === 'fridge') return value > 40;
  if (task.temperatureType === 'freezer') return value > 0;
  if (task.temperatureType === 'hot_holding') return value < 135;
  return false;
}

export function getSafetyAnalytics(tasks) {
  return {
    overdue: tasks.filter((task) => task.status === 'overdue').length,
    dueToday: tasks.filter((task) => task.status === 'due_today').length,
    completed: tasks.filter((task) => task.status === 'done').length,
    unsafeTemperatures: tasks.filter(isUnsafeTemperature).length,
    temperatureChecksLogged: tasks.filter((task) => task.requiresTemperatureLog && task.temperatureValue !== undefined && task.temperatureValue !== '').length,
  };
}

export function getSupplierAnalytics(items) {
  const groups = items.reduce((acc, item) => {
    acc[item.ingredientName] = acc[item.ingredientName] || [];
    acc[item.ingredientName].push(item);
    return acc;
  }, {});

  return Object.entries(groups).map(([ingredientName, rows]) => {
    const units = [...new Set(rows.map((row) => row.unit))];
    if (units.length !== 1) {
      return { ingredientName, unitMismatch: true, message: 'unit mismatch; compare manually', rows };
    }

    const sorted = [...rows].sort((a, b) => safeNumber(a.price) - safeNumber(b.price));
    const cheapest = sorted[0];
    const mostExpensive = sorted[sorted.length - 1];
    return {
      ingredientName,
      unitMismatch: false,
      unit: units[0],
      cheapest,
      alternatives: sorted.slice(1),
      savings: safeNumber(mostExpensive.price) - safeNumber(cheapest.price),
      rows: sorted,
    };
  });
}

export function getReviewAnalytics(reviews) {
  const total = reviews.length;
  const averageRating = total ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / total : 0;
  const categoryCounts = reviews.reduce((acc, review) => {
    acc[review.category] = (acc[review.category] || 0) + 1;
    return acc;
  }, {});
  const mostCommonComplaintCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

  return {
    averageRating,
    total,
    urgentReviews: reviews.filter((review) => review.urgency === 'high').length,
    mostCommonComplaintCategory,
  };
}

export function getProfileMismatches(profiles) {
  const source = profiles.sourceOfTruth;
  return Object.entries(profiles)
    .filter(([platform]) => platform !== 'sourceOfTruth')
    .flatMap(([platform, profile]) =>
      Object.keys(source)
        .filter((field) => source[field] !== profile[field])
        .map((field) => ({ platform, field, expected: source[field], actual: profile[field] || 'Not listed' }))
    );
}

export function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || 'Unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

export function chartRowsFromCounts(counts) {
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}
