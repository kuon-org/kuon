import { AdminRepository } from "../repositories/adminRepository.js";
import { UsersRepository } from "../repositories/usersRepository.js";

export class AdminService {
  constructor(
    private urepo: UsersRepository,
    private repo: AdminRepository,
  ) {}

  /**
   * Legacy role-name check. New authorization must use requirePermission at
   * the route boundary instead of widening this method's semantics.
   */
  async isAdmin(userId: string) {
    const role = await this.urepo.getUserRole(userId);
    if (!role || !role.roles)
      throw new Error("ユーザに権限が付与されていません");
    return role.roles.name === "admin";
  }

  async getUserList() {
    return await this.repo.findAllUsers();
  }

  async toggleUserActive(userId: string) {
    return await this.repo.toggleUserActiveStatus(userId);
  }
}
