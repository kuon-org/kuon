import { ContentCopy } from "@mui/icons-material";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import type { WebhookVariable } from "../../hooks/useWebhooks";

type AvailableVariablesProps = {
  variables: WebhookVariable[];
};

export const AvailableVariables = ({ variables }: AvailableVariablesProps) => {
  if (variables.length === 0) return null;

  const copyVariable = async (key: string) => {
    await navigator.clipboard.writeText(`{{${key}}}`);
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        利用可能な変数
      </Typography>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" mt={0.5}>
        {variables.map((variable) => (
          <Tooltip key={variable.key} title={`${variable.label} — クリックでコピー`}>
            <Chip
              size="small"
              variant="outlined"
              icon={<ContentCopy fontSize="small" />}
              label={`{{${variable.key}}}`}
              onClick={() => void copyVariable(variable.key)}
              sx={{ fontFamily: "monospace" }}
            />
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
};
