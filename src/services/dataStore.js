import * as localStorageStore from './localStorageStore.js';

const activeStore = localStorageStore;

export const getAllData = () => activeStore.getAllData();
export const saveAllData = (data) => activeStore.saveAllData(data);

export const getMenuItems = () => activeStore.getCollection('menuItems');
export const saveMenuItems = (items) => activeStore.saveCollection('menuItems', items);

export const getComplianceTasks = () => activeStore.getCollection('complianceTasks');
export const saveComplianceTasks = (tasks) => activeStore.saveCollection('complianceTasks', tasks);

export const getSafetyTasks = () => activeStore.getCollection('safetyTasks');
export const saveSafetyTasks = (tasks) => activeStore.saveCollection('safetyTasks', tasks);

export const getSupplierItems = () => activeStore.getCollection('supplierItems');
export const saveSupplierItems = (items) => activeStore.saveCollection('supplierItems', items);

export const getSupplierPriceHistory = () => activeStore.getCollection('supplierPriceHistory');
export const saveSupplierPriceHistory = (history) => activeStore.saveCollection('supplierPriceHistory', history);

export const getReviews = () => activeStore.getCollection('reviews');
export const saveReviews = (reviews) => activeStore.saveCollection('reviews', reviews);

export const getBusinessProfiles = () => activeStore.getCollection('businessProfiles');
export const saveBusinessProfiles = (profiles) => activeStore.saveCollection('businessProfiles', profiles);

export const resetDemoData = () => activeStore.resetDemoData();
