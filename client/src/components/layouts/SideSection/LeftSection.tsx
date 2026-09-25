import { Box } from "@mui/material";
import type { ReactNode } from "react";

interface LeftSectionProps {
  children?: ReactNode;
  sticky?: boolean;
}

const LeftSection = ({ children, sticky = false }: LeftSectionProps) => {
  return (
    <Box
      sx={{
        display: { xs: "none", sm: "none", md: "block" }, // 👈 スマホでは非表示！
        width: "auto",
        minWidth: "200px",
        maxWidth: "300px",
        ml: "auto",
        height: "fit-content",
        position: sticky ? "sticky" : "relative",
        top: sticky ? "120px" : "auto",
        boxSizing: "border-box",
        alignSelf: "flex-start",
        justifyContent: "center",
        overflowY: "auto",
      }}
    >
      {children && <Box sx={{ width: sticky ? 120 : 250, mx: "auto", p: 2, mt: 4 }}>
        {children}
      </Box>}
    </Box>
  );
};

export default LeftSection;
