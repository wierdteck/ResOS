async function requestGeminiText(prompt) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, responseFormat: 'text' }),
  });

  let text = '';
  try {
    text = await response.text();
  } catch (e) {
    console.error('[Gemini] Failed to read response:', e);
    throw new Error('Failed to read API response');
  }

  if (!response.ok) {
    console.error('[Gemini] API error:', text);
    try {
      const payload = JSON.parse(text);
      throw new Error(payload.error || `API error (${response.status})`);
    } catch (e) {
      throw new Error(`API error (${response.status}): ${text.substring(0, 100)}`);
    }
  }

  try {
    const payload = JSON.parse(text);
    return payload.text;
  } catch (e) {
    console.error('[Gemini] Invalid JSON response:', text);
    throw new Error(`Invalid API response: ${text.substring(0, 100)}`);
  }
}

export function analyzeMenuWithGemini(menuItems, analyticsRows, recipeIngredients, supplierItems) {
  // Modify this prompt to control the Menu page Gemini input and expected output.
  return requestGeminiText(`
You are helping a restaurant manager analyze menu profitability.
Return 3 concise plain-text sentences. Do not use markdown.
Focus on profit, prep time, weekly sales, supplier-linked recipe costs, and incomplete costing.

Menu analytics:
${JSON.stringify(analyticsRows, null, 2)}

Recipe ingredients:
${JSON.stringify(recipeIngredients, null, 2)}

Supplier prices:
${JSON.stringify(supplierItems, null, 2)}

Raw menu items:
${JSON.stringify(menuItems, null, 2)}
`);
}

export function optimizeSuppliersWithGemini(supplierItems, supplierAnalytics) {
  // Modify this prompt to control the Suppliers page Gemini input and expected output.
  return requestGeminiText(`
You are helping a restaurant manager choose supplier options.
Return 3 concise plain-text sentences. Do not use markdown.
Use exact-unit comparisons only and call out unit mismatches as manual review.

Supplier analytics:
${JSON.stringify(supplierAnalytics, null, 2)}

Supplier items:
${JSON.stringify(supplierItems, null, 2)}
`);
}

