import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, Card, CardContent, Container, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { createGroup, fetchGroups } from "../../api/groups";
import { useAuthUserQuery } from "../../hooks/auth";
import { useMyPermissionsQuery } from "../../hooks/roles";

export const Groups = () => {
  const { t } = useTranslation("groups");
  const user = useAuthUserQuery().data;
  const permissions = useMyPermissionsQuery(!!user).data?.permissions ?? [];
  const canCreateGroup = permissions.includes("group.create");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const groups = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", display_name: "", slug: "", description: "" });
  const create = useMutation({
    mutationFn: () => createGroup(form),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["groups"] }); setOpen(false); setForm({ name: "", display_name: "", slug: "", description: "" }); },
  });

  return <Container sx={{ py: 4 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h4">{t("list.title")}</Typography>
      {canCreateGroup && <Button variant="contained" onClick={() => setOpen(true)}>{t("list.create")}</Button>}
    </Box>
    <Stack spacing={2}>
      {groups.data?.map((group) => <Card key={group.id} variant="outlined" onClick={() => navigate({ to: "/group/$slug", params: { slug: group.slug }, search: { page: 1 } })} sx={{ cursor: "pointer", transition: "background-color 0.2s", "&:hover": { bgcolor: "action.hover" } }}>
        <CardContent>
          <Typography variant="h6">{group.display_name}</Typography>
          <Typography color="text.secondary">@{group.slug}</Typography>
          <Typography sx={{ my: 1 }}>{group.description}</Typography>
          <Typography variant="caption">{t("list.counts", { members: group._count.user_groups, articles: group._count.articles })}</Typography>
        </CardContent>
      </Card>)}
    </Stack>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>{t("create.title")}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
        <TextField label={t("fields.displayName")} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        <TextField label={t("fields.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField label={t("fields.slug")} value={form.slug} helperText={t("fields.slugHint")} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} />
        <TextField label={t("fields.description")} multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Stack></DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)}>{t("actions.cancel")}</Button><Button variant="contained" disabled={create.isPending || !form.name || !form.display_name || !form.slug} onClick={() => create.mutate()}>{t("actions.create")}</Button></DialogActions>
    </Dialog>
  </Container>;
};
