import { Paper, Box, Typography, Divider, Button } from "@mui/material";
import { useAuthQuery } from "../../hooks/useAuth";

const mimeToExt: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/gif": "gif",
    "image/webp": "webp",
};

export const UploadedImages = () => {
    const { uploadedImages, uploadedImages_isLoading } = useAuthQuery();

    if (uploadedImages_isLoading) {
        return (
            <Paper
                sx={{ mx: "auto", flex: 1, p: 3, maxWidth: { md: "450px", lg: "600px" } }}
            >
                <Typography>読み込み中...</Typography>
            </Paper>)
            ;
    }

    if (!uploadedImages || uploadedImages.length === 0) {
        return (
            <Paper
                sx={{ mx: "auto", flex: 1, p: 3, maxWidth: { md: "450px", lg: "600px" } }}
            >
                <Typography>画像はまだアップロードされていません</Typography>
            </Paper>
        );
    }
    const handleCopy = (src: string) => {
        const markdown = `![](${src})`;
        navigator.clipboard.writeText(markdown);
    };
    return (
        <Paper
            sx={{
                mx: "auto",
                flex: 1,
                p: 3,
                minWidth: { md: "600px", lg: "850px" },
            }}
        >
            <Typography variant="h5" sx={{ mb: 2 }}>アップロードしたファイル</Typography>
            <Divider />
            {uploadedImages.map((img) => {
                let ext: string;

                if (img.mime_type === "image/jpeg") {
                    // original_name から拡張子を取得
                    const match = img.original_name.match(/\.(jpe?g)$/i);
                    if (match) {
                        // 実際の拡張子を使用（小文字に統一）
                        ext = match[1].toLowerCase();
                    } else {
                        // 万が一拡張子がない場合はデフォルトで jpeg
                        ext = "jpeg";
                    }
                } else {
                    // 他の形式は mimeToExt で対応
                    ext = img.mime_type ? mimeToExt[img.mime_type] || "png" : "png";
                }
                const src = `/uploads/${img.id}.${ext}`;

                return (
                    <>

                        <Box
                            key={img.id}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                my: 2,
                                gap: 2,
                            }}
                        >
                            {/* サムネイル */}
                            <Box
                                component="img"
                                src={src}
                                alt={img.original_name}
                                sx={{
                                    width: 80,
                                    height: 80,
                                    objectFit: "cover",
                                    borderRadius: 1,
                                }}
                            />

                            {/* 情報部分 */}
                            <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                                <Typography sx={{ flex: 1, wordBreak: "break-all" }}>
                                    {img.original_name}
                                </Typography>
                                <Typography sx={{ flex: 1 }}>
                                    アップロード:{" "}
                                    {img.created_at
                                        ? new Date(img.created_at).toLocaleString()
                                        : "-"}
                                </Typography>
                                <Typography sx={{ flex: 1 }}>
                                    サイズ: {img.size_bytes ?? 0} KB
                                </Typography>
                            </Box>
                            <Button variant="outlined" onClick={() => handleCopy(src)}>
                                画像URLをコピー
                            </Button>
                        </Box>

                        <Divider />
                    </>
                );
            })}
        </Paper>
    );
};
