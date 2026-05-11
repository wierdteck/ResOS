import { getComplianceAnalytics, getComplianceDisplayStatus, getMenuAnalytics, getProfileMismatches, getSupplierAnalytics, getReviewAnalytics, isUnsafeTemperature, currency } from './analytics.js';

function sentenceList(items) {
  return items.filter(Boolean).join(' ');
}

export function analyzeMenu(menuItems, recipeIngredients = [], supplierItems = []) {
  const { rows } = getMenuAnalytics(menuItems, recipeIngredients, supplierItems);
  const actions = rows.filter((item) => item.recommendation !== 'Keep');
  const topProfit = [...rows].sort((a, b) => b.weeklyGrossProfit - a.weeklyGrossProfit)[0];
  const bestMargin = [...rows].sort((a, b) => b.profitPerPrepMinute - a.profitPerPrepMinute)[0];

  return sentenceList([
    `${topProfit.name} is carrying the week with ${currency(topProfit.weeklyGrossProfit)} in gross profit.`,
    `${bestMargin.name} has the strongest profit per prep minute, so it is a good candidate for specials or staff suggestions.`,
    rows.some((item) => item.costIncomplete)
      ? `Recipe costing needs attention for ${rows.filter((item) => item.costIncomplete).map((item) => item.name).join(', ')}.`
      : 'Recipe-linked supplier costs are complete for auto-costed dishes.',
    actions.length
      ? `Action items: ${actions.map((item) => `${item.name}: ${item.recommendation}`).join('; ')}.`
      : 'The current menu mix is balanced; keep watching ingredient costs and prep bottlenecks.',
    'These recommendations are deterministic analytics translated into plain language, not an external AI call.',
  ]);
}

export function generateCompliancePlan(tasks) {
  const analytics = getComplianceAnalytics(tasks);
  const urgent = tasks.filter((task) => getComplianceDisplayStatus(task) === 'overdue' || task.riskLevel === 'high');
  return sentenceList([
    `There are ${analytics.overdue} overdue compliance tasks and ${analytics.highRiskOverdue} high-risk overdue tasks.`,
    urgent.length ? `Handle first: ${urgent.map((task) => `${task.title} (${task.owner})`).slice(0, 4).join(', ')}.` : 'No urgent compliance blockers are visible.',
    'Assign one owner per task, collect proof after completion, and review the due-soon queue at manager closeout.',
  ]);
}

export function suggestSupplierActions(supplierItems) {
  const analytics = getSupplierAnalytics(supplierItems);
  const savings = analytics.filter((row) => !row.unitMismatch && row.savings > 0);
  const mismatches = analytics.filter((row) => row.unitMismatch);
  return sentenceList([
    savings.length ? `Best immediate savings: ${savings.map((row) => `${row.ingredientName} via ${row.cheapest.supplierName} saves ${currency(row.savings)} per ${row.unit}`).join('; ')}.` : 'No direct same-unit savings were found.',
    mismatches.length ? `Manual comparison needed for: ${mismatches.map((row) => row.ingredientName).join(', ')} because units differ.` : 'All duplicate ingredients use comparable units.',
    'Balance price with reliability before switching a critical ingredient.',
  ]);
}

export function summarizeReviews(reviews) {
  const analytics = getReviewAnalytics(reviews);
  const urgent = reviews.filter((review) => review.urgency === 'high');
  return sentenceList([
    `Average rating is ${analytics.averageRating.toFixed(1)} across ${analytics.total} manually imported reviews.`,
    `${analytics.mostCommonComplaintCategory.replace('_', ' ')} is the most common category.`,
    urgent.length ? `Reply first to: ${urgent.map((review) => `${review.platform} ${review.rating}-star review`).join(', ')}.` : 'No high-urgency reviews are pending.',
  ]);
}

export function generateReviewReply(review) {
  const apology = review.rating <= 3 ? 'Thank you for telling us about this. We are sorry the visit missed the mark.' : 'Thank you for taking the time to share this.';
  const category = review.category.replace('_', ' ');
  return `${apology} We are reviewing the ${category} feedback with the team and appreciate the chance to improve. We hope to welcome you back to Corner Table Cafe soon.`;
}

export function generateProfileUpdatePlan(mismatches) {
  if (!mismatches.length) return 'All platform profiles match the source-of-truth business profile.';
  const byPlatform = mismatches.reduce((acc, row) => {
    acc[row.platform] = acc[row.platform] || [];
    acc[row.platform].push(row.field);
    return acc;
  }, {});
  return `Update these fields from the source of truth: ${Object.entries(byPlatform).map(([platform, fields]) => `${platform}: ${fields.join(', ')}`).join('; ')}. Do this through official platform dashboards or APIs only.`;
}

export function generateOverallActionPlan(allData) {
  const menu = getMenuAnalytics(allData.menuItems, allData.recipeIngredients, allData.supplierItems);
  const compliance = getComplianceAnalytics(allData.complianceTasks);
  const suppliers = getSupplierAnalytics(allData.supplierItems).filter((row) => !row.unitMismatch && row.savings > 0);
  const mismatches = getProfileMismatches(allData.businessProfiles);

  return [
    compliance.highRiskOverdue ? `Resolve ${compliance.highRiskOverdue} high-risk overdue compliance task before the next service window.` : 'Compliance has no high-risk overdue blocker.',
    menu.actionCount ? `Review ${menu.actionCount} menu item recommendation before ordering ingredients.` : 'Menu mix is healthy this week.',
    menu.incompleteRecipeCount ? `${menu.incompleteRecipeCount} recipe-linked item has incomplete supplier costing.` : 'Recipe-linked supplier changes are flowing into menu margins.',
    suppliers.length ? `Check supplier savings for ${suppliers.map((row) => row.ingredientName).join(', ')}.` : 'No same-unit supplier switches need immediate review.',
    mismatches.length ? `Clean up ${mismatches.length} business profile mismatches in future official integrations.` : 'Business profiles are aligned with source of truth.',
  ];
}
