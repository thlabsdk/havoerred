import { supabase } from './supabase';
import { mapSpotFromDb, toSpotInsertPayload } from './spot_mappers';
import type { Spot, SpotFromDB, SpotInsert } from '../types/spot';

export async function fetchSpots(): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as SpotFromDB[]).map(mapSpotFromDb);
}

export async function createSpot(spot: SpotInsert): Promise<Spot> {
  const { data, error } = await supabase
    .from('spots')
    .insert([toSpotInsertPayload(spot)])
    .select()
    .single();

  if (error) throw error;
  return mapSpotFromDb(data as SpotFromDB);
}
