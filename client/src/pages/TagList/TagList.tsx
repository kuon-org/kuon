import { useQuery } from "@tanstack/react-query";
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
} from "@mui/material";

async function fetchTags() {
    const res = await fetch("/api/tags");
    if (!res.ok) throw new Error("タグの取得に失敗しました");
    return res.json();
}

const TagList = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["tags"],
        queryFn: fetchTags,
    });

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Typography color="error" align="center" sx={{ mt: 8 }}>
                タグの取得中にエラーが発生しました。
            </Typography>
        );
    }

    return (
        <Box sx={{ p: 4, backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
            <Typography variant="h5" fontWeight="bold" mb={4}>
                タグ一覧
            </Typography>

            <Grid container spacing={2} >
                {data.map((tag: { name: string }, index: number) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                        <Card
                            sx={{
                                borderRadius: 2,
                                transition: "0.2s",
                                "&:hover": { boxShadow: 6 },
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{ color: "primary.main", fontWeight: 600 }}
                                >
                                    #{tag.name}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export default TagList;
