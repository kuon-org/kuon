import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Box, Chip, Stack, Typography } from "@mui/material";
import {
  fetchFollowedGroupsByUser,
  fetchJoinedGroupsByUser,
} from "../../api/groups";

export const UserGroups = ({ userId }: { userId: string }) => {
  const followed = useQuery({
    queryKey: ["groups", "following", userId],
    queryFn: () => fetchFollowedGroupsByUser(userId),
  });
  const joined = useQuery({
    queryKey: ["groups", "joined", userId],
    queryFn: () => fetchJoinedGroupsByUser(userId),
  });
  const section = (
    title: string,
    groups: Array<{ id: string; slug: string; display_name: string }> = [],
  ) => (
    <Box>
      <Typography mb={1}>
        {title} ({groups.length})
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {groups.map((group) => (
          <Link
            key={group.id}
            to="/groups/$slug"
            params={{ slug: group.slug }}
            search={{ page: 1 }}
            style={{ textDecoration: "none" }}
          >
            <Chip clickable label={group.display_name} />
          </Link>
        ))}
      </Stack>
    </Box>
  );
  return (
    <Stack spacing={2}>
      {section(
        "フォロー中のグループ",
        followed.data?.map((item) => item.groups),
      )}
      {section(
        "所属しているグループ",
        joined.data?.map((item) => item.groups),
      )}
    </Stack>
  );
};
