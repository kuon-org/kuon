import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  addGroupMember,
  deleteGroup,
  fetchGroup,
  removeGroupMember,
  type GroupRole,
  updateGroup,
  updateGroupMember,
} from "../../api/groups";
import { groupEditRoute } from "../../routes/groups";

export const GroupEditPage = () => {
  const { slug } = groupEditRoute.useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["groups", slug, "edit"],
    queryFn: () => fetchGroup(slug),
  });
  const data = query.data;
  const canManage =
    data?.current_user_role === "owner" || data?.current_user_role === "admin";
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    description: "",
  });
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<GroupRole>("member");
  useEffect(() => {
    if (data)
      setForm({
        name: data.name,
        display_name: data.display_name,
        description: data.description ?? "",
      });
  }, [data]);
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["groups", slug] });
  const save = useMutation({
    mutationFn: () => updateGroup(slug, form),
    onSuccess: async () => {
      await refresh();
      navigate({ to: "/groups/$slug", params: { slug }, search: { page: 1 } });
    },
  });
  const add = useMutation({
    mutationFn: () => addGroupMember(slug, username, role),
    onSuccess: () => {
      setUsername("");
      void refresh();
    },
  });
  const changeRole = useMutation({
    mutationFn: ({
      userId,
      nextRole,
    }: {
      userId: string;
      nextRole: GroupRole;
    }) => updateGroupMember(slug, userId, nextRole),
    onSuccess: () => void refresh(),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeGroupMember(slug, userId),
    onSuccess: () => void refresh(),
  });
  const removeGroup = useMutation({
    mutationFn: () => deleteGroup(slug),
    onSuccess: () => navigate({ to: "/groups", search: { page: 1 } }),
  });
  if (query.isLoading)
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  if (!data || !canManage)
    return (
      <Container sx={{ py: 4 }}>
        <Typography>編集権限がありません。</Typography>
      </Container>
    );
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" mb={2}>
            グループ編集
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="表示名"
              value={form.display_name}
              onChange={(e) =>
                setForm({ ...form, display_name: e.target.value })
              }
            />
            <TextField
              label="名前"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="説明"
              multiline
              minRows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <Box display="flex" gap={1}>
              <Button variant="contained" onClick={() => save.mutate()}>
                保存
              </Button>
              <Button
                onClick={() =>
                  navigate({
                    to: "/groups/$slug",
                    params: { slug },
                    search: { page: 1 },
                  })
                }
              >
                戻る
              </Button>
            </Box>
          </Stack>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" mb={2}>
            メンバー管理
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={2}>
            <TextField
              size="small"
              label="ユーザー名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Select
              size="small"
              value={role}
              onChange={(e) => setRole(e.target.value as GroupRole)}
            >
              <MenuItem value="member">member</MenuItem>
              <MenuItem value="admin">admin</MenuItem>
            </Select>
            <Button onClick={() => add.mutate()}>追加</Button>
          </Stack>
          <Stack spacing={1}>
            {data.user_groups.map((member) => (
              <Box
                key={member.users.id}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Avatar src={member.users.avatar_url} />
                <Box flex={1}>{member.users.display_name}</Box>
                {member.role === "owner" ? (
                  <Typography>{member.role}</Typography>
                ) : (
                  <>
                    <Select
                      size="small"
                      value={member.role}
                      onChange={(e) =>
                        changeRole.mutate({
                          userId: member.users.id,
                          nextRole: e.target.value as GroupRole,
                        })
                      }
                    >
                      <MenuItem value="member">member</MenuItem>
                      <MenuItem value="admin">admin</MenuItem>
                    </Select>
                    <Button
                      color="error"
                      onClick={() => remove.mutate(member.users.id)}
                    >
                      削除
                    </Button>
                  </>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
        {data.current_user_role === "owner" && (
          <Button
            color="error"
            onClick={() =>
              window.confirm("グループを削除しますか？") && removeGroup.mutate()
            }
          >
            グループを削除
          </Button>
        )}
      </Stack>
    </Container>
  );
};
