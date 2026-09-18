import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Box, Button, Container, Divider, MenuItem, Paper, Select, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { addGroupMember, fetchGroup, removeGroupMember, type GroupRole, updateGroup, updateGroupMember } from "../../api/groups";
import { ArticleCard } from "../../components/Article/ArticleCard";
import { groupDetailRoute } from "../../routes/groups";

export const GroupDetailPage = () => {
  const { slug } = groupDetailRoute.useParams();
  const { page } = groupDetailRoute.useSearch();
  const { t } = useTranslation("groups");
  const queryClient = useQueryClient();
  const group = useQuery({ queryKey: ["groups", slug, page], queryFn: () => fetchGroup(slug, page) });
  const data = group.data;
  const canManage = data?.current_user_role === "owner" || data?.current_user_role === "admin";
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<GroupRole>("member");
  const [edit, setEdit] = useState({ name: "", display_name: "", description: "" });
  useEffect(() => {
    if (data) setEdit({ name: data.name, display_name: data.display_name, description: data.description ?? "" });
  }, [data?.id, data?.name, data?.display_name, data?.description]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["groups", slug] });
  const add = useMutation({ mutationFn: () => addGroupMember(slug, username, role), onSuccess: () => { setUsername(""); void refresh(); } });
  const remove = useMutation({ mutationFn: (userId: string) => removeGroupMember(slug, userId), onSuccess: () => void refresh() });
  const changeRole = useMutation({ mutationFn: ({ userId, nextRole }: { userId: string; nextRole: GroupRole }) => updateGroupMember(slug, userId, nextRole), onSuccess: () => void refresh() });
  const save = useMutation({ mutationFn: () => updateGroup(slug, edit), onSuccess: () => void refresh() });
  if (group.isLoading) return <Container sx={{ py: 4 }}><Typography>{t("loading")}</Typography></Container>;
  if (!data) return <Container sx={{ py: 4 }}><Typography>{t("notFound")}</Typography></Container>;

  return <Container sx={{ py: 4 }}>
    <Paper sx={{ p: 3, mb: 3 }}>
      {canManage ? <Stack spacing={2}>
        <TextField label={t("fields.displayName")} value={edit.display_name} onChange={(e) => setEdit({ ...edit, display_name: e.target.value })} />
        <TextField label={t("fields.name")} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
        <TextField label={t("fields.description")} multiline minRows={2} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
        <Typography color="text.secondary">@{data.slug}</Typography>
        <Button size="small" variant="outlined" onClick={() => save.mutate()} disabled={save.isPending || !edit.name || !edit.display_name}>{t("actions.save")}</Button>
      </Stack> : <><Typography variant="h4">{data.display_name}</Typography><Typography color="text.secondary">@{data.slug}</Typography><Typography sx={{ mt: 2 }}>{data.description}</Typography></>}
    </Paper>
    <Paper sx={{ p: 3, mb: 3 }}><Typography variant="h6" mb={2}>{t("detail.members")}</Typography>
      {canManage && <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={2}>
        <TextField size="small" label={t("fields.username")} value={username} onChange={(e) => setUsername(e.target.value)} />
        <Select size="small" value={role} onChange={(e) => setRole(e.target.value as GroupRole)}><MenuItem value="member">member</MenuItem><MenuItem value="admin">admin</MenuItem></Select>
        <Button variant="outlined" disabled={!username || add.isPending} onClick={() => add.mutate()}>{t("actions.add")}</Button>
      </Stack>}
      <Stack divider={<Divider flexItem />}>
        {data.user_groups.map((membership) => <Box key={membership.users.id} display="flex" alignItems="center" gap={2} py={1}>
          <Avatar src={membership.users.avatar_url} /><Box flex={1}><Typography>{membership.users.display_name}</Typography><Typography variant="caption">@{membership.users.username}</Typography></Box>
          {canManage && membership.role !== "owner" ? <Select size="small" value={membership.role} onChange={(e) => changeRole.mutate({ userId: membership.users.id, nextRole: e.target.value as GroupRole })}><MenuItem value="member">member</MenuItem><MenuItem value="admin">admin</MenuItem></Select> : <Typography variant="caption">{membership.role}</Typography>}
          {canManage && membership.role !== "owner" && <Button color="error" size="small" onClick={() => remove.mutate(membership.users.id)}>{t("actions.remove")}</Button>}
        </Box>)}
      </Stack>
    </Paper>
    <Typography variant="h5" mb={2}>{t("detail.articles")}</Typography>
    <Stack spacing={2}>{data.articles.map((article) => <ArticleCard key={article.id} article={article} />)}</Stack>
  </Container>;
};
