import { Add, Delete, DataObject } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { WebhookVariable } from "../../hooks/useWebhooks";

export type PayloadNode =
  | { type: "object"; properties: PayloadProperty[] }
  | { type: "array"; items: PayloadNode[] }
  | { type: "variable"; variable: string }
  | { type: "text"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean };
export type PayloadProperty = { key: string; value: PayloadNode };

export const templateToNode = (value: unknown): PayloadNode => {
  if (Array.isArray(value)) return { type: "array", items: value.map(templateToNode) };
  if (value !== null && typeof value === "object") {
    return {
      type: "object",
      properties: Object.entries(value).map(([key, child]) => ({ key, value: templateToNode(child) })),
    };
  }
  if (typeof value === "boolean") return { type: "boolean", value };
  if (typeof value === "number") return { type: "number", value };
  if (typeof value === "string") {
    const match = value.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    if (match) return { type: "variable", variable: match[1] };
    return { type: "text", value };
  }
  return { type: "text", value: "" };
};

export const nodeToTemplate = (node: PayloadNode): unknown => {
  switch (node.type) {
    case "object": return Object.fromEntries(node.properties.map((p) => [p.key, nodeToTemplate(p.value)]));
    case "array": return node.items.map(nodeToTemplate);
    case "variable": return `{{${node.variable}}}`;
    case "text": return node.value;
    case "number": return node.value;
    case "boolean": return node.value;
  }
};

const newNode = (type: PayloadNode["type"]): PayloadNode => {
  if (type === "object") return { type, properties: [] };
  if (type === "array") return { type, items: [] };
  if (type === "variable") return { type, variable: "article.title" };
  if (type === "number") return { type, value: 0 };
  if (type === "boolean") return { type, value: true };
  return { type: "text", value: "" };
};

const NodeEditor = ({ node, variables, onChange, onDelete, label }: {
  node: PayloadNode;
  variables: WebhookVariable[];
  onChange: (node: PayloadNode) => void;
  onDelete?: () => void;
  label?: string;
}) => {
  const setType = (type: PayloadNode["type"]) => onChange(newNode(type));
  return (
    <Paper variant="outlined" sx={{ p: 1.5, width: "100%" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
        {label && <Typography sx={{ minWidth: 54 }} color="text.secondary">{label}</Typography>}
        <Select size="small" value={node.type} onChange={(e) => setType(e.target.value as PayloadNode["type"])} sx={{ minWidth: 130 }}>
          <MenuItem value="variable">Kuon value</MenuItem><MenuItem value="text">Text</MenuItem>
          <MenuItem value="number">Number</MenuItem><MenuItem value="boolean">Boolean</MenuItem>
          <MenuItem value="object">Object {'{}'}</MenuItem><MenuItem value="array">Array []</MenuItem>
        </Select>
        {node.type === "variable" && (
          <Select size="small" value={node.variable} onChange={(e) => onChange({ ...node, variable: e.target.value })} sx={{ flex: 1, minWidth: 180 }}>
            {variables.map((v) => <MenuItem key={v.key} value={v.key}>{v.group} / {v.label}</MenuItem>)}
          </Select>
        )}
        {node.type === "text" && <TextField size="small" value={node.value} onChange={(e) => onChange({ ...node, value: e.target.value })} sx={{ flex: 1 }} />}
        {node.type === "number" && <TextField size="small" type="number" value={node.value} onChange={(e) => onChange({ ...node, value: Number(e.target.value) })} sx={{ flex: 1 }} />}
        {node.type === "boolean" && <Select size="small" value={String(node.value)} onChange={(e) => onChange({ ...node, value: e.target.value === "true" })}><MenuItem value="true">true</MenuItem><MenuItem value="false">false</MenuItem></Select>}
        {onDelete && <IconButton size="small" onClick={onDelete}><Delete fontSize="small" /></IconButton>}
      </Stack>
      {node.type === "object" && (
        <Stack spacing={1} sx={{ mt: 1.5, pl: { xs: 1, sm: 2 }, borderLeft: 2, borderColor: "divider" }}>
          {node.properties.map((property, index) => (
            <Stack key={index} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-start">
              <TextField size="small" label="Property" value={property.key} onChange={(e) => { const properties = [...node.properties]; properties[index] = { ...property, key: e.target.value }; onChange({ ...node, properties }); }} sx={{ width: { xs: "100%", sm: 180 } }} />
              <NodeEditor node={property.value} variables={variables} onChange={(value) => { const properties = [...node.properties]; properties[index] = { ...property, value }; onChange({ ...node, properties }); }} onDelete={() => onChange({ ...node, properties: node.properties.filter((_, i) => i !== index) })} />
            </Stack>
          ))}
          <Button startIcon={<Add />} onClick={() => onChange({ ...node, properties: [...node.properties, { key: "property", value: newNode("variable") }] })} sx={{ alignSelf: "flex-start" }}>Property</Button>
        </Stack>
      )}
      {node.type === "array" && (
        <Stack spacing={1} sx={{ mt: 1.5, pl: { xs: 1, sm: 2 }, borderLeft: 2, borderColor: "divider" }}>
          {node.items.map((item, index) => <NodeEditor key={index} label={`#${index}`} node={item} variables={variables} onChange={(value) => { const items = [...node.items]; items[index] = value; onChange({ ...node, items }); }} onDelete={() => onChange({ ...node, items: node.items.filter((_, i) => i !== index) })} />)}
          <Button startIcon={<Add />} onClick={() => onChange({ ...node, items: [...node.items, newNode("object")] })} sx={{ alignSelf: "flex-start" }}>Item</Button>
        </Stack>
      )}
    </Paper>
  );
};

export const PayloadBuilder = ({ value, variables, onChange }: { value: unknown; variables: WebhookVariable[]; onChange: (value: unknown) => void }) => {
  const node = templateToNode(value);
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" mb={1}><DataObject fontSize="small" /><Typography variant="subtitle2">Payload structure</Typography></Stack>
      <NodeEditor node={node} variables={variables} onChange={(next) => onChange(nodeToTemplate(next))} />
    </Box>
  );
};
