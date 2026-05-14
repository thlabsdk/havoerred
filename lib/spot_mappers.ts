import type { Spot, SpotFromDB, SpotInsert, SpotUpdate } from '../types/spot';

export function mapSpotFromDb(row: SpotFromDB): Spot {
  return {
    id: row.id,
    name: row.name,
    aliases: row.aliases ?? [],
    bodyOfWater: row.body_of_water ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    region: row.region ?? '',
    notes: row.notes ?? '',
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSpotInsertPayload(spot: SpotInsert) {
  return {
    name: spot.name,
    aliases: spot.aliases ?? [],
    body_of_water: spot.bodyOfWater || null,
    latitude: spot.latitude,
    longitude: spot.longitude,
    region: spot.region || null,
    notes: spot.notes || null,
  };
}

export function toSpotUpdatePayload(spot: SpotUpdate) {
  const payload: Record<string, unknown> = {};

  if (spot.name !== undefined) payload.name = spot.name;
  if (spot.aliases !== undefined) payload.aliases = spot.aliases;
  if (spot.bodyOfWater !== undefined) payload.body_of_water = spot.bodyOfWater || null;
  if (spot.latitude !== undefined) payload.latitude = spot.latitude;
  if (spot.longitude !== undefined) payload.longitude = spot.longitude;
  if (spot.region !== undefined) payload.region = spot.region || null;
  if (spot.notes !== undefined) payload.notes = spot.notes || null;

  return payload;
}
