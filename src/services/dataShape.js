import { cloneInitialData } from '../data/mockData.js';

export const WORKSPACE_SLUG = 'corner-table-cafe';

const MAX_COLLECTION_ROWS = {
  menuItems: 500,
  recipeIngredients: 2500,
  complianceTasks: 1000,
  supplierItems: 1000,
  supplierPriceHistory: 5000,
  reviews: 5000,
  safetyTasks: 1000,
};

const TOP_LEVEL_KEYS = [
  'restaurantProfile',
  'menuItems',
  'recipeIngredients',
  'complianceTasks',
  'supplierItems',
  'supplierPriceHistory',
  'reviews',
  'businessProfiles',
  'safetyTasks',
];

const PROFILE_KEYS = ['restaurantName', 'address', 'phone', 'cuisine', 'ownerName', 'weeklySalesGoal'];
const BUSINESS_PROFILE_KEYS = ['restaurantName', 'phone', 'address', 'mondayHours', 'fridayHours', 'menuUrl', 'holidayHours', 'deliveryUrl'];
const MENU_KEYS = ['id', 'name', 'category', 'price', 'ingredientCost', 'costMode', 'avgPrepMinutes', 'salesThisWeek', 'station', 'notes'];
const RECIPE_KEYS = ['id', 'menuItemId', 'ingredientName', 'quantity', 'unit', 'costingMode', 'supplierItemId', 'notes'];
const COMPLIANCE_KEYS = ['id', 'title', 'category', 'owner', 'dueDate', 'recurrence', 'status', 'riskLevel', 'notes', 'completedAt'];
const SUPPLIER_KEYS = ['id', 'supplierName', 'ingredientName', 'price', 'unit', 'lastUpdated', 'reliabilityScore', 'deliveryDays', 'notes'];
const HISTORY_KEYS = ['id', 'supplierItemId', 'supplierName', 'ingredientName', 'price', 'unit', 'updatedAt', 'note'];
const REVIEW_KEYS = ['id', 'platform', 'rating', 'date', 'text', 'category', 'urgency', 'replied', 'replyDraft'];
const SAFETY_KEYS = ['id', 'title', 'area', 'frequency', 'assignedTo', 'lastCompleted', 'nextDue', 'status', 'requiresTemperatureLog', 'temperatureType', 'temperatureValue', 'notes', 'completedAt'];

const UNITS = ['lb', 'oz', 'gal', 'qt', 'pt', 'fl oz', 'each', 'case', 'dozen', 'bag', 'box'];
const COST_MODES = ['manual', 'recipe'];
const COSTING_MODES = ['cheapest', 'specificSupplier'];
const COMPLIANCE_CATEGORIES = ['License', 'Permit', 'Inspection', 'Training', 'Tax', 'Insurance'];
const COMPLIANCE_STATUSES = ['scheduled', 'due_soon', 'overdue', 'compliant'];
const RISK_LEVELS = ['low', 'medium', 'high'];
const TEMPERATURE_TYPES = ['fridge', 'freezer', 'hot_holding', ''];
const URGENCY_LEVELS = ['low', 'medium', 'high'];
const SAFETY_STATUSES = ['due_today', 'done', 'overdue'];

const ID_PATTERN = /^[A-Za-z0-9_-]{1,96}$/;
const PLATFORM_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const URL_PATTERN = /^https:\/\/[^\s<>"']{1,300}$/i;
const PHONE_PATTERN = /^[0-9()+\-.\s]{0,40}$/;

export class SecurityValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SecurityValidationError';
  }
}

export function createSeedData() {
  return validateResosData(cloneInitialData());
}

export function normalizeResosData(data = {}) {
  return validateResosData(data);
}

export function replaceCollection(data, key, value) {
  if (!Object.prototype.hasOwnProperty.call(MAX_COLLECTION_ROWS, key)) {
    throw new SecurityValidationError(`Unsupported collection "${key}".`);
  }

  return validateResosData({
    ...data,
    [key]: value,
  });
}

function validateResosData(data) {
  const value = requireObject(data, 'workspace data');
  rejectUnknownKeys(value, TOP_LEVEL_KEYS, 'workspace data');

  TOP_LEVEL_KEYS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      throw new SecurityValidationError(`Missing required field "${key}".`);
    }
  });

  return {
    restaurantProfile: parseRestaurantProfile(value.restaurantProfile),
    menuItems: parseArray(value.menuItems, 'menuItems', MAX_COLLECTION_ROWS.menuItems, parseMenuItem),
    recipeIngredients: parseArray(value.recipeIngredients, 'recipeIngredients', MAX_COLLECTION_ROWS.recipeIngredients, parseRecipeIngredient),
    complianceTasks: parseArray(value.complianceTasks, 'complianceTasks', MAX_COLLECTION_ROWS.complianceTasks, parseComplianceTask),
    supplierItems: parseArray(value.supplierItems, 'supplierItems', MAX_COLLECTION_ROWS.supplierItems, parseSupplierItem),
    supplierPriceHistory: parseArray(value.supplierPriceHistory, 'supplierPriceHistory', MAX_COLLECTION_ROWS.supplierPriceHistory, parseSupplierPriceHistory),
    reviews: parseArray(value.reviews, 'reviews', MAX_COLLECTION_ROWS.reviews, parseReview),
    safetyTasks: parseArray(value.safetyTasks, 'safetyTasks', MAX_COLLECTION_ROWS.safetyTasks, parseSafetyTask),
    businessProfiles: parseBusinessProfiles(value.businessProfiles),
  };
}

function parseRestaurantProfile(input) {
  const value = requireObject(input, 'restaurantProfile');
  rejectUnknownKeys(value, PROFILE_KEYS, 'restaurantProfile');

  return {
    restaurantName: parseString(value.restaurantName, 'restaurantProfile.restaurantName', { min: 1, max: 120 }),
    address: parseString(value.address, 'restaurantProfile.address', { max: 240 }),
    phone: parseString(value.phone, 'restaurantProfile.phone', { max: 40, pattern: PHONE_PATTERN }),
    cuisine: parseString(value.cuisine, 'restaurantProfile.cuisine', { max: 120 }),
    ownerName: parseString(value.ownerName, 'restaurantProfile.ownerName', { max: 120 }),
    weeklySalesGoal: parseNumber(value.weeklySalesGoal, 'restaurantProfile.weeklySalesGoal', { min: 0, max: 1000000 }),
  };
}

function parseBusinessProfiles(input) {
  const value = requireObject(input, 'businessProfiles');
  const profiles = {};

  Object.entries(value).forEach(([platform, profile]) => {
    if (!PLATFORM_PATTERN.test(platform)) {
      throw new SecurityValidationError(`Invalid business profile platform "${platform}".`);
    }

    const row = requireObject(profile, `businessProfiles.${platform}`);
    rejectUnknownKeys(row, BUSINESS_PROFILE_KEYS, `businessProfiles.${platform}`);
    profiles[platform] = {
      restaurantName: parseString(row.restaurantName, `businessProfiles.${platform}.restaurantName`, { max: 120 }),
      phone: parseString(row.phone, `businessProfiles.${platform}.phone`, { max: 40 }),
      address: parseString(row.address, `businessProfiles.${platform}.address`, { max: 240 }),
      mondayHours: parseString(row.mondayHours, `businessProfiles.${platform}.mondayHours`, { max: 120 }),
      fridayHours: parseString(row.fridayHours, `businessProfiles.${platform}.fridayHours`, { max: 120 }),
      menuUrl: parseUrlish(row.menuUrl, `businessProfiles.${platform}.menuUrl`),
      holidayHours: parseString(row.holidayHours, `businessProfiles.${platform}.holidayHours`, { max: 160 }),
      deliveryUrl: parseUrlish(row.deliveryUrl, `businessProfiles.${platform}.deliveryUrl`),
    };
  });

  if (!profiles.sourceOfTruth) {
    throw new SecurityValidationError('businessProfiles.sourceOfTruth is required.');
  }

  return profiles;
}

function parseMenuItem(input, index) {
  const value = requireObject(input, `menuItems[${index}]`);
  rejectUnknownKeys(value, MENU_KEYS, `menuItems[${index}]`);

  return {
    id: parseId(value.id, `menuItems[${index}].id`),
    name: parseString(value.name, `menuItems[${index}].name`, { min: 1, max: 120 }),
    category: parseString(value.category, `menuItems[${index}].category`, { max: 80 }),
    price: parseNumber(value.price, `menuItems[${index}].price`, { min: 0, max: 10000 }),
    ingredientCost: parseNumber(value.ingredientCost, `menuItems[${index}].ingredientCost`, { min: 0, max: 10000 }),
    costMode: parseEnum(value.costMode, COST_MODES, `menuItems[${index}].costMode`),
    avgPrepMinutes: parseNumber(value.avgPrepMinutes, `menuItems[${index}].avgPrepMinutes`, { min: 0, max: 1440 }),
    salesThisWeek: parseNumber(value.salesThisWeek, `menuItems[${index}].salesThisWeek`, { min: 0, max: 100000 }),
    station: parseString(value.station, `menuItems[${index}].station`, { max: 80 }),
    notes: parseString(value.notes, `menuItems[${index}].notes`, { max: 500 }),
  };
}

function parseRecipeIngredient(input, index) {
  const value = requireObject(input, `recipeIngredients[${index}]`);
  rejectUnknownKeys(value, RECIPE_KEYS, `recipeIngredients[${index}]`);

  return {
    id: parseId(value.id, `recipeIngredients[${index}].id`),
    menuItemId: parseId(value.menuItemId, `recipeIngredients[${index}].menuItemId`),
    ingredientName: parseString(value.ingredientName, `recipeIngredients[${index}].ingredientName`, { max: 120 }),
    quantity: parseNumber(value.quantity, `recipeIngredients[${index}].quantity`, { min: 0, max: 100000 }),
    unit: parseEnum(value.unit, UNITS, `recipeIngredients[${index}].unit`),
    costingMode: parseEnum(value.costingMode, COSTING_MODES, `recipeIngredients[${index}].costingMode`),
    supplierItemId: parseOptionalId(value.supplierItemId, `recipeIngredients[${index}].supplierItemId`),
    notes: parseString(value.notes, `recipeIngredients[${index}].notes`, { max: 500 }),
  };
}

function parseComplianceTask(input, index) {
  const value = requireObject(input, `complianceTasks[${index}]`);
  rejectUnknownKeys(value, COMPLIANCE_KEYS, `complianceTasks[${index}]`);

  return {
    id: parseId(value.id, `complianceTasks[${index}].id`),
    title: parseString(value.title, `complianceTasks[${index}].title`, { min: 1, max: 160 }),
    category: parseEnum(value.category, COMPLIANCE_CATEGORIES, `complianceTasks[${index}].category`),
    owner: parseString(value.owner, `complianceTasks[${index}].owner`, { max: 80 }),
    dueDate: parseDate(value.dueDate, `complianceTasks[${index}].dueDate`),
    recurrence: parseString(value.recurrence, `complianceTasks[${index}].recurrence`, { max: 80 }),
    status: parseEnum(value.status, COMPLIANCE_STATUSES, `complianceTasks[${index}].status`),
    riskLevel: parseEnum(value.riskLevel, RISK_LEVELS, `complianceTasks[${index}].riskLevel`),
    notes: parseString(value.notes, `complianceTasks[${index}].notes`, { max: 500 }),
    ...(value.completedAt === undefined ? {} : { completedAt: parseDate(value.completedAt, `complianceTasks[${index}].completedAt`, true) }),
  };
}


function parseSupplierItem(input, index) {
  const value = requireObject(input, `supplierItems[${index}]`);
  rejectUnknownKeys(value, SUPPLIER_KEYS, `supplierItems[${index}]`);

  return {
    id: parseId(value.id, `supplierItems[${index}].id`),
    supplierName: parseString(value.supplierName, `supplierItems[${index}].supplierName`, { min: 1, max: 120 }),
    ingredientName: parseString(value.ingredientName, `supplierItems[${index}].ingredientName`, { min: 1, max: 120 }),
    price: parseNumber(value.price, `supplierItems[${index}].price`, { min: 0, max: 100000 }),
    unit: parseEnum(value.unit, UNITS, `supplierItems[${index}].unit`),
    lastUpdated: parseDate(value.lastUpdated, `supplierItems[${index}].lastUpdated`),
    reliabilityScore: parseNumber(value.reliabilityScore, `supplierItems[${index}].reliabilityScore`, { min: 0, max: 100 }),
    deliveryDays: parseString(value.deliveryDays, `supplierItems[${index}].deliveryDays`, { max: 120 }),
    notes: parseString(value.notes, `supplierItems[${index}].notes`, { max: 500 }),
  };
}

function parseSupplierPriceHistory(input, index) {
  const value = requireObject(input, `supplierPriceHistory[${index}]`);
  rejectUnknownKeys(value, HISTORY_KEYS, `supplierPriceHistory[${index}]`);

  return {
    id: parseId(value.id, `supplierPriceHistory[${index}].id`),
    supplierItemId: parseId(value.supplierItemId, `supplierPriceHistory[${index}].supplierItemId`),
    supplierName: parseString(value.supplierName, `supplierPriceHistory[${index}].supplierName`, { max: 120 }),
    ingredientName: parseString(value.ingredientName, `supplierPriceHistory[${index}].ingredientName`, { max: 120 }),
    price: parseNumber(value.price, `supplierPriceHistory[${index}].price`, { min: 0, max: 100000 }),
    unit: parseEnum(value.unit, UNITS, `supplierPriceHistory[${index}].unit`),
    updatedAt: parseDate(value.updatedAt, `supplierPriceHistory[${index}].updatedAt`),
    note: parseString(value.note, `supplierPriceHistory[${index}].note`, { max: 500 }),
  };
}

function parseReview(input, index) {
  const value = requireObject(input, `reviews[${index}]`);
  rejectUnknownKeys(value, REVIEW_KEYS, `reviews[${index}]`);

  return {
    id: parseId(value.id, `reviews[${index}].id`),
    platform: parseString(value.platform, `reviews[${index}].platform`, { min: 1, max: 80 }),
    rating: parseNumber(value.rating, `reviews[${index}].rating`, { min: 1, max: 5 }),
    date: parseDate(value.date, `reviews[${index}].date`),
    text: parseString(value.text, `reviews[${index}].text`, { max: 1000 }),
    category: parseString(value.category, `reviews[${index}].category`, { max: 80 }),
    urgency: parseEnum(value.urgency, URGENCY_LEVELS, `reviews[${index}].urgency`),
    replied: parseBoolean(value.replied, `reviews[${index}].replied`),
    ...(value.replyDraft === undefined ? {} : { replyDraft: parseString(value.replyDraft, `reviews[${index}].replyDraft`, { max: 1200 }) }),
  };
}

function parseSafetyTask(input, index) {
  const value = requireObject(input, `safetyTasks[${index}]`);
  rejectUnknownKeys(value, SAFETY_KEYS, `safetyTasks[${index}]`);

  const parsed = {
    id: parseId(value.id, `safetyTasks[${index}].id`),
    title: parseString(value.title, `safetyTasks[${index}].title`, { min: 1, max: 160 }),
    area: parseString(value.area, `safetyTasks[${index}].area`, { max: 80 }),
    frequency: parseString(value.frequency, `safetyTasks[${index}].frequency`, { max: 40 }),
    assignedTo: parseString(value.assignedTo, `safetyTasks[${index}].assignedTo`, { max: 80 }),
    lastCompleted: parseDate(value.lastCompleted, `safetyTasks[${index}].lastCompleted`),
    nextDue: parseDate(value.nextDue, `safetyTasks[${index}].nextDue`),
    status: parseEnum(value.status, SAFETY_STATUSES, `safetyTasks[${index}].status`),
    requiresTemperatureLog: parseBoolean(value.requiresTemperatureLog, `safetyTasks[${index}].requiresTemperatureLog`),
    temperatureType: parseString(value.temperatureType, `safetyTasks[${index}].temperatureType`, { max: 40 }),
    notes: parseString(value.notes, `safetyTasks[${index}].notes`, { max: 500 }),
  };

  if (value.temperatureValue !== undefined && value.temperatureValue !== null) {
    parsed.temperatureValue = parseNumber(value.temperatureValue, `safetyTasks[${index}].temperatureValue`, { min: -100, max: 250 });
  }

  if (value.completedAt !== undefined && value.completedAt !== null) {
    parsed.completedAt = parseDate(value.completedAt, `safetyTasks[${index}].completedAt`, true);
  }

  return parsed;
}

function parseArray(value, field, maxRows, parser) {
  if (!Array.isArray(value)) {
    throw new SecurityValidationError(`${field} must be an array.`);
  }

  if (value.length > maxRows) {
    throw new SecurityValidationError(`${field} exceeds the maximum row count.`);
  }

  return value.map((row, index) => parser(row, index));
}

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SecurityValidationError(`${field} must be an object.`);
  }
  return value;
}

function rejectUnknownKeys(value, allowedKeys, field) {
  Object.keys(value).forEach((key) => {
    if (!allowedKeys.includes(key)) {
      throw new SecurityValidationError(`${field} contains unsupported field "${key}".`);
    }
  });
}

function parseId(value, field) {
  const parsed = parseString(value, field, { min: 1, max: 96 });
  if (!ID_PATTERN.test(parsed)) {
    throw new SecurityValidationError(`${field} has an invalid ID format.`);
  }
  return parsed;
}

function parseOptionalId(value, field) {
  if (value === undefined || value === '') return '';
  return parseId(value, field);
}

function parseString(value, field, options = {}) {
  const { min = 0, max = 500, pattern } = options;
  if (typeof value !== 'string') {
    throw new SecurityValidationError(`${field} must be a string.`);
  }

  if (value.length < min || value.length > max) {
    throw new SecurityValidationError(`${field} length is outside the allowed range.`);
  }

  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) {
    throw new SecurityValidationError(`${field} contains control characters.`);
  }

  if (pattern && !pattern.test(value)) {
    throw new SecurityValidationError(`${field} has an invalid format.`);
  }

  return value;
}

function parseUrlish(value, field) {
  const parsed = parseString(value, field, { max: 320 });
  if (parsed === 'Not listed' || parsed === '') return parsed;
  if (!URL_PATTERN.test(parsed)) {
    throw new SecurityValidationError(`${field} must be an HTTPS URL or "Not listed".`);
  }
  return parsed;
}

function parseNumber(value, field, options = {}) {
  const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = options;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new SecurityValidationError(`${field} must be a finite number.`);
  }
  if (value < min || value > max) {
    throw new SecurityValidationError(`${field} is outside the allowed range.`);
  }
  return value;
}

function parseBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new SecurityValidationError(`${field} must be a boolean.`);
  }
  return value;
}

function parseEnum(value, allowedValues, field) {
  if (!allowedValues.includes(value)) {
    throw new SecurityValidationError(`${field} must be one of: ${allowedValues.join(', ')}.`);
  }
  return value;
}

function parseDate(value, field, allowEmpty = false) {
  if (allowEmpty && value === '') return '';
  const parsed = parseString(value, field, { max: 10 });
  if (!DATE_PATTERN.test(parsed)) {
    throw new SecurityValidationError(`${field} must be an ISO date.`);
  }
  return parsed;
}
