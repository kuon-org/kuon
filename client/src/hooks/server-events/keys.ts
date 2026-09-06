import type { ServerEventFilters } from "../../api/server-events";

export const serverEventKeys = {
  all: ["server-events"] as const,
  list: (filters: ServerEventFilters) => [...serverEventKeys.all, "list", filters] as const,
};
