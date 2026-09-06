import { useQuery } from "@tanstack/react-query";
import { fetchServerEvents, type ServerEventFilters } from "../../api/server-events";
import { serverEventKeys } from "./keys";

export const useServerEventsQuery = (filters: ServerEventFilters) =>
  useQuery({
    queryKey: serverEventKeys.list(filters),
    queryFn: () => fetchServerEvents(filters),
  });
