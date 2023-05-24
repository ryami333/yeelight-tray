export const safeJsonParse = (source: string) => {
  try {
    return JSON.parse(source);
  } catch {
    return undefined;
  }
};
