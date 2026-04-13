import React, { useState } from "react";
import { Box, Dialog, DialogContent } from "@mui/material";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export const ZoomableContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        component="span"
        onClick={() => setOpen(true)}
        sx={{
          cursor: "pointer",
        }}
      >
        {children}
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullScreen
        PaperProps={{
          sx: { bgcolor: "rgba(0,0,0,0.9)" },
        }}
      >
        <DialogContent
          onClick={() => setOpen(false)}
          sx={{
            p: 0,
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box sx={{ width: "100%", height: "100%" }}>
            <TransformWrapper
              initialScale={1}
              minScale={0.2}
              maxScale={5}
              centerOnInit
              limitToBounds={false}
              centerZoomedOut
              doubleClick={{ mode: "zoomIn" }}
              pinch={{ step: 5 }}
              wheel={{
                step: 0.02, // 小さく
              }}
            >
              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    "& svg, & img": {
                      maxWidth: "95vw",
                      maxHeight: "95vh",
                      bgcolor: "white",
                      borderRadius: 1,
                    },
                  }}
                >
                  {open ? React.cloneElement(children as any) : null}
                </Box>
              </TransformComponent>
            </TransformWrapper>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
