import { ServerSettingKey } from "../constants/serverSettings.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import { serverSettingsService } from "./serverSettingsService.js";

export type LocalRegistrationStatus = {
  allowed: boolean;
  isInitialSetup: boolean;
};

export class LocalRegistrationService {
  constructor(private usersRepo: UsersRepository) {}

  async getStatus(): Promise<LocalRegistrationStatus> {
    const users = await this.usersRepo.findAllUsers();
    const isInitialSetup = users.length === 0;
    const settingEnabled = serverSettingsService.isEnabled(
      ServerSettingKey.AllowLocalAccountRegistration,
    );

    return {
      allowed: isInitialSetup || settingEnabled,
      isInitialSetup,
    };
  }
}

export const localRegistrationService = new LocalRegistrationService(
  new UsersRepository(),
);
