import { Box, Paper } from "@mui/material"
import LoadingSkelton from "../../components/common/Loading/LoadingSkelton"

export const ArticleList = () => {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Paper sx={{ width:  { xs: "100%", sm: "600px" }, height: "100px" }}>
                <LoadingSkelton />
            </Paper>
            <Paper sx={{ width:  { xs: "100%", sm: "600px" }, height: "100px" }}>
                <LoadingSkelton />
            </Paper>
            <Paper sx={{ width:  { xs: "100%", sm: "600px" }, height: "100px" }}>
                <LoadingSkelton />
            </Paper>
        </Box>
    )
}
  