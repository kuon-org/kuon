import { Box, Link, Typography } from "@mui/material";

export const DevelopmentTotpHelper = () => {
  if (!import.meta.env.DEV) return null;

  // Use the current origin so Vite forwards the HttpOnly pending login cookie.
  const url = new URL("/api/dev/totp?flow=login", window.location.origin).href;

  return (
    <Box sx={{ mx: "auto", my: 2, p: 2, maxWidth: 480, textAlign: "center", border: "1px dashed", borderColor: "warning.main", bgcolor: "action.hover" }}>
      <Typography variant="subtitle2">Development TOTP Helper</Typography>
      <Link href={url} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: "anywhere" }}>
        {url} ↗
      </Link>
    </Box>
  );
};
