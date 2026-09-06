import apiClient from "./client";

export interface PublicServerSettings {
  requireAuthentication: boolean;
  maintenanceMode: boolean;
  notificationsEnabled: boolean;
}

export interface LocalRegistrationStatus {
  localAccountRegistrationAllowed: boolean;
  initialSetup: boolean;
  emailVerificationRequired: boolean;
}

export const fetchPublicServerSettings = async () =>
  (await apiClient.get<PublicServerSettings>("/server/public-settings")).data;

export const fetchLocalRegistrationStatus = async () =>
  (await apiClient.get<LocalRegistrationStatus>("/registration-status")).data;
