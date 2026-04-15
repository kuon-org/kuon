import { useState, useMemo, useRef, useEffect } from "react";
import {
  Dialog,
  IconButton,
  Box,
  CircularProgress,
  Typography,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useArticles } from "../../hooks/useArticles";
import { useKey } from "../../hooks/useKey";

const SlideViewer = ({
  data,
  loading,
  onClose,
}: {
  data: any;
  loading: boolean;
  onClose: () => void;
}) => {
  const [page, setPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const totalPages = useMemo(() => {
    if (!data?.html) return 0;

    const parser = new DOMParser();
    const doc = parser.parseFromString(data.html, "text/html");
    const sections = Array.from(doc.querySelectorAll("section"));

    const validSections = sections.filter((section) => {
      const hasText = section.textContent?.trim().length > 0;
      const hasTags = section.children.length > 0;
      return hasText || hasTags;
    });

    return validSections.length;
  }, [data?.html]);

  const handleNext = () =>
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  const handleBack = () => setPage((prev) => Math.max(prev - 1, 0));
  useKey(
    "Enter",
    () => {
      toggleFullscreen();
    },
    { ctrlKey: true, preventDefault: true },
  );
  useKey("ArrowRight", handleNext, { preventDefault: true });
  useKey("ArrowLeft", handleBack, { preventDefault: true });

  return (
    <Box
      ref={containerRef}
      onClick={onClose}
      tabIndex={0}
      sx={{
        outline: "none",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#121212",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        color: "white",
      }}
    >
      {/* 右上コントロール */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          sx={{
            color: "rgba(255,255,255,0.7)",
            "&:hover": { color: "white" },
          }}
        >
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>

        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          sx={{
            color: "rgba(255,255,255,0.7)",
            "&:hover": { color: "white" },
          }}
        >
          <CloseIcon sx={{ fontSize: 32 }} />
        </IconButton>
      </Stack>

      {/* メインコンテンツ */}
      <Box
        onClick={(e) => {
          e.stopPropagation();

          const rect = (
            e.currentTarget as HTMLDivElement
          ).getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = clickX / rect.width;
          if (ratio > 0.55) handleNext();
          else if (ratio < 0.45) handleBack();
        }}
        sx={{
          width: isFullscreen ? "100%" : "80%",
          height: isFullscreen ? "100%" : "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transition: "all 0.2s ease",
        }}
      >
        {loading ? (
          <CircularProgress color="inherit" />
        ) : (
          data && (
            <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
              <style dangerouslySetInnerHTML={{ __html: data.css }} />
              <style>{`
                #marp-container > svg {
                  display: none !important;
                }
                #marp-container > svg:nth-of-type(${page + 1}) {
                  display: block !important;
                  width: ${isFullscreen ? "100vw" : "auto"};
                  height: ${isFullscreen ? "100vh" : "auto"};
                  object-fit: contain;
                  margin: auto;
                  box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                }
                #marp-container {
                  display: flex;
                  width: 100%;
                  height: 100%;
                  justify-content: center;
                  align-items: center;
                }
              `}</style>
              <Box
                className="marp-rendered-content"
                dangerouslySetInnerHTML={{ __html: data.html }}
              />
            </Box>
          )
        )}
      </Box>

      {/* ナビゲーション */}
      {!loading && totalPages > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            right: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          {!isFullscreen && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                position: "absolute",
                bottom: 30,
                right: 0,
                backgroundColor: "rgba(255,255,255,0.1)",
                padding: "4px 12px",
                borderRadius: "20px",
                backdropFilter: "blur(4px)",
              }}
            >
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleBack();
                }}
                disabled={page === 0}
                sx={{ color: "white" }}
              >
                <NavigateBeforeIcon />
              </IconButton>

              <Typography
                variant="body2"
                sx={{ minWidth: "40px", textAlign: "center" }}
              >
                {page + 1} / {totalPages}
              </Typography>

              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                disabled={page === totalPages - 1}
                sx={{ color: "white" }}
              >
                <NavigateNextIcon />
              </IconButton>
            </Stack>
          )}

          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              width: "100%",
              height: 3,
              backgroundColor: "transparent",
            }}
          >
            <Box
              sx={{
                width: `${((page + 1) / totalPages) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, transparent, #3f51b5)",
                transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export const MarpSlideDialog = ({
  articleId,
  open,
  onClose,
}: {
  articleId: string;
  open: boolean;
  onClose: () => void;
}) => {
  const { marp: data, marpIsLoading: loading } = useArticles(articleId);

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      {open && (
        <SlideViewer
          key={`${articleId}-${open}`}
          data={data}
          loading={loading}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};
