import type { Request, Response } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
import { type AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { GroupsService } from "../services/groupsService.js";
import type { GroupRole } from "../repositories/groupsRepository.js";

export class GroupsController {
  constructor(private service: GroupsService) {}

  private user(req: AuthRequest) {
    if (!isAuthenticated(req)) throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    return req.user;
  }

  private map(error: unknown) {
    if (error instanceof AppError) return error;
    const message = error instanceof Error ? error.message : "";
    if (["InvalidGroupInput", "InvalidGroupRole"].includes(message)) {
      return new ValidationError({ group: [message] });
    }
    if (message === "GroupNotFound") return new AppError(404, "GROUP_NOT_FOUND", "Group not found");
    if (message === "UserNotFound") return new AppError(404, "USER_NOT_FOUND", "User not found");
    if (message === "MembershipNotFound") return new AppError(404, "GROUP_MEMBERSHIP_NOT_FOUND", "Group membership not found");
    if (["Forbidden", "OwnerCannotLeave"].includes(message)) return new AppError(403, "GROUP_ACCESS_DENIED", "Group access denied");
    if (message === "CannotAddSelf") return new AppError(409, "GROUP_SELF_MEMBERSHIP_ALREADY_EXISTS", "You are already a group member");
    if ((error as { code?: string })?.code === "P2002") return new AppError(409, "GROUP_SLUG_ALREADY_EXISTS", "Group slug already exists");
    console.error("Group operation failed", error);
    return new AppError(500, "GROUP_OPERATION_FAILED", "Group operation failed");
  }

  list = async (_req: Request, res: Response) => {
    try { res.json(await this.service.list()); } catch (error) { throw this.map(error); }
  };

  mine = async (req: AuthRequest, res: Response) => {
    const user = this.user(req);
    try { res.json(await this.service.mine(user.userId)); } catch (error) { throw this.map(error); }
  };

  feed = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
      res.json(await this.service.feed(page, limit));
    } catch (error) { throw this.map(error); }
  };

  followedByUser = async (req: Request, res: Response) => {
    try { res.json(await this.service.followedByUser(String(req.params.userId))); } catch (error) { throw this.map(error); }
  };

  joinedByUser = async (req: Request, res: Response) => {
    try { res.json(await this.service.joinedByUser(String(req.params.userId))); } catch (error) { throw this.map(error); }
  };

  isFollowing = async (req: AuthRequest, res: Response) => {
    const user = this.user(req);
    try { res.json(await this.service.isFollowing(String(req.params.slug), user.userId)); } catch (error) { throw this.map(error); }
  };

  toggleFollowing = async (req: AuthRequest, res: Response) => {
    const user = this.user(req);
    try { res.json(await this.service.toggleFollowing(String(req.params.slug), user.userId)); } catch (error) { throw this.map(error); }
  };

  detail = async (req: AuthRequest, res: Response) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
      res.json(await this.service.detail(String(req.params.slug), page, limit, req.user?.userId));
    } catch (error) { throw this.map(error); }
  };

  create = async (req: AuthRequest, res: Response) => {
    const user = this.user(req);
    try { res.status(201).json(await this.service.create(user.userId, req.body)); } catch (error) { throw this.map(error); }
  };

  update = async (req: AuthRequest, res: Response) => {
    const user = this.user(req);
    try { res.json(await this.service.update(String(req.params.slug), user.userId, req.body)); } catch (error) { throw this.map(error); }
  };

  remove = async (req: AuthRequest, res: Response) => {
    const user = this.user(req);
    try { await this.service.remove(String(req.params.slug), user.userId); res.sendStatus(204); } catch (error) { throw this.map(error); }
  };

  addMember = async (req: AuthRequest, res: Response) => {
    const user = this.user(req);
    try {
      res.status(201).json(await this.service.addMember(
        String(req.params.slug), user.userId, String(req.body.username ?? ""), (req.body.role ?? "member") as GroupRole,
      ));
    } catch (error) { throw this.map(error); }
  };

  updateMember = async (req: AuthRequest, res: Response) => {
    const user = this.user(req);
    try {
      res.json(await this.service.updateMember(
        String(req.params.slug), user.userId, String(req.params.userId), req.body.role as GroupRole,
      ));
    } catch (error) { throw this.map(error); }
  };

  removeMember = async (req: AuthRequest, res: Response) => {
    const user = this.user(req);
    try { await this.service.removeMember(String(req.params.slug), user.userId, String(req.params.userId)); res.sendStatus(204); } catch (error) { throw this.map(error); }
  };

  leave = async (req: AuthRequest, res: Response) => {
    const user = this.user(req);
    try { await this.service.leave(String(req.params.slug), user.userId); res.sendStatus(204); } catch (error) { throw this.map(error); }
  };
}
