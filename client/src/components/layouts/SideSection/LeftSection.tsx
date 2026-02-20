// import {
//   Box,
//   Typography,
//   List,
//   ListItem,
//   ListItemText,
//   Avatar,
//   Divider,
//   Stack,
//   Paper,
//   CircularProgress,
// } from "@mui/material";
// import { useTags } from "../../../hooks/useTags"; // 上記で作成したフック

// interface User {
//   name: string;
//   score: number;
// }

// const LeftSection = () => {
//   // TanStack Query を使用
//   const { data: tags = [], isLoading, isError } = useTags();

//   const userRanking: User[] = [
//     { name: "Yamada", score: 1200 },
//     { name: "Tanaka", score: 980 },
//     { name: "Suzuki", score: 870 },
//     { name: "Kobayashi", score: 830 },
//     { name: "Sato", score: 790 },
//   ];

//   return (
//     <Box
//       sx={{
//         width: 260,
//         ml: 16,
//         p: 2,
//         height: "100vh",
//         boxSizing: "border-box",
//         overflowY: "auto",
//       }}
//     >
//       <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           フォロー中のタグ
//         </Typography>

//         {isLoading ? (
//           <Box textAlign="center" mt={2}>
//             <CircularProgress size={20} />
//           </Box>
//         ) : isError ? (
//           <Typography variant="body2" color="error">
//             データの取得に失敗しました
//           </Typography>
//         ) : tags.length === 0 ? (
//           <Typography variant="body2">タグがありません</Typography>
//         ) : (
//           <Stack spacing={1}>
//             {tags.map((tag) => (
//               <Box
//                 key={tag.id}
//                 sx={{
//                   display: "inline-block",
//                   bgcolor: "#e0f7fa",
//                   color: "#00796b",
//                   px: 1.5,
//                   py: 0.5,
//                   borderRadius: "12px",
//                   fontSize: "0.9rem",
//                   fontWeight: 500,
//                   width: "fit-content",
//                 }}
//               >
//                 {tag.name} ({tag.articleCount})
//               </Box>
//             ))}
//           </Stack>
//         )}
//       </Paper>

//       <Divider />

//       <Paper elevation={0} sx={{ p: 2, mt: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           ユーザーランキング
//         </Typography>
//         <List dense>
//           {userRanking.map((user, index) => (
//             <ListItem key={user.name}>
//               <Avatar sx={{ mr: 1, bgcolor: "#90caf9" }}>{index + 1}</Avatar>
//               <ListItemText
//                 primary={user.name}
//                 secondary={`スコア: ${user.score}`}
//               />
//             </ListItem>
//           ))}
//         </List>
//       </Paper>
//     </Box>
//   );
// };

// export default LeftSection;

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface LeftSectionProps {
  children?: ReactNode;
  sticky?: boolean;
}

const LeftSection = ({ children, sticky = false }: LeftSectionProps) => {
  return (
    <Box
      sx={{
        display: { xs: "none", sm: "none", md: "block" }, // 👈 スマホでは非表示！
        width: "auto",
        minWidth: "200px",
        ml: "auto",
        p: 2,
        height: "fit-content",
        position: sticky ? "sticky" : "relative",
        top: sticky ? "120px" : "auto",
        boxSizing: "border-box",
        alignSelf: "flex-start",
        justifyContent: "center",
        overflowY: "auto",
      }}
    >
      <Box sx={{ width: sticky ? 120 : 200, mx: "auto", p: 2, mt: 4 }}>
        {!children ? (
          <Typography variant="h6" gutterBottom>
            何か入れる予定
          </Typography>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};

export default LeftSection;
