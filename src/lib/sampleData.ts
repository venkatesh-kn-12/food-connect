/**
 * Sample demo data for the Smart Food Redistribution System.
 * Simulates a real scenario with restaurants, volunteers, and receivers.
 */

import { User, FoodItem, Distribution, DashboardStats } from './types';

export const sampleUsers: User[] = [
  { id: 'donor-1', name: 'Green Kitchen Restaurant', role: 'donor', location: 'Downtown', contact: '+1-555-0101' },
  { id: 'donor-2', name: 'Sunrise Catering Co.', role: 'donor', location: 'Midtown', contact: '+1-555-0102' },
  { id: 'donor-3', name: 'Patel Household', role: 'donor', location: 'Suburbs', contact: '+1-555-0103' },
  { id: 'vol-1', name: 'Aisha Khan', role: 'volunteer', location: 'Central', contact: '+1-555-0201' },
  { id: 'vol-2', name: 'Carlos Rivera', role: 'volunteer', location: 'East Side', contact: '+1-555-0202' },
  { id: 'rec-1', name: 'Hope Shelter', role: 'receiver', location: 'North District', contact: '+1-555-0301' },
  { id: 'rec-2', name: 'Community Kitchen NGO', role: 'receiver', location: 'South District', contact: '+1-555-0302' },
  { id: 'admin-1', name: 'System Admin', role: 'admin', location: 'HQ', contact: 'admin@sfrs.org' },
];

export const sampleFoodItems: FoodItem[] = [
  {
    id: 'food-1', donorId: 'donor-1', donorName: 'Green Kitchen Restaurant',
    foodName: 'Mixed Vegetable Curry', quantity: 30, foodType: 'veg',
    timePrepared: new Date(Date.now() - 2 * 3600000).toISOString(),
    expiryEstimate: new Date(Date.now() + 10 * 3600000).toISOString(),
    location: 'Downtown', category: 'human-consumption', status: 'categorized',
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    safetyScore: 92, storageCondition: 'refrigerated', temperature: 4,
  },
  {
    id: 'food-2', donorId: 'donor-1', donorName: 'Green Kitchen Restaurant',
    foodName: 'Grilled Chicken Platter', quantity: 20, foodType: 'non-veg',
    timePrepared: new Date(Date.now() - 3 * 3600000).toISOString(),
    expiryEstimate: new Date(Date.now() + 5 * 3600000).toISOString(),
    location: 'Downtown', category: 'human-consumption', status: 'assigned',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    safetyScore: 80, storageCondition: 'refrigerated', temperature: 5,
  },
  {
    id: 'food-3', donorId: 'donor-2', donorName: 'Sunrise Catering Co.',
    foodName: 'Leftover Rice & Bread', quantity: 15, foodType: 'veg',
    timePrepared: new Date(Date.now() - 12 * 3600000).toISOString(),
    expiryEstimate: new Date(Date.now() - 2 * 3600000).toISOString(),
    location: 'Midtown', category: 'animal-feed', status: 'categorized',
    createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    safetyScore: 50, storageCondition: 'room-temp', temperature: 22,
  },
  {
    id: 'food-4', donorId: 'donor-2', donorName: 'Sunrise Catering Co.',
    foodName: 'Fruit Salad Trimmings', quantity: 8, foodType: 'veg',
    timePrepared: new Date(Date.now() - 24 * 3600000).toISOString(),
    expiryEstimate: new Date(Date.now() - 12 * 3600000).toISOString(),
    location: 'Midtown', category: 'biogas', status: 'completed',
    createdAt: new Date(Date.now() - 20 * 3600000).toISOString(),
    safetyScore: 30, storageCondition: 'room-temp', temperature: 28,
  },
  {
    id: 'food-5', donorId: 'donor-3', donorName: 'Patel Household',
    foodName: 'Stale Chapati & Vegetable Peels', quantity: 5, foodType: 'veg',
    timePrepared: new Date(Date.now() - 48 * 3600000).toISOString(),
    expiryEstimate: new Date(Date.now() - 36 * 3600000).toISOString(),
    location: 'Suburbs', category: 'compost', status: 'completed',
    createdAt: new Date(Date.now() - 40 * 3600000).toISOString(),
    safetyScore: 10, storageCondition: 'room-temp', temperature: 30,
  },
  {
    id: 'food-6', donorId: 'donor-1', donorName: 'Green Kitchen Restaurant',
    foodName: 'Fresh Pasta & Sauce', quantity: 25, foodType: 'veg',
    timePrepared: new Date(Date.now() - 1 * 3600000).toISOString(),
    expiryEstimate: new Date(Date.now() + 12 * 3600000).toISOString(),
    location: 'Downtown', category: 'human-consumption', status: 'delivered',
    createdAt: new Date(Date.now() - 0.5 * 3600000).toISOString(),
    safetyScore: 95, storageCondition: 'refrigerated', temperature: 3,
  },
];

export const sampleDistributions: Distribution[] = [
  {
    id: 'dist-1', foodId: 'food-2', volunteerId: 'vol-1', volunteerName: 'Aisha Khan',
    receiverId: 'rec-1', receiverName: 'Hope Shelter',
    pickupTime: new Date(Date.now() - 1 * 3600000).toISOString(),
    status: 'picked-up',
  },
  {
    id: 'dist-2', foodId: 'food-6', volunteerId: 'vol-2', volunteerName: 'Carlos Rivera',
    receiverId: 'rec-2', receiverName: 'Community Kitchen NGO',
    pickupTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    deliveryTime: new Date(Date.now() - 1 * 3600000).toISOString(),
    status: 'delivered',
  },
];

export const sampleStats: DashboardStats = {
  totalFoodCollected: 103,
  peopleFed: 75,
  animalsFed: 15,
  biogasProduced: 8,
  co2Reduced: 42,
  activeDonors: 3,
  activeVolunteers: 2,
  activeReceivers: 2,
};
