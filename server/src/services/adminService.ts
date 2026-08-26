import { AdminRepository } from "../repositories/adminRepository.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import { permissionService } from "./permissionService.js";

export class AdminService {
  constructor(
    private urepo: UsersRepository,
    private repo: AdminRepository,
  ) {}

  /**
   * Legacy compatibility for controllers that still perform an admin-area check.
   * Route-level authorization is enforced with requirePermission; this method
   * therefore answers whether the user has at least one admin-area permission.
   */
  async isAdmin(userId: string) {
    try {
      return await permissionService.hasAnyPermission(userId);
    } catch {
      // Migration-safe fallback while upgrading an existing instance.
      const role = await this.urepo.getUserRole(userId);
      return role?.roles?.name === "admin";
    }
  }

  async getUserList() {
    return await this.repo.findAllUsers();
  }

  async toggleUserActive(userId: string) {
    return await this.repo.toggleUserActiveStatus(userId);
  }
}
