const PASSWORD_FLOW_KEY = "incm-mgmt-password-flow";

export type PasswordFlow = "recovery";

export function setPasswordFlow(flow: PasswordFlow): void {
  sessionStorage.setItem(PASSWORD_FLOW_KEY, flow);
}

export function getPasswordFlow(): PasswordFlow | null {
  const value = sessionStorage.getItem(PASSWORD_FLOW_KEY);
  return value === "recovery" ? "recovery" : null;
}

export function clearPasswordFlow(): void {
  sessionStorage.removeItem(PASSWORD_FLOW_KEY);
}
