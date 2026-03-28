// Core types for the Smart Food Redistribution System

export type UserRole = 'donor' | 'volunteer' | 'receiver' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  location: string;
  contact: string;
  avatar?: string;
}

export type FoodType = 'veg' | 'non-veg';

// Smart segregation categories
export type FoodCategory = 
  | 'human-consumption' 
  | 'animal-feed' 
  | 'biogas' 
  | 'compost';

export type FoodStatus = 
  | 'submitted' 
  | 'categorized' 
  | 'assigned' 
  | 'picked-up' 
  | 'delivered' 
  | 'completed';

export interface FoodItem {
  id: string;
  donorId: string;
  donorName: string;
  foodName: string;
  quantity: number;
  foodType: FoodType;
  timePrepared: string; // ISO date string
  expiryEstimate: string; // ISO date string
  location: string;
  imageUrl?: string;
  category: FoodCategory;
  status: FoodStatus;
  createdAt: string;
  // Smart segregation metadata
  safetyScore: number; // 0-100
  storageCondition: 'refrigerated' | 'room-temp' | 'frozen';
  temperature: number; // simulated in celsius
}

export interface Distribution {
  id: string;
  foodId: string;
  volunteerId: string;
  volunteerName: string;
  receiverId?: string;
  receiverName?: string;
  pickupTime?: string;
  deliveryTime?: string;
  status: 'pending' | 'picked-up' | 'in-transit' | 'delivered';
}

export interface DashboardStats {
  totalFoodCollected: number;
  peopleFed: number;
  animalsFed: number;
  biogasProduced: number; // kg
  co2Reduced: number; // kg
  activeDonors: number;
  activeVolunteers: number;
  activeReceivers: number;
}
