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
    return { ...cloneInitialData(), ...JSON.parse(stored) };
  } catch {
    const seed = cloneInitialData();
    writeData(seed);
    return seed;
  }
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
