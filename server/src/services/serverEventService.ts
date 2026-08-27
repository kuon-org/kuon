import { serverEventRepository, type ServerEventFilters } from "../repositories/serverEventRepository.js";

export class ServerEventService {
  list(filters: ServerEventFilters) {
    return serverEventRepository.findMany(filters);
  }

  async detail(id: string) {
    const event = await serverEventRepository.findById(id);
    if (!event) throw new Error("ServerEventNotFound");
    return event;
  }
}

export const serverEventService = new ServerEventService();
