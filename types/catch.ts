export type Catch = {
  id: number;
  date: string;
  location: string;
  bait: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type CatchInsert = Omit<Catch, 'id' | 'created_at' | 'updated_at'>;

export type CatchUpdate = Partial<CatchInsert>;

export type CatchWithoutTimestamps = Omit<Catch, 'created_at' | 'updated_at'>;