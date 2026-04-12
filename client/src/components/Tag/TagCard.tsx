import {
  Avatar,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useAuthQuery } from "../../hooks/useAuth";
import { useTagsQuery } from "../../hooks/useTags";
import Loading from "../common/Loading/Loading";
import { tagProfileRoute } from "../../routes";
type Tag = {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  description: string | null;
};

type Props = {
  tag: Tag;
};
export const TagCard = ({ tag }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuthQuery();
  const { isFollowing, isFollowingIsError, isFollowingIsLoading, followTag } =
    useTagsQuery(tag.slug);

  if (isFollowingIsLoading) return <Loading />;
  if (isFollowingIsError) return <>エラー</>;
  return (
    <Card
      variant="outlined"
      onClick={() => {
        navigate({
          to: tagProfileRoute.to,
          params: {
            slug: tag.slug,
          },
          search: { page: 1 },
        });
      }}
      sx={{
        cursor: "pointer",
        borderRadius: 2,
        mt: 1,
        width: "auto",
        transition: "background-color 0.2s",
        "&:hover": {
          bgcolor: "action.hover",
        },
        "@media (max-width:600px)": {
          width: "auto",
          borderRadius: 0.5,
          mx: "-16px",
        },
      }}
    >
      <CardContent>
        {/* 外側のStack: アバターと右側コンテンツを横並びに */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={tag.avatar_url ?? undefined}
            variant="rounded"
            sx={{ width: 48, height: 48 }}
          />

          {/* 内側のStack: 名前とボタンを横並びにして、両端に寄せる */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ flexGrow: 1 }} // 残りの幅をすべて占有させる
          >
            <Typography fontWeight="bold">{tag.name}</Typography>

            {user && (
              <Button
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation(); // 親（Card）へのイベント伝播を止める
                  followTag(tag.slug);
                }}
              >
                {isFollowing.isFollow ? "フォロー中" : "フォローする"}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
