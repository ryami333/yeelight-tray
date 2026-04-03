export const notNullish = <T>(item: T | undefined | null): item is T =>
  item !== null && item !== undefined;
