export interface MailAttachment {
  filename?: string;
  contentType: string;
  content: Buffer;
  contentDisposition?: string;
  contentId?: string;
}
