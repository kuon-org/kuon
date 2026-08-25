import { createRoute } from "@tanstack/react-router";
import { plainLayoutRoute } from "./__root";
import { Maintenance } from "../pages/Maintenance";

export const maintenanceRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "/maintenance",
  component: Maintenance,
});
