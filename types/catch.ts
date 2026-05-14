export type Catch = {
  id: number;
  date: string;
  location: string;
  fjord: string;
  bait: string;
  lengthCm: number | null;
  undersized: boolean;
  windDirection: string;
  notes: string;
  spotId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CatchFromDB = {
  id: number;
  date: string;
  location: string;
  fjord: string | null;
  bait: string;
  length_cm: number | null;
  undersized: boolean;
  wind_direction: string | null;
  notes: string;
  spot_id: number | null;
  created_at: string;
  updated_at: string;
};

export type CatchInsert = Omit<Catch, 'id' | 'createdAt' | 'updatedAt'>;

export type CatchUpdate = Partial<CatchInsert>;

export type CatchWithoutTimestamps = Omit<Catch, 'createdAt' | 'updatedAt'>;
