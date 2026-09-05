import { Box, Button, Typography, Container } from "@mui/material";
import { Link } from "@tanstack/react-router";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useTranslation } from "react-i18next";

export const NotFoundComponent = () => {
  const { t } = useTranslation("common");

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          textAlign: "center",
          gap: 2,
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 80, color: "text.secondary" }} />
        <Typography variant="h3" component="h1" fontWeight="bold">
          404
        </Typography>
        <Typography variant="h5" color="text.secondary">
          {t("notFound.title")}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          {t("notFound.description")}
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to="/"
          size="large"
          disableElevation
        >
          {t("notFound.home")}
        </Button>
      </Box>
    </Container>
  );
};
