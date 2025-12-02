export interface AppSessionUser {
  id: number;
  username: string;
  role: string;
}

export interface AppSession {
  user?: AppSessionUser;
}
