export interface GmailProfile {
  email: string;
  name: string;
  picture?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
