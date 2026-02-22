import { useState } from 'react';
import { Box, IconButton, Tooltip, Divider, Menu, MenuItem, ListItemText, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
    FormatSize, FormatBold, FormatItalic, FormatUnderlined, StrikethroughS,
    FormatListBulleted, FormatListNumbered, FormatQuote, HorizontalRule,
    Code, IntegrationInstructions, TableChart, Image, Link, Delete, Undo, Redo,
    Sync, SyncDisabled,
    VerticalSplit, ViewHeadline, Visibility, Fullscreen, FullscreenExit
} from '@mui/icons-material';

interface EditorToolbarProps {
    onAction: (type: string) => void;
    isSync: boolean;
    onSyncToggle: () => void;
    onImageClick: () => void;
    viewMode: 'split' | 'editor' | 'preview';
    setViewMode: (mode: 'split' | 'editor' | 'preview') => void;
    isFullscreen: boolean;
    onFullscreenToggle: () => void;
}

export const EditorToolbar = ({
    onAction, isSync, onSyncToggle, onImageClick,
    viewMode, setViewMode, isFullscreen, onFullscreenToggle
}: EditorToolbarProps) => {
    const [headingAnchor, setHeadingAnchor] = useState<null | HTMLElement>(null);
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const handleHeadingAction = (level: number) => {
        onAction(`h${level}`);
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

    // アクティブなボタン（水色）のスタイル
    const activeStyle = {
        color: '#00bfff', // 水色
        bgcolor: 'rgba(0, 191, 255, 0.08)',
        '&:hover': { bgcolor: 'rgba(0, 191, 255, 0.15)' }
    };

    // 通常のボタン（グレー）のスタイル
    const normalStyle = {
        color: 'rgba(0,0,0,0.54)',
        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
    };

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', p: 0.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f9f9f9' }}>
            <Box onMouseLeave={() => setHeadingAnchor(null)}>
                <Tooltip title="見出し" arrow>
                    <IconButton size="small" onMouseEnter={(e) => setHeadingAnchor(e.currentTarget)} sx={normalStyle}>
                        <FormatSize />
                    </IconButton>
                </Tooltip>
                <Menu
                    anchorEl={headingAnchor}
                    open={Boolean(headingAnchor)}
                    onClose={() => setHeadingAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                        <MenuItem key={l} onClick={() => handleHeadingAction(l)}>
                            <ListItemText>見出し {l}</ListItemText>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>{'#'.repeat(l)}</Typography>
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
                        <IconButton sx={normalStyle} size="small" onClick={() => btn.type === 'image' ? onImageClick() : onAction(btn.type as string)}>
                            {btn.icon}
                        </IconButton>
                    </Tooltip>
                )
            ))}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

            {/* 表示モード：ここを個別にスタイル判定 */}
            {!isSmall && (
                <>
                    <Tooltip title="エディタのみ" arrow>
                        <IconButton size="small" onClick={() => setViewMode('editor')} sx={viewMode === 'editor' ? activeStyle : normalStyle}>
                            <ViewHeadline />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="分割表示" arrow>
                        <IconButton size="small" onClick={() => setViewMode('split')} sx={viewMode === 'split' ? activeStyle : normalStyle}>
                            <VerticalSplit />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="プレビューのみ" arrow>
                        <IconButton size="small" onClick={() => setViewMode('preview')} sx={viewMode === 'preview' ? activeStyle : normalStyle}>
                            <Visibility />
                        </IconButton>
                    </Tooltip>
                </>
            )}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

            {/* 全画面 */}
            <Tooltip title={isFullscreen ? "全画面解除" : "全画面表示"} arrow>
                <IconButton size="small" onClick={onFullscreenToggle} sx={isFullscreen ? activeStyle : normalStyle}>
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

            {/* スクロール同期 */}
            <Tooltip title={isSync ? "スクロール同期ON" : "スクロール同期OFF"} arrow>
                <IconButton size="small" onClick={onSyncToggle} sx={isSync ? activeStyle : normalStyle}>
                    {isSync ? <Sync /> : <SyncDisabled />}
                </IconButton>
            </Tooltip>
        </Box>
    );
};