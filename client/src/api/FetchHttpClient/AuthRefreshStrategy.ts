export interface AuthRefreshStrategy {
  refresh(): Promise<boolean>;
}
