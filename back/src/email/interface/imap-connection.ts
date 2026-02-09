import { ImapMessage } from './imap-message';

export interface ImapConnection {
  openBox(name: string): Promise<void>;
  search(
    criteria: string[],
    options: Record<string, unknown>,
  ): Promise<ImapMessage[]>;
  end(): Promise<void>;
}
