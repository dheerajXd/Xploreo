import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads canonical development seed records from the central root Database/seeds directory.
 * Resilient to different execution contexts (e.g. backend root, monorepo root, compiled dist).
 *
 * @param filename - e.g. 'users.json', 'hotels.json'
 * @param fallback - optional fallback array if file is unavailable
 * @returns Array of parsed entities
 */
export function loadSeedData<T = any>(filename: string, fallback: T[] = []): T[] {
  const candidatePaths = [
    path.resolve(process.cwd(), '../Database/seeds', filename),
    path.resolve(process.cwd(), 'Database/seeds', filename),
    path.resolve(__dirname, '../../../../Database/seeds', filename),
    path.resolve(__dirname, '../../../../../Database/seeds', filename),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed as T[];
        }
      } catch (err) {
        console.warn(`[seed-loader] Error reading ${candidate}:`, (err as Error).message);
      }
    }
  }

  console.warn(`[seed-loader] Warning: Could not locate ${filename} in Database/seeds/. Using fallback.`);
  return fallback;
}

export function loadSeedRecord<T = Record<string, any>>(filename: string, fallback: T = {} as any): T {
  const candidatePaths = [
    path.resolve(process.cwd(), '../Database/seeds', filename),
    path.resolve(process.cwd(), 'Database/seeds', filename),
    path.resolve(__dirname, '../../../../Database/seeds', filename),
    path.resolve(__dirname, '../../../../../Database/seeds', filename),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, 'utf-8');
        return JSON.parse(raw) as T;
      } catch (err) {
        console.warn(`[seed-loader] Error reading ${candidate}:`, (err as Error).message);
      }
    }
  }

  console.warn(`[seed-loader] Warning: Could not locate ${filename} in Database/seeds/. Using fallback.`);
  return fallback;
}
