// TypeScript's `useDefineForClassFields` (on by default for target ES2022+) makes every
// *unset* optional field on a validated DTO instance exist as an own property with value
// `undefined`. Spreading such a DTO onto an existing record (`{...current, ...dto}`) then
// wipes out every field the caller didn't actually send. Strip those before merging.
export function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) result[key as keyof T] = obj[key];
  }
  return result;
}
