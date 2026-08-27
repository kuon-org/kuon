import {
  serverEventRepository,
  type ServerEventFilters,
} from "../repositories/serverEventRepository.js";
import { asUUID } from "../utils/uuid/index.js";

export class ServerEventService {
  list(filters: ServerEventFilters) {
    return serverEventRepository.findMany(filters);
  }

  async detail(id: string) {
    if (!asUUID(id)) throw new Error("ServerEventNotFound");
    const event = await serverEventRepository.findById(id);
    if (!event) throw new Error("ServerEventNotFound");
    return event;
  }
}

export const serverEventService = new ServerEventService();
