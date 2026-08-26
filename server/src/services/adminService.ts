import { AdminRepository } from "../repositories/adminRepository.js";

export class AdminService {
  constructor(private repo: AdminRepository) {}

  async getUserList() {
    return await this.repo.findAllUsers();
  }

  async toggleUserActive(userId: string) {
    return await this.repo.toggleUserActiveStatus(userId);
  }
}
