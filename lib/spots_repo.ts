import { supabase } from './supabase';
import { mapSpotFromDb, toSpotInsertPayload, toSpotUpdatePayload } from './spot_mappers';
import type { Spot, SpotFromDB, SpotInsert, SpotUpdate } from '../types/spot';

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

export async function updateSpot(id: number, spot: SpotUpdate): Promise<Spot> {
  const { data, error } = await supabase
    .from('spots')
    .update(toSpotUpdatePayload(spot))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapSpotFromDb(data as SpotFromDB);
}

export async function deleteSpot(id: number): Promise<void> {
  const { error } = await supabase
    .from('spots')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
