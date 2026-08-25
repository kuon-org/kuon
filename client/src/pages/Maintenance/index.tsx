import { Box, Paper, Typography } from "@mui/material";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";

export const Maintenance = () => (
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
        現在メンテナンス中です
      </Typography>
      <Typography color="text.secondary">
        Kuonは現在メンテナンス作業中です。しばらくしてから再度アクセスしてください。
      </Typography>
    </Paper>
  </Box>
);
