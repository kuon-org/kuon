import { useQuery } from "@tanstack/react-query";
import { Box } from "@mui/material";
import apiClient from "../../api/client";
import LoadingSkelton from "../common/Loading/LoadingSkelton";
import Loading from "../common/Loading/Loading";

export const PlantUMLRenderer = ({ code }: { code: string }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["plantuml", code],
    queryFn: async () => {
      const res = await apiClient.post("/plantuml/svg", code, {
        headers: {
          "Content-Type": "text/plain",
        },
        responseType: "text",
      });

      return res.data;
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ my: 2, opacity: 0.6 }}>
        <Loading />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box sx={{ my: 2, color: "error.main" }}>PlantUML rendering failed</Box>
    );
  }

  return (
    <Box
      sx={{
        my: 2,
        width: "100%",
        display: "flex",
      }}
    >
      <Box
        sx={{
          width: "100%",
          "& svg": {
            // 絶対値を無視してレスポンシブにするためのセット
            height: "100% !important",
            maxWidth: "100%",
            // 縦横比を崩さないための魔法のプロパティ
            aspectRatio: "auto",
            objectFit: "contain",
          },
        }}
        dangerouslySetInnerHTML={{ __html: data }}
      />
    </Box>
  );
};
