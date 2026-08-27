import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  useServerEvents,
  type ServerEvent,
  type ServerEventCategory,
  type ServerEventLevel,
} from "../../hooks/useServerEvents";

const levelColor = (
  level: ServerEventLevel,
): "default" | "info" | "warning" | "error" => {
  if (level === "error") return "error";
  if (level === "warning") return "warning";
  return "info";
};

const JsonBlock = ({ value }: { value: unknown }) => (
  <Box
    component="pre"
    sx={{
      m: 0,
      p: 1.5,
      borderRadius: 1,
      bgcolor: "action.hover",
      overflowX: "auto",
      fontSize: 12,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}
  >
    {JSON.stringify(value ?? {}, null, 2)}
  </Box>
);

export const ServerEvents = () => {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<ServerEventLevel | "">("");
  const [category, setCategory] = useState<ServerEventCategory | "">("");
  const [eventType, setEventType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<ServerEvent | null>(null);

  const query = useServerEvents({
    page,
    limit: 50,
    level,
    category,
    eventType,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to).toISOString() : undefined,
  });

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            Server Events
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kuonサーバ内部で発生した運用イベントを確認できます。
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={query.isFetching ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          更新
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} flexWrap="wrap" useFlexGap>
          <TextField
            select
            size="small"
            label="Level"
            value={level}
            onChange={(e) => {
              setLevel(e.target.value as ServerEventLevel | "");
              setPage(1);
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">すべて</MenuItem>
            <MenuItem value="info">info</MenuItem>
            <MenuItem value="warning">warning</MenuItem>
            <MenuItem value="error">error</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as ServerEventCategory | "");
              setPage(1);
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">すべて</MenuItem>
            <MenuItem value="system">system</MenuItem>
            <MenuItem value="audit">audit</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Event type"
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value);
              setPage(1);
            }}
            placeholder="backup.completed"
            sx={{ minWidth: 220 }}
          />
          <TextField
            size="small"
            label="From"
            type="datetime-local"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            label="To"
            type="datetime-local"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </Paper>

      {query.isLoading && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      )}

      {query.isError && (
        <Alert severity="error">イベントログの取得に失敗しました。</Alert>
      )}

      {query.data && (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>日時</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Event type</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {query.data.events.map((event) => (
                  <TableRow
                    key={event.id}
                    hover
                    onClick={() => setSelected(event)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {new Date(event.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={event.level}
                        color={levelColor(event.level)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={event.category} variant="outlined" />
                    </TableCell>
                    <TableCell>{event.event_type}</TableCell>
                    <TableCell>{event.source ?? "-"}</TableCell>
                    <TableCell>{event.message}</TableCell>
                  </TableRow>
                ))}
                {query.data.events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      イベントはありません。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {query.data.totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                page={query.data.page}
                count={query.data.totalPages}
                onChange={(_e, value) => setPage(value)}
              />
            </Box>
          )}
        </>
      )}

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Server Event Detail</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={selected.level} color={levelColor(selected.level)} />
                <Chip label={selected.category} variant="outlined" />
                <Chip label={selected.event_type} variant="outlined" />
                {selected.source && (
                  <Chip label={selected.source} variant="outlined" />
                )}
              </Stack>
              <Typography>{selected.message}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(selected.created_at).toLocaleString()} / {selected.id}
              </Typography>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Metadata
                </Typography>
                <JsonBlock value={selected.metadata} />
              </Box>
              {(selected.before_data !== null || selected.after_data !== null) && (
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Before
                    </Typography>
                    <JsonBlock value={selected.before_data} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      After
                    </Typography>
                    <JsonBlock value={selected.after_data} />
                  </Box>
                </Stack>
              )}
              {(selected.actor_user_id ||
                selected.subject_type ||
                selected.correlation_id) && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Context
                  </Typography>
                  <JsonBlock
                    value={{
                      actorUserId: selected.actor_user_id,
                      ipAddress: selected.ip_address,
                      subjectType: selected.subject_type,
                      subjectId: selected.subject_id,
                      correlationId: selected.correlation_id,
                    }}
                  />
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
