import { useState } from "react";
import {
    Box,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Typography,
    AppBar,
    Toolbar,
} from "@mui/material";
import MarkdownEditor from "./MarkdownEditor";
import { type UseMutateFunction } from "@tanstack/react-query";

import { type Article } from "../../hooks/useArticles";
import { NavButton } from "../common/NavButton";

interface ArticleEditorProps {
    mutate: UseMutateFunction<any, any, any, unknown>,
    isFetching: boolean;
    article?: Article;
}

export default function ArticleEditor({ mutate, isFetching, article }: ArticleEditorProps) {
    const [title, setTitle] = useState(article?.title ?? "");
    const [summary, setSummary] = useState(article?.summary ?? "");
    const [text, setText] = useState(article?.raw_content ?? "");
    const [isPublished, setIsPublished] = useState(article?.is_published ?? false);
    const [isEdited, setIsEdited] = useState(false);



    const handleSubmit = () => {
        if (!title.trim() || !text.trim()) {
            alert("タイトルと本文は必須です");
            return;
        }

        // フック経由でデータを送信
        mutate({
            title,
            content: text,
            summary,
            isPublished
        });

    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "hidden" }}>
            {/* 🧭 上部AppBarセクション */}
            <AppBar position="relative" color="default" >
                <Toolbar
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    {/* 左側：タイトル */}
                    <Typography variant="h6" color="inherit">
                        新規記事の作成
                    </Typography>

                    {/* 右側：スイッチ＋ボタン */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isPublished}
                                    onChange={(e) => setIsPublished(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={isPublished ? "公開する" : "下書きにする"}
                        />
                        <NavButton path={article ? "/drafts" : "/"} message="キャンセル" />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={isFetching}
                        >
                            {isFetching ? "送信中..." : "投稿"}
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* 📝 本文エリア */}
            <Box
                sx={{
                    flex: 1,
                    p: 3,
                    overflow: "hidden",   // ← 外側ではスクロールさせない
                    backgroundColor: "background.default",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <TextField
                    fullWidth
                    label="タイトル"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="要約"
                    multiline
                    minRows={1}
                    maxRows={3} // ← 最大3行
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    sx={{
                        mb: 2,
                        '& .MuiInputBase-inputMultiline': {
                            overflowY: 'auto', // ← スクロールバー表示
                        },
                    }}
                />


                <MarkdownEditor text={text} setText={setText} setIsEdited={setIsEdited} />
            </Box>
        </Box>
    );
}
