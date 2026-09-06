export const smtpKeys = {
  all: ["smtp"] as const,
  settings: () => [...smtpKeys.all, "settings"] as const,
};
