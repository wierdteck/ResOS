import JSZip from 'jszip';
import Papa from 'papaparse';
import { cloneInitialData } from '../data/mockData.js';
import { normalizeResosData } from './dataShape.js';

const APP_NAME = 'ResOS';
const SCHEMA_VERSION = 1;
const METADATA_FILE = 'metadata.json';
const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const MAX_CSV_TEXT_BYTES = 1024 * 1024;
const FORMULA_PREFIX_PATTERN = /^[=+\-@\t\r]/;

const profileColumns = [
  { key: 'platform', type: 'string' },
  { key: 'restaurantName', type: 'string' },
  { key: 'phone', type: 'string' },
  { key: 'address', type: 'string' },
  { key: 'mondayHours', type: 'string' },
  { key: 'fridayHours', type: 'string' },
  { key: 'menuUrl', type: 'string' },
  { key: 'holidayHours', type: 'string' },
  { key: 'deliveryUrl', type: 'string' },
];

const tableSchemas = [
  {
    name: 'restaurant_profile',
    fileName: 'restaurant_profile.csv',
    columns: [
      { key: 'restaurantName', type: 'string' },
      { key: 'address', type: 'string' },
      { key: 'phone', type: 'string' },
      { key: 'cuisine', type: 'string' },
      { key: 'ownerName', type: 'string' },
      { key: 'weeklySalesGoal', type: 'number' },
    ],
    toRows: (data) => [data.restaurantProfile || {}],
    applyRows: (data, rows) => {
      if (rows.length !== 1) {
        throw new Error('restaurant_profile.csv must contain exactly one restaurant profile row.');
      }
      data.restaurantProfile = rows[0];
    },
  },
  {
    name: 'menu_items',
    fileName: 'menu_items.csv',
    collectionKey: 'menuItems',
    columns: [
      { key: 'id', type: 'string' },
      { key: 'name', type: 'string' },
      { key: 'category', type: 'string' },
      { key: 'price', type: 'number' },
      { key: 'ingredientCost', type: 'number' },
      { key: 'costMode', type: 'string' },
      { key: 'avgPrepMinutes', type: 'number' },
      { key: 'salesThisWeek', type: 'number' },
      { key: 'station', type: 'string' },
      { key: 'notes', type: 'string' },
    ],
  },
  {
    name: 'supplier_costs',
    fileName: 'supplier_costs.csv',
    collectionKey: 'supplierItems',
    columns: [
      { key: 'id', type: 'string' },
      { key: 'supplierName', type: 'string' },
      { key: 'ingredientName', type: 'string' },
      { key: 'price', type: 'number' },
      { key: 'unit', type: 'string' },
      { key: 'lastUpdated', type: 'string' },
      { key: 'reliabilityScore', type: 'number' },
      { key: 'deliveryDays', type: 'string' },
      { key: 'notes', type: 'string' },
    ],
  },
  {
    name: 'supplier_price_history',
    fileName: 'supplier_price_history.csv',
    collectionKey: 'supplierPriceHistory',
    columns: [
      { key: 'id', type: 'string' },
      { key: 'supplierItemId', type: 'string' },
      { key: 'supplierName', type: 'string' },
      { key: 'ingredientName', type: 'string' },
      { key: 'price', type: 'number' },
      { key: 'unit', type: 'string' },
      { key: 'updatedAt', type: 'string' },
      { key: 'note', type: 'string' },
    ],
  },
  {
    name: 'recipe_ingredients',
    fileName: 'recipe_ingredients.csv',
    collectionKey: 'recipeIngredients',
    columns: [
      { key: 'id', type: 'string' },
      { key: 'menuItemId', type: 'string' },
      { key: 'ingredientName', type: 'string' },
      { key: 'quantity', type: 'number' },
      { key: 'unit', type: 'string' },
      { key: 'costingMode', type: 'string' },
      { key: 'supplierItemId', type: 'string' },
      { key: 'notes', type: 'string' },
    ],
  },
  {
    name: 'compliance_tasks',
    fileName: 'compliance_tasks.csv',
    collectionKey: 'complianceTasks',
    columns: [
      { key: 'id', type: 'string' },
      { key: 'title', type: 'string' },
      { key: 'category', type: 'string' },
      { key: 'owner', type: 'string' },
      { key: 'dueDate', type: 'string' },
      { key: 'recurrence', type: 'string' },
      { key: 'status', type: 'string' },
      { key: 'riskLevel', type: 'string' },
      { key: 'notes', type: 'string' },
      { key: 'completedAt', type: 'string' },
    ],
  },
  {
    name: 'safety_checks',
    fileName: 'safety_checks.csv',
    collectionKey: 'safetyTasks',
    columns: [
      { key: 'id', type: 'string' },
      { key: 'title', type: 'string' },
      { key: 'area', type: 'string' },
      { key: 'frequency', type: 'string' },
      { key: 'assignedTo', type: 'string' },
      { key: 'lastCompleted', type: 'string' },
      { key: 'nextDue', type: 'string' },
      { key: 'status', type: 'string' },
      { key: 'requiresTemperatureLog', type: 'boolean' },
      { key: 'temperatureType', type: 'string' },
      { key: 'temperatureValue', type: 'number', optional: true },
      { key: 'notes', type: 'string' },
    ],
  },
  {
    name: 'reviews',
    fileName: 'reviews.csv',
    collectionKey: 'reviews',
    columns: [
      { key: 'id', type: 'string' },
      { key: 'platform', type: 'string' },
      { key: 'rating', type: 'number' },
      { key: 'date', type: 'string' },
      { key: 'text', type: 'string' },
      { key: 'category', type: 'string' },
      { key: 'urgency', type: 'string' },
      { key: 'replied', type: 'boolean' },
      { key: 'replyDraft', type: 'string' },
    ],
  },
  {
    name: 'profile_issues',
    fileName: 'profile_issues.csv',
    columns: profileColumns,
    toRows: (data) => profileRows(data.businessProfiles || {}),
    applyRows: (data, rows) => {
      data.businessProfiles = profilesFromRows(rows);
    },
  },
];

function getTableNames() {
  return tableSchemas.map((table) => table.name);
}

function getTableRows(data, table) {
  if (table.toRows) return table.toRows(data);
  return data[table.collectionKey] || [];
}

function applyTableRows(data, table, rows) {
  if (table.applyRows) {
    table.applyRows(data, rows);
    return;
  }
  data[table.collectionKey] = rows;
}

function profileRows(profiles) {
  const orderedPlatforms = [
    'sourceOfTruth',
    ...Object.keys(profiles)
      .filter((platform) => platform !== 'sourceOfTruth')
      .sort(),
  ].filter((platform, index, platforms) => profiles[platform] && platforms.indexOf(platform) === index);

  return orderedPlatforms.map((platform) => ({
    platform,
    ...profiles[platform],
  }));
}

function profilesFromRows(rows) {
  if (!rows.length) {
    throw new Error('profile_issues.csv must contain at least the sourceOfTruth profile row.');
  }

  const profiles = {};
  rows.forEach((row, index) => {
    const platform = row.platform;
    if (!platform) {
      throw new Error(`profile_issues.csv row ${index + 2} is missing a platform.`);
    }
    if (profiles[platform]) {
      throw new Error(`profile_issues.csv contains duplicate platform "${platform}".`);
    }

    const { platform: _platform, ...profile } = row;
    profiles[platform] = profile;
  });

  if (!profiles.sourceOfTruth) {
    throw new Error('profile_issues.csv must include a sourceOfTruth row.');
  }

  return profiles;
}

function toCsv(rows, columns) {
  const fields = columns.map((column) => column.key);
  const data = rows.map((row) => (
    fields.reduce((acc, field) => {
      acc[field] = serializeValue(row[field]);
      return acc;
    }, {})
  ));

  return Papa.unparse({ fields, data }, { columns: fields, newline: '\r\n' });
}

function serializeValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string' && FORMULA_PREFIX_PATTERN.test(value)) return `'${value}`;
  return value;
}

function parseCsv(text, table) {
  if (text.length > MAX_CSV_TEXT_BYTES) {
    throw new Error(`${table.fileName} is too large to import safely.`);
  }

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  if (parsed.errors.length) {
    const firstError = parsed.errors[0];
    throw new Error(`${table.fileName} could not be parsed as CSV: ${firstError.message}`);
  }

  const fields = (parsed.meta.fields || []).map((field, index) => (
    index === 0 ? String(field || '').replace(/^\uFEFF/, '') : String(field || '')
  ));
  assertHeaders(table, fields);

  if (parsed.data.length > 5000) {
    throw new Error(`${table.fileName} contains too many rows.`);
  }

  return parsed.data.map((row, index) => parseRow(row, table, index));
}

function assertHeaders(table, actualFields) {
  const expectedFields = table.columns.map((column) => column.key);
  const sameLength = actualFields.length === expectedFields.length;
  const sameNames = sameLength && expectedFields.every((field, index) => actualFields[index] === field);

  if (!sameNames) {
    throw new Error(
      `${table.fileName} has the wrong columns. Expected: ${expectedFields.join(', ')}. Found: ${actualFields.join(', ') || 'none'}.`
    );
  }
}

function parseRow(row, table, rowIndex) {
  return table.columns.reduce((acc, column) => {
    acc[column.key] = parseValue(row[column.key], column, table, rowIndex);
    return acc;
  }, {});
}

function parseValue(value, column, table, rowIndex) {
  const rawValue = value ?? '';

  if (column.type === 'number') {
    if (rawValue === '') return column.optional ? '' : 0;
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      throw new Error(`${table.fileName} row ${rowIndex + 2} has an invalid number in "${column.key}".`);
    }
    return parsed;
  }

  if (column.type === 'boolean') {
    if (rawValue === '') return false;
    const normalized = String(rawValue).trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
    throw new Error(`${table.fileName} row ${rowIndex + 2} has an invalid boolean in "${column.key}".`);
  }

  const parsed = String(rawValue);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(parsed)) {
    throw new Error(`${table.fileName} row ${rowIndex + 2} contains unsupported control characters in "${column.key}".`);
  }
  return parsed;
}

function validateMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    throw new Error('metadata.json is not a valid backup metadata file.');
  }
  if (metadata.appName !== APP_NAME) {
    throw new Error('This ZIP is not a ResOS backup.');
  }
  if (metadata.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`This backup uses schema version ${metadata.schemaVersion ?? 'unknown'}, but this ResOS build expects version ${SCHEMA_VERSION}.`);
  }
  if (!Array.isArray(metadata.tables)) {
    throw new Error('metadata.json is missing its tables list.');
  }

  const expectedTables = getTableNames();
  const missingTables = expectedTables.filter((tableName) => !metadata.tables.includes(tableName));
  const unknownTables = metadata.tables.filter((tableName) => !expectedTables.includes(tableName));

  if (missingTables.length) {
    throw new Error(`metadata.json is missing required tables: ${missingTables.join(', ')}.`);
  }
  if (unknownTables.length) {
    throw new Error(`metadata.json lists unknown tables for this schema: ${unknownTables.join(', ')}.`);
  }
}

function formatBackupDate(date) {
  return date.toISOString().slice(0, 10);
}

export async function createCsvBackup(data, now = new Date()) {
  const zip = new JSZip();
  const metadata = {
    appName: APP_NAME,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    tables: getTableNames(),
  };

  tableSchemas.forEach((table) => {
    zip.file(table.fileName, toCsv(getTableRows(data, table), table.columns));
  });
  zip.file(METADATA_FILE, JSON.stringify(metadata, null, 2));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return {
    blob,
    fileName: `resos-csv-backup-${formatBackupDate(now)}.zip`,
    metadata,
  };
}

export async function parseCsvBackup(file) {
  if (file?.size && file.size > MAX_BACKUP_BYTES) {
    throw new Error('That ZIP backup is too large to import safely.');
  }

  let zip;
  try {
    const zipSource = typeof file?.arrayBuffer === 'function' ? await file.arrayBuffer() : file;
    zip = await JSZip.loadAsync(zipSource);
  } catch {
    throw new Error('That file is not a readable ZIP backup.');
  }

  const metadataEntry = zip.file(METADATA_FILE);
  if (!metadataEntry) {
    throw new Error('This ZIP is missing metadata.json, so ResOS did not import it.');
  }

  let metadata;
  try {
    metadata = JSON.parse(await metadataEntry.async('string'));
  } catch {
    throw new Error('metadata.json is not valid JSON.');
  }

  validateMetadata(metadata);
  validateZipEntries(zip, metadata);

  const importedData = cloneInitialData();
  for (const table of tableSchemas) {
    const entry = zip.file(table.fileName);
    if (!entry) {
      throw new Error(`This backup is missing ${table.fileName}.`);
    }

    const rows = parseCsv(await entry.async('string'), table);
    applyTableRows(importedData, table, rows);
  }

  return {
    data: normalizeResosData(importedData),
    metadata,
  };
}

function validateZipEntries(zip, metadata) {
  const allowedFiles = new Set([METADATA_FILE, ...tableSchemas.map((table) => table.fileName)]);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  if (entries.length !== allowedFiles.size) {
    throw new Error('This ZIP backup has unexpected or missing files.');
  }

  entries.forEach((entry) => {
    if (!allowedFiles.has(entry.name)) {
      throw new Error(`This ZIP backup contains unsupported file "${entry.name}".`);
    }
  });

  if (metadata.tables.length !== tableSchemas.length) {
    throw new Error('metadata.json has an invalid table count.');
  }
}
