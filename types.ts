
export enum AnimalCategory {
  CATTLE = 'Büyükbaş',
  SHEEP = 'Koyun',
  GOAT = 'Keçi'
}

export interface AnimalBreed {
  id: string;
  name: string;
  category: AnimalCategory;
  baseMaintenanceEnergy: number; // MJ/kg LW
  baseMaintenanceProtein: number; // g/kg LW
}

export interface Feed {
  id: string;
  name: string;
  dryMatter: number; // %
  metabolizableEnergy: number; // MJ/kg DM
  crudeProtein: number; // % in DM
  calcium: number; // % in DM
  phosphorus: number; // % in DM
  pricePerKg: number; // TL/kg (Fresh)
}

export interface RationItem {
  feedId: string;
  amountKg: number; // Fresh weight
}

export interface NutrientRequirements {
  dryMatterIntake: number; // kg/day
  energy: number; // MJ/day
  protein: number; // g/day
  calcium: number; // g/day
  phosphorus: number; // g/day
}

export interface AnimalProfile {
  category: AnimalCategory;
  breedId: string;
  weight: number;
  dailyGain: number; // kg
  ageMonths: number;
}
