import { GroupsRepository, type GroupRole } from "../repositories/groupsRepository.js";

const GROUP_SLUG = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;

export class GroupsService {
  constructor(private repo: GroupsRepository) {}

  list() { return this.repo.findAll(); }
  mine(userId: string) { return this.repo.findMine(userId); }

  async detail(slug: string, page: number, limit: number, currentUserId?: string) {
    const group = await this.requireGroup(slug);
    const membership = currentUserId
      ? await this.repo.findMembership(currentUserId, group.id)
      : null;
    const articles = await this.repo.findArticles(group.id, page, limit);
    return { ...group, current_user_role: membership?.role ?? null, ...articles };
  }

  async create(userId: string, input: unknown) {
    const data = this.validateInput(input, true);
    return this.repo.create(userId, data);
  }

  async update(slug: string, userId: string, input: unknown) {
    const group = await this.requireGroup(slug);
    await this.requireManager(group.id, userId);
    const data = this.validateInput(input, false);
    return this.repo.update(group.id, data);
  }

  async remove(slug: string, userId: string) {
    const group = await this.requireGroup(slug);
    const membership = await this.repo.findMembership(userId, group.id);
    if (membership?.role !== "owner") throw new Error("Forbidden");
    return this.repo.delete(group.id);
  }

  async addMember(slug: string, actorId: string, username: string, role: GroupRole = "member") {
    const group = await this.requireGroup(slug);
    await this.requireManager(group.id, actorId);
    this.assertRole(role);
    if (role === "owner") throw new Error("Forbidden");
    const target = await this.repo.findUserByUsername(username);
    if (!target) throw new Error("UserNotFound");
    if (target.id === actorId) throw new Error("CannotAddSelf");
    return this.repo.addMember(group.id, username, role);
  }

  async updateMember(slug: string, actorId: string, userId: string, role: GroupRole) {
    const group = await this.requireGroup(slug);
    const actor = await this.requireManager(group.id, actorId);
    this.assertRole(role);
    const target = await this.repo.findMembership(userId, group.id);
    if (!target) throw new Error("MembershipNotFound");
    if (target.role === "owner" || role === "owner" || (actor.role !== "owner" && target.role === "admin")) {
      throw new Error("Forbidden");
    }
    return this.repo.updateMemberRole(group.id, userId, role);
  }

  async removeMember(slug: string, actorId: string, userId: string) {
    const group = await this.requireGroup(slug);
    const actor = await this.requireManager(group.id, actorId);
    const target = await this.repo.findMembership(userId, group.id);
    if (!target) throw new Error("MembershipNotFound");
    if (target.role === "owner" || (actor.role !== "owner" && target.role === "admin")) throw new Error("Forbidden");
    return this.repo.removeMember(group.id, userId);
  }

  async leave(slug: string, userId: string) {
    const group = await this.requireGroup(slug);
    const membership = await this.repo.findMembership(userId, group.id);
    if (!membership) throw new Error("MembershipNotFound");
    if (membership.role === "owner") throw new Error("OwnerCannotLeave");
    return this.repo.removeMember(group.id, userId);
  }

  async assertMembership(userId: string, groupId: string) {
    const group = await this.repo.findById(groupId);
    if (!group) throw new Error("GroupNotFound");
    const membership = await this.repo.findMembership(userId, groupId);
    if (!membership) throw new Error("GroupMembershipRequired");
  }

  private async requireGroup(slug: string) {
    const group = await this.repo.findBySlug(slug);
    if (!group) throw new Error("GroupNotFound");
    return group;
  }

  private async requireManager(groupId: string, userId: string) {
    const membership = await this.repo.findMembership(userId, groupId);
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new Error("Forbidden");
    return membership;
  }

  private validateInput(input: unknown, requireSlug: true): { name: string; slug: string; display_name: string; description?: string | null };
  private validateInput(input: unknown, requireSlug: false): { name?: string; display_name?: string; description?: string | null };
  private validateInput(input: unknown, requireSlug: boolean) {
    const value = (input ?? {}) as Record<string, unknown>;
    const name = typeof value.name === "string" ? value.name.trim() : "";
    const displayName = typeof value.display_name === "string" ? value.display_name.trim() : "";
    const slug = typeof value.slug === "string" ? value.slug.trim().toLowerCase() : "";
    if (requireSlug && (!name || !displayName || !GROUP_SLUG.test(slug))) throw new Error("InvalidGroupInput");
    if (!requireSlug && !name && !displayName && typeof value.description !== "string") throw new Error("InvalidGroupInput");
    return {
      ...(name ? { name } : {}),
      ...(requireSlug ? { slug } : {}),
      ...(displayName ? { display_name: displayName } : {}),
      ...(typeof value.description === "string" ? { description: value.description.trim() || null } : {}),
    };
  }

  private assertRole(role: string): asserts role is GroupRole {
    if (!["owner", "admin", "member"].includes(role)) throw new Error("InvalidGroupRole");
  }
}
