import type { Spot, SpotFromDB, SpotInsert } from '../types/spot';

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
