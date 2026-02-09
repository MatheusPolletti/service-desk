export interface ImapConfig {
  imap: {
    user?: string;
    password?: string;
    host?: string;
    port: number;
    tls: boolean;
    tlsOptions: {
      rejectUnauthorized: boolean;
    };
    authTimeout: number;
  };
}
