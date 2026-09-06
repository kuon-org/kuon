export const adminKeys = {
  users: ["admin", "users"] as const,
  idps: ["admin", "idps"] as const,
  idpConfig: (providerName?: string) => ["admin", "idps", "config", providerName] as const,
  serverSettings: ["admin", "server-settings"] as const,
  status: ["admin", "status"] as const,
};
