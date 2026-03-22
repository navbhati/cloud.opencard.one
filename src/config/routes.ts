export enum AuthRoutes {
  LOGIN = "/auth/login",
  REGISTER = "/auth/register",
  SSO_CALLBACK = "/auth/sso-callback",
}

export enum ProtectedRoutes {
  HOME = "/",
  DASHBOARD = "/dashboard",
}

export const excludedRoutes = ["/api/webhooks"];
