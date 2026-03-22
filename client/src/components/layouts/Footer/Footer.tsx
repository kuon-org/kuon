import { Box, Container, Typography } from "@mui/material";
import { useMatchRoute } from "@tanstack/react-router";
export const Footer = () => {
  const matchRoute = useMatchRoute();
  const isArticle = !!matchRoute({ to: "/$username/$articleId" });
  // 除外したいページ（例: /drafts）
  const isDrafts = !!matchRoute({ to: "/drafts", fuzzy: true });
  if (isDrafts) return;
  return (
    <Box
      component="footer"
      bgcolor="secondary.main"
      sx={{
        py: 3,
        textAlign: "start",
        mb: { xs: isArticle ? 0 : 0, sm: isArticle ? 5 : 0, md: 0 },
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h3">KUON</Typography>
        <Typography>© 2026 Kuon</Typography>
      </Container>
    </Box>
  );
};
