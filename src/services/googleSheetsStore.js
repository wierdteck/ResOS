// Future adapter stub.
//
// The MVP uses localStorage through dataStore.js. This file documents the same
// conceptual boundary for a future Google Sheets source of truth, where each
// collection would map to a worksheet tab containing spreadsheet-shaped rows.
// A real implementation would require OAuth, token refresh, sheet ID selection,
// conflict handling, and explicit user consent. None of that is needed for the
// offline hackathon demo.

export async function getAllData() {
  throw new Error('Google Sheets adapter is a future integration and is not enabled in demo mode.');
}

export async function saveAllData() {
  throw new Error('Google Sheets adapter is a future integration and is not enabled in demo mode.');
}

export async function getCollection() {
  throw new Error('Google Sheets adapter is a future integration and is not enabled in demo mode.');
}

export async function saveCollection() {
  throw new Error('Google Sheets adapter is a future integration and is not enabled in demo mode.');
}

export async function resetDemoData() {
  throw new Error('Google Sheets adapter is a future integration and is not enabled in demo mode.');
}
