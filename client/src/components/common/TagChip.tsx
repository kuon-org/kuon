import { Link } from "@tanstack/react-router";
import { tagProfileRoute } from "../../router";
import { Avatar, Chip } from "@mui/material";

interface Tag {
  id: string;
  slug: string;
  name: string;
  avatar_url?: string;
}

interface TagChipProps {
  tag: Tag;
}

export const TagChip = ({ tag }: TagChipProps) => {
  return (
    <Link
      key={tag.id}
      to={tagProfileRoute.to}
      search={{ page: 1 }}
      params={{ slug: tag.slug }}
      style={{ textDecoration: "none" }}
    >
      <Chip
        key={tag.id}
        label={tag.name}
        icon={
          tag.avatar_url ? (
            <Avatar
              src={tag.avatar_url}
              sx={{
                width: 20,
                height: 20,
                ml: 0.5, // 少し余白を持たせるとバランス良く見える
              }}
            />
          ) : undefined
        }
        size="small"
        color="default"
        sx={{
          mr: 0.5, // Chip同士が少し離れるように
          fontSize: "0.8rem",
        }}
      />
    </Link>
  );
};
