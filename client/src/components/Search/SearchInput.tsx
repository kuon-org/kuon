// src/components/search/AdvancedSearchBar.tsx
import { useState } from "react";
import {
  InputBase,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import TagIcon from "@mui/icons-material/Tag";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const AdvancedSearchBar = ({ initialValue = "" }) => {
  const { t } = useTranslation("articles");
  const [value, setValue] = useState(initialValue);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    navigate({ to: "/search", search: { q: value, page: 1 } });
  };

  const insertPrefix = (prefix: string) => {
    setValue((prev) => (prev ? `${prev.trim()} ${prefix}` : prefix));
    setAnchorEl(null);
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSearch}
      sx={{
        p: "4px 8px",
        display: "flex",
        alignItems: "center",
        width: "100%",
        border: "1px solid #ddd",
        boxShadow: "none",
      }}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder={t("search.placeholder")}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
        <ManageSearchIcon />
      </IconButton>

      <IconButton type="submit" color="primary">
        <SearchIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => insertPrefix("tag:")}>
          <ListItemIcon>
            <TagIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("search.filters.tag")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => insertPrefix("user:")}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("search.filters.user")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => insertPrefix("title:")}>
          <ListItemText sx={{ ml: 4 }}>{t("search.filters.title")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => insertPrefix("created:>=")}>
          <ListItemText sx={{ ml: 4 }}>{t("search.filters.created")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => insertPrefix("updated:>=")}>
          <ListItemText sx={{ ml: 4 }}>{t("search.filters.updated")}</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};
