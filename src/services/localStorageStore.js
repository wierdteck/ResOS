import { cloneInitialData } from '../data/mockData.js';

const STORAGE_KEY = 'resos.demoData.v1';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readData() {
  if (!canUseStorage()) return cloneInitialData();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed = cloneInitialData();
    writeData(seed);
    return seed;
  }

  try {
    return normalizeData({ ...cloneInitialData(), ...JSON.parse(stored) });
  } catch {
    const seed = cloneInitialData();
    writeData(seed);
    return seed;
  }
}

function normalizeData(data) {
  const seed = cloneInitialData();
  return {
    ...seed,
    ...data,
    menuItems: (data.menuItems || seed.menuItems).map((item) => {
      const seededItem = seed.menuItems.find((seedItem) => seedItem.id === item.id);
      return {
        ...item,
        costMode: item.costMode || seededItem?.costMode || 'recipe',
        lastManualUpdate: item.lastManualUpdate || 0,
        lastAutoUpdate: item.lastAutoUpdate || Date.now(),
      };
    }),
    recipeIngredients: data.recipeIngredients || seed.recipeIngredients || [],
  };
}

function writeData(data) {
  if (!canUseStorage()) return data;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export function getAllData() {
  return readData();
}

export function saveAllData(data) {
  return writeData(data);
}

export function resetDemoData() {
  const seed = cloneInitialData();
  return writeData(seed);
}

export function getCollection(key) {
  return readData()[key];
}

export function saveCollection(key, value) {
  const data = readData();
  data[key] = value;
  return writeData(data)[key];
}
