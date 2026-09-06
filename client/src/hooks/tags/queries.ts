import { useQuery } from "@tanstack/react-query";
import {
  fetchFollowingTags,
  fetchMyFollowingTags,
  fetchTag,
  fetchTagFollowState,
  fetchTags,
} from "../../api/tags";
import { tagKeys } from "./keys";

export const useTagsQuery = () =>
  useQuery({ queryKey: tagKeys.list(), queryFn: fetchTags });

export const useTagQuery = (slug?: string) =>
  useQuery({
    queryKey: tagKeys.detail(slug),
    queryFn: () => fetchTag(slug!),
    enabled: !!slug,
  });

export const useFollowingTagsQuery = (userId?: string, page = 1, limit = 20) =>
  useQuery({
    queryKey: tagKeys.following(userId, page, limit),
    queryFn: () => fetchFollowingTags(userId!, page, limit),
    enabled: !!userId,
  });

export const useMyFollowingTagsQuery = (enabled: boolean) =>
  useQuery({
    queryKey: tagKeys.myFollowing(),
    queryFn: fetchMyFollowingTags,
    enabled,
  });

export const useTagFollowStateQuery = (slug?: string, enabled = true) =>
  useQuery({
    queryKey: tagKeys.followState(slug),
    queryFn: () => fetchTagFollowState(slug!),
    enabled: enabled && !!slug,
  });
