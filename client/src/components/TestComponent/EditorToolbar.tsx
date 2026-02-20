import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Divider, Menu, MenuItem, ListItemText, Typography } from '@mui/material';
import {
    FormatSize, FormatBold, FormatItalic, FormatUnderlined, StrikethroughS,
    FormatListBulleted, FormatListNumbered, FormatQuote, HorizontalRule,
    Code, IntegrationInstructions, TableChart, Image, Link, Delete, Undo, Redo,
    Sync, SyncDisabled
} from '@mui/icons-material';

interface EditorToolbarProps {
    onAction: (type: string) => void;
    isSync: boolean;
    onSyncToggle: () => void;
    onImageClick: () => void;
}

export const EditorToolbar = ({ onAction, isSync, onSyncToggle, onImageClick }: EditorToolbarProps) => {
    const [headingAnchor, setHeadingAnchor] = useState<null | HTMLElement>(null);

    const handleHeadingAction = (level: number) => {
        onAction(`h${level}`);
        setHeadingAnchor(null);
    };
    const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
        setHeadingAnchor(event.currentTarget);
    };

    // マウスが離れた時（メニューの外に出た時）
    const handleMouseLeave = () => {
        setHeadingAnchor(null);
    };

    const mainButtons = [
        { icon: <FormatBold />, type: 'bold', label: '太字' },
        { icon: <FormatItalic />, type: 'italic', label: '斜体' },
        { icon: <FormatUnderlined />, type: 'underline', label: '下線' },
        { icon: <StrikethroughS />, type: 'strikethrough', label: '打消線' },
        { divider: true },
        { icon: <FormatListBulleted />, type: 'ul', label: '箇条書き' },
        { icon: <FormatListNumbered />, type: 'ol', label: '番号付きリスト' },
        { icon: <FormatQuote />, type: 'quote', label: '引用' },
        { icon: <HorizontalRule />, type: 'hr', label: '区切り線' },
        { divider: true },
        { icon: <Code />, type: 'code', label: 'コード' },
        { icon: <IntegrationInstructions />, type: 'codeblock', label: 'コードブロック' },
        { icon: <TableChart />, type: 'table', label: 'テーブル' },
        { icon: <Image />, type: 'image', label: '画像' },
        { icon: <Link />, type: 'link', label: 'リンク' },
        { divider: true },
        { icon: <Delete />, type: 'clear', label: '全消去' },
        { icon: <Undo />, type: 'undo', label: '元に戻す' },
        { icon: <Redo />, type: 'redo', label: 'やり直し' },
    ];

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', p: 0.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f9f9f9' }}>
            {/* 見出しメニュー */}
            <Box onMouseLeave={handleMouseLeave}>
                <Tooltip title="見出し" arrow>
                    <IconButton
                        size="small"
                        onMouseEnter={handleMouseEnter}
                        sx={{ color: headingAnchor ? 'primary.main' : 'rgba(0,0,0,0.6)' }}
                    >
                        <FormatSize />
                    </IconButton>
                </Tooltip>

                <Menu
                    anchorEl={headingAnchor}
                    open={Boolean(headingAnchor)}
                    onClose={handleMouseLeave}
                    // メニュー自体にマウスが乗っている間は閉じないようにする
                    MenuListProps={{ onMouseEnter: () => setHeadingAnchor(headingAnchor), onMouseLeave: handleMouseLeave }}
                    // ホバーで出す際の表示位置の微調整
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    // 背景のクリック不可（ホバーを邪魔しないため）
                    slotProps={{
                        paper: {
                            sx: { pointerEvents: 'auto' }
                        }
                    }}
                    sx={{ pointerEvents: 'none' }}
                >
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                        <MenuItem key={l} onClick={() => handleHeadingAction(l)}>
                            <ListItemText>見出し {l}</ListItemText>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                {'#'.repeat(l)}
                            </Typography>
                        </MenuItem>
                    ))}
                </Menu>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

            {mainButtons.map((btn, i) => (
                btn.divider ? (
                    <Divider key={`div-${i}`} orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
                ) : (
                    <Tooltip key={btn.type} title={btn.label} arrow>
                        <IconButton sx={{ color: 'rgba(0,0,0,0.6)' }} size="small" onClick={() => btn.type === 'image' ? onImageClick() : onAction(btn.type as string)}>
                            {btn.icon}
                        </IconButton>
                    </Tooltip>
                )
            ))}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

            <Tooltip title={isSync ? "スクロール同期ON" : "スクロール同期OFF"} arrow>
                <IconButton size="small" onClick={onSyncToggle} sx={{ color: isSync ? "primary" : "default" }}>
                    {isSync ? <Sync /> : <SyncDisabled />}
                </IconButton>
            </Tooltip>
        </Box>
    );
};