export type Spot = {
  id: number;
  name: string;
  aliases: string[];
  bodyOfWater: string;
  latitude: number | null;
  longitude: number | null;
  region: string;
  notes: string;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SpotFromDB = {
  id: number;
  name: string;
  aliases: string[] | null;
  body_of_water: string | null;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  notes: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SpotInsert = Omit<Spot, 'id' | 'createdAt' | 'updatedAt' | 'ownerUserId'>;

export type SpotUpdate = Partial<SpotInsert>;
