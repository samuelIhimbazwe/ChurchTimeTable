/**
 * Receipt upload preparation (Sprint 8 patch).
 * Full storage ships in Sprint 10 Files & Media.
 */
export interface ReceiptUploadRequest {
  transactionId: string;
  mimeType: string;
  byteSize: number;
  originalFilename?: string;
}

export interface ReceiptUploadPrepareResult {
  uploadToken: string;
  expiresAt: string;
  /** When storage is wired, clients upload to this URL. */
  uploadUrl?: string;
}

export interface ReceiptStorageAdapter {
  prepareUpload(
    request: ReceiptUploadRequest,
  ): Promise<ReceiptUploadPrepareResult>;
  validateReceiptUrl(url: string): boolean;
}

export const RECEIPT_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const RECEIPT_ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;
