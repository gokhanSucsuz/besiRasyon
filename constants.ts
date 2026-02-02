
import { AnimalBreed, AnimalCategory, Feed } from './types';

export const BREEDS: AnimalBreed[] = [
  // Büyükbaş (Cattle)
  { id: 'holstein', name: 'Holstein (Siyah Alaca)', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.52, baseMaintenanceProtein: 0.6 },
  { id: 'simmental', name: 'Simental', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.55, baseMaintenanceProtein: 0.62 },
  { id: 'angus', name: 'Angus', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.50, baseMaintenanceProtein: 0.58 },
  { id: 'limousin', name: 'Limousin', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.53, baseMaintenanceProtein: 0.60 },
  { id: 'hereford', name: 'Hereford', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.51, baseMaintenanceProtein: 0.59 },
  { id: 'charolais', name: 'Şarole (Charolais)', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.54, baseMaintenanceProtein: 0.61 },
  { id: 'brown_swiss', name: 'Montofon (Brown Swiss)', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.53, baseMaintenanceProtein: 0.61 },
  { id: 'jersey', name: 'Jersey', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.58, baseMaintenanceProtein: 0.65 },
  { id: 'belgian_blue', name: 'Belçika Mavisi', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.56, baseMaintenanceProtein: 0.63 },
  { id: 'wagyu', name: 'Wagyu', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.52, baseMaintenanceProtein: 0.60 },
  { id: 'domestic_red', name: 'Yerli Güney Sarısı / Boz', category: AnimalCategory.CATTLE, baseMaintenanceEnergy: 0.48, baseMaintenanceProtein: 0.55 },

  // Koyun (Sheep)
  { id: 'merino', name: 'Merinos (Anadolu/Karacabey)', category: AnimalCategory.SHEEP, baseMaintenanceEnergy: 0.42, baseMaintenanceProtein: 1.1 },
  { id: 'akkaraman', name: 'Akkaraman', category: AnimalCategory.SHEEP, baseMaintenanceEnergy: 0.40, baseMaintenanceProtein: 1.0 },
  { id: 'morkaraman', name: 'Morkaraman', category: AnimalCategory.SHEEP, baseMaintenanceEnergy: 0.41, baseMaintenanceProtein: 1.0 },
  { id: 'ivesi', name: 'İvesi', category: AnimalCategory.SHEEP, baseMaintenanceEnergy: 0.43, baseMaintenanceProtein: 1.2 },
  { id: 'suffolk', name: 'Suffolk', category: AnimalCategory.SHEEP, baseMaintenanceEnergy: 0.45, baseMaintenanceProtein: 1.3 },
  { id: 'dorper', name: 'Dorper', category: AnimalCategory.SHEEP, baseMaintenanceEnergy: 0.44, baseMaintenanceProtein: 1.25 },
  { id: 'romanov', name: 'Romanov', category: AnimalCategory.SHEEP, baseMaintenanceEnergy: 0.46, baseMaintenanceProtein: 1.4 },
  { id: 'karayaka', name: 'Karayaka', category: AnimalCategory.SHEEP, baseMaintenanceEnergy: 0.39, baseMaintenanceProtein: 1.0 },
  { id: 'sakız', name: 'Sakız (Chios)', category: AnimalCategory.SHEEP, baseMaintenanceEnergy: 0.44, baseMaintenanceProtein: 1.2 },
  { id: 'kıvırcık', name: 'Kıvırcık', category: AnimalCategory.SHEEP, baseMaintenanceEnergy: 0.41, baseMaintenanceProtein: 1.1 },

  // Keçi (Goat)
  { id: 'saanen', name: 'Saanen', category: AnimalCategory.GOAT, baseMaintenanceEnergy: 0.45, baseMaintenanceProtein: 1.2 },
  { id: 'kil_kecisi', name: 'Kıl Keçisi', category: AnimalCategory.GOAT, baseMaintenanceEnergy: 0.43, baseMaintenanceProtein: 1.1 },
  { id: 'boer', name: 'Boer', category: AnimalCategory.GOAT, baseMaintenanceEnergy: 0.42, baseMaintenanceProtein: 1.3 },
  { id: 'tiftik', name: 'Ankara (Tiftik) Keçisi', category: AnimalCategory.GOAT, baseMaintenanceEnergy: 0.40, baseMaintenanceProtein: 1.0 },
  { id: 'honamli', name: 'Honamlı', category: AnimalCategory.GOAT, baseMaintenanceEnergy: 0.44, baseMaintenanceProtein: 1.15 },
  { id: 'alpine', name: 'Alpin', category: AnimalCategory.GOAT, baseMaintenanceEnergy: 0.46, baseMaintenanceProtein: 1.2 },
  { id: 'maltese', name: 'Malta Keçisi', category: AnimalCategory.GOAT, baseMaintenanceEnergy: 0.45, baseMaintenanceProtein: 1.2 },
];

export const FEEDS: Feed[] = [
  // Enerji Yemleri (Kesif)
  { id: 'corn', name: 'Mısır (Tane)', dryMatter: 88, metabolizableEnergy: 13.5, crudeProtein: 9.0, calcium: 0.02, phosphorus: 0.30, pricePerKg: 9.2 },
  { id: 'barley', name: 'Arpa (Tane)', dryMatter: 88, metabolizableEnergy: 12.5, crudeProtein: 11.5, calcium: 0.05, phosphorus: 0.35, pricePerKg: 8.5 },
  { id: 'wheat', name: 'Buğday (Tane)', dryMatter: 89, metabolizableEnergy: 13.2, crudeProtein: 12.5, calcium: 0.05, phosphorus: 0.40, pricePerKg: 9.8 },
  { id: 'oats', name: 'Yulaf', dryMatter: 89, metabolizableEnergy: 11.5, crudeProtein: 11.0, calcium: 0.10, phosphorus: 0.35, pricePerKg: 8.8 },
  { id: 'molasses', name: 'Melas (Şeker Pancarı)', dryMatter: 75, metabolizableEnergy: 12.0, crudeProtein: 6.0, calcium: 0.80, phosphorus: 0.05, pricePerKg: 6.5 },
  { id: 'sorghum', name: 'Sorgum', dryMatter: 89, metabolizableEnergy: 12.8, crudeProtein: 10.0, calcium: 0.04, phosphorus: 0.32, pricePerKg: 8.2 },

  // Protein Yemleri (Küspeler)
  { id: 'soybean_meal', name: 'Soya Küspesi (%44)', dryMatter: 90, metabolizableEnergy: 13.0, crudeProtein: 44.0, calcium: 0.30, phosphorus: 0.65, pricePerKg: 19.5 },
  { id: 'sunflower_meal', name: 'Ayçiçeği Küspesi (%36 HP)', dryMatter: 91, metabolizableEnergy: 10.5, crudeProtein: 36.0, calcium: 0.40, phosphorus: 0.90, pricePerKg: 11.5 },
  { id: 'cottonseed_meal', name: 'Pamuk Tohumu Küspesi', dryMatter: 92, metabolizableEnergy: 10.2, crudeProtein: 32.0, calcium: 0.20, phosphorus: 1.10, pricePerKg: 12.0 },
  { id: 'canola_meal', name: 'Kanola Küspesi', dryMatter: 91, metabolizableEnergy: 11.5, crudeProtein: 35.0, calcium: 0.65, phosphorus: 1.00, pricePerKg: 13.5 },
  { id: 'corn_gluten_feed', name: 'Mısır Gluteni (CGF)', dryMatter: 90, metabolizableEnergy: 11.8, crudeProtein: 21.0, calcium: 0.15, phosphorus: 0.80, pricePerKg: 10.5 },
  { id: 'distillers_grains', name: 'DDGS (Mısır)', dryMatter: 90, metabolizableEnergy: 12.5, crudeProtein: 27.0, calcium: 0.10, phosphorus: 0.75, pricePerKg: 12.8 },

  // Yan Ürünler
  { id: 'wheat_bran', name: 'Buğday Kepeği', dryMatter: 89, metabolizableEnergy: 10.5, crudeProtein: 16.0, calcium: 0.14, phosphorus: 1.20, pricePerKg: 7.2 },
  { id: 'beet_pulp_dry', name: 'Pancar Posası (Kuru)', dryMatter: 90, metabolizableEnergy: 11.5, crudeProtein: 9.0, calcium: 0.70, phosphorus: 0.10, pricePerKg: 8.0 },
  { id: 'beet_pulp_wet', name: 'Pancar Posası (Yaş)', dryMatter: 15, metabolizableEnergy: 11.0, crudeProtein: 8.5, calcium: 0.65, phosphorus: 0.08, pricePerKg: 1.8 },

  // Kaba Yemler
  { id: 'alfalfa_hay', name: 'Yonca Kuru Otu (Çiçeklenme Başı)', dryMatter: 90, metabolizableEnergy: 9.5, crudeProtein: 18.5, calcium: 1.45, phosphorus: 0.25, pricePerKg: 8.5 },
  { id: 'corn_silage', name: 'Mısır Silajı (Kaliteli)', dryMatter: 33, metabolizableEnergy: 10.8, crudeProtein: 8.5, calcium: 0.25, phosphorus: 0.20, pricePerKg: 3.2 },
  { id: 'wheat_straw', name: 'Buğday Samanı', dryMatter: 90, metabolizableEnergy: 6.0, crudeProtein: 3.5, calcium: 0.40, phosphorus: 0.10, pricePerKg: 2.5 },
  { id: 'vetch_oat_hay', name: 'Fiğ-Yulaf Karışımı Kuru Otu', dryMatter: 88, metabolizableEnergy: 8.8, crudeProtein: 14.0, calcium: 1.10, phosphorus: 0.22, pricePerKg: 7.0 },
  { id: 'meadow_hay', name: 'Çayır Kuru Otu', dryMatter: 89, metabolizableEnergy: 8.2, crudeProtein: 10.0, calcium: 0.60, phosphorus: 0.20, pricePerKg: 6.5 },
  { id: 'cottonseed_hull', name: 'Pamuk Çiğidi Kabuğu', dryMatter: 91, metabolizableEnergy: 6.5, crudeProtein: 4.0, calcium: 0.15, phosphorus: 0.10, pricePerKg: 5.5 },

  // Mineraller ve Katkılar
  { id: 'dcp', name: 'DCP (Dikalsiyum Fosfat)', dryMatter: 97, metabolizableEnergy: 0, crudeProtein: 0, calcium: 23.0, phosphorus: 18.0, pricePerKg: 25.0 },
  { id: 'limestone', name: 'Mermer Tozu (Kalsiyum Karbonat)', dryMatter: 99, metabolizableEnergy: 0, crudeProtein: 0, calcium: 38.0, phosphorus: 0, pricePerKg: 4.5 },
  { id: 'salt', name: 'Yemlik Tuz', dryMatter: 99, metabolizableEnergy: 0, crudeProtein: 0, calcium: 0, phosphorus: 0, pricePerKg: 5.0 },
  { id: 'premix', name: 'Vitamin-Mineral Premiksi', dryMatter: 95, metabolizableEnergy: 0, crudeProtein: 0, calcium: 10.0, phosphorus: 5.0, pricePerKg: 85.0 },
];
