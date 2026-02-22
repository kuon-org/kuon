import { Divider, Paper, Typography } from "@mui/material"
import { AuthSettings } from "../../components/Admin/Security/AuthSettings"



export const Security = () => {

    return (
        <Paper
            elevation={0} // お好みで調整
            sx={{
                mx: "auto",
                p: 3,
                minWidth: { xs: "100%", md: "600px", lg: "850px" },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2
            }}
        >
            <Typography variant="h4" sx={{ mb: 3 }}>セキュリティ設定</Typography>
            <Divider sx={{ mb: 3 }} />
            <AuthSettings />
        </Paper>
    )
}