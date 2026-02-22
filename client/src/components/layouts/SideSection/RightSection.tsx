import { Box, Typography, Divider, Paper } from "@mui/material";
import type { ReactNode } from "react";

interface RightSectionProps {
  children?: ReactNode;
  sticky?: boolean;
}

const RightSection = ({ children, sticky = false }: RightSectionProps) => {
  return (
    <Box
      sx={{
        display: { xs: "none", sm: "none", md: "block" }, // 👈 スマホでは非表示！
        width: "auto",
        minWidth: "200px",
        mr: 4,
        p: 2,
        boxSizing: "border-box",
        position: sticky ? "sticky" : "relative",
        top: sticky ? "120px" : "auto",
        alignSelf: "flex-start",
        height: "fit-content",
      }}
    >
      <Paper elevation={0} sx={{ p: 2, mb: 3, mt: 4 }}>
        {!children ? (
          <Typography variant="h6" gutterBottom>
            何か入れる予定
          </Typography>
        ) : (
          children
        )}
      </Paper>
      <Divider />
    </Box>
  );
};

export default RightSection;
