import { Box, List, ListItemButton } from "@mui/material";
import { useSlugList } from "../../hooks/useSlug/useSlugList";

interface TocListProps {
  content: string;
}

/**
 * Markdownの見出しリストを表示する目次コンポーネント
 */
const TocList = ({ content }: TocListProps) => {
  const slugList = useSlugList(content ?? "", { minLevel: 1, maxLevel: 3 });
  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const elementTop = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementTop - 80, // ← ヘッダー高さなどの余白を調整
        behavior: "smooth",
      });
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  if (slugList.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        borderLeft: "3px solid #ccc",
        pl: 2,
        mb: 3,
        overflowY: "auto",
        maxHeight: "60vh",
      }}
    >
      <List dense>
        {slugList.map((item, index) => (
          <ListItemButton
            key={`${item.id}-${index}`}
            sx={{ pl: (item.level - 1) * 2, fontSize: "0.65rem" }}
            onClick={() => handleClick(item.id)}
          >
            {item.text}
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default TocList;
