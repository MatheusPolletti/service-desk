export interface ImapMessage {
  parts: Array<{
    body: string | Buffer;
  }>;
}
