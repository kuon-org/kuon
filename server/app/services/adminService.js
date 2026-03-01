export class AdminService {
    constructor(urepo, repo) {
        this.urepo = urepo;
        this.repo = repo;
    }
    async isAdmin(userId) {
        const role = await this.urepo.getUserRole(userId);
        if (!role || !role.roles)
            throw new Error("ユーザに権限が付与されていません");
        const isAdmin = role.roles.name === "admin" ? true : false;
        return isAdmin;
    }
    async getUserList() {
        return await this.repo.findAllUsers();
    }
    async toggleUserActive(userId) {
        return await this.repo.toggleUserActiveStatus(userId);
    }
}
