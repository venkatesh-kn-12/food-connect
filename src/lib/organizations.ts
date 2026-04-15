import { FoodCategory } from './smartSegregation';
import { DbDistribution } from './foodStore';

export interface ReceiverOrganization {
  id: string;
  name: string;
  category: FoodCategory;
  emoji: string;
  address: string;
}

export const RECEIVER_ORGANIZATIONS: ReceiverOrganization[] = [
  // Human Consumption
  { id: 'org-human-1', name: 'Hope Food Bank', category: 'human-consumption', emoji: '🏢', address: '124 Compassion St, Downtown' },
  { id: 'org-human-2', name: 'City Orphanage', category: 'human-consumption', emoji: '🏫', address: '88 Safe Haven Ave, Northside' },
  
  // Animal Feed
  { id: 'org-animal-1', name: 'Happy Tails Shelter', category: 'animal-feed', emoji: '🐕', address: '404 Rescue Road, West End' },
  { id: 'org-animal-2', name: 'Green Valley Farm', category: 'animal-feed', emoji: '🧑‍🌾', address: 'Plot 12, Outskirts County' },
  
  // Biogas
  { id: 'org-biogas-1', name: 'EcoEnergy Plant', category: 'biogas', emoji: '🏭', address: 'Sector 7 Industrial Park' },
  { id: 'org-biogas-2', name: 'BioFuel Co', category: 'biogas', emoji: '🔋', address: 'Power Grid Lane, East Bay' },
  
  // Compost
  { id: 'org-compost-1', name: 'Urban Gardens', category: 'compost', emoji: '🏡', address: 'Community Park, 3rd Ave' },
  { id: 'org-compost-2', name: 'Terra Composters', category: 'compost', emoji: '🌱', address: 'Green Belt Highway 9' },
];

/**
 * Automatically assigns a suitable organization for a given food category
 * using a round-robin / load-balancing approach based on historical distribution counts.
 */
export function autoAssignOrganization(category: FoodCategory, distributions: DbDistribution[]): ReceiverOrganization {
  // Get all organizations that accept this category
  const eligibleOrgs = RECEIVER_ORGANIZATIONS.filter(org => org.category === category);
  
  // Fallback to the first eligible org if no distributions exist yet
  if (!distributions || distributions.length === 0) {
    return eligibleOrgs[0];
  }

  // Count how many distributions each organization has received
  const loadCount = new Map<string, number>();
  eligibleOrgs.forEach(org => loadCount.set(org.name, 0));

  distributions.forEach(dist => {
    if (dist.receiver_name && loadCount.has(dist.receiver_name)) {
      loadCount.set(dist.receiver_name, loadCount.get(dist.receiver_name)! + 1);
    }
  });

  // Find the organization with the lowest count
  let selectedOrg = eligibleOrgs[0];
  let minCount = Infinity;

  eligibleOrgs.forEach(org => {
    const count = loadCount.get(org.name) || 0;
    if (count < minCount) {
      minCount = count;
      selectedOrg = org;
    }
  });

  return selectedOrg;
}
