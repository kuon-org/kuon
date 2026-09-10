export const storageKeys = {
  all: ["storage"] as const,
  settings: () => [...storageKeys.all, "settings"] as const,
};
