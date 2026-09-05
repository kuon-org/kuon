import { Box, Paper, Typography } from "@mui/material";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import { useTranslation } from "react-i18next";

export const Maintenance = () => {
  const { t } = useTranslation("common");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 560,
          width: "100%",
          p: 5,
          textAlign: "center",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <BuildCircleOutlinedIcon sx={{ fontSize: 56, mb: 2 }} />
        <Typography variant="h4" sx={{ mb: 2 }}>
          {t("maintenance.title")}
        </Typography>
        <Typography color="text.secondary">
          {t("maintenance.description")}
        </Typography>
      </Paper>
    </Box>
  );
};
