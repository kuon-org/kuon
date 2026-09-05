import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  type ErrorComponentProps,
  useRouter,
  Link,
} from "@tanstack/react-router";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { useTranslation } from "react-i18next";
import {
  getErrorStatus,
  isForbidden,
  isNotFound,
  isUnauthorized,
} from "../../utils/errorHelpers";

export const GlobalErrorComponent = ({ error, reset }: ErrorComponentProps) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const status = getErrorStatus(error);

  const handleRetry = () => {
    reset();
    router.invalidate();
  };

  let title = t("globalError.default.title");
  let description = t("globalError.default.description");
  let icon = (
    <WarningAmberIcon sx={{ fontSize: 60, color: "error.main", mb: 2 }} />
  );
  let showRetry = true;

  if (isForbidden(error)) {
    title = t("globalError.forbidden.title");
    description = t("globalError.forbidden.description");
    icon = (
      <LockPersonIcon sx={{ fontSize: 60, color: "warning.main", mb: 2 }} />
    );
    showRetry = false;
  } else if (isNotFound(error)) {
    title = t("globalError.notFound.title");
    description = t("globalError.notFound.description");
    icon = (
      <SearchOffIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
    );
    showRetry = false;
  } else if (isUnauthorized(error)) {
    title = t("globalError.unauthorized.title");
    description = t("globalError.unauthorized.description");
    showRetry = false;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8, textAlign: "center" }}>
        {icon}
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: "500px", mx: "auto" }}
        >
          {description}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 6 }}>
          {showRetry && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleRetry}
            >
              {t("globalError.retry")}
            </Button>
          )}
          <Button variant="contained" component={Link} to="/" size="large">
            {t("globalError.home")}
          </Button>
        </Box>

        <Paper variant="outlined" sx={{ textAlign: "left", mt: 4 }}>
          <Accordion elevation={0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="caption"
                color="error"
                sx={{ fontWeight: "bold" }}
              >
                {t("globalError.details", { status: status ?? "Unknown" })}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                }}
              >
                {error instanceof Error
                  ? error.message
                  : JSON.stringify(error, null, 2)}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Box>
    </Container>
  );
};
