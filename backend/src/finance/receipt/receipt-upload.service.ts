import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  RECEIPT_ALLOWED_MIME,
  RECEIPT_UPLOAD_MAX_BYTES,
  type ReceiptStorageAdapter,
  type ReceiptUploadPrepareResult,
  type ReceiptUploadRequest,
} from './receipt-storage.interface';

/**
 * Sprint 8: validation + prepare hooks only. Storage deferred to Sprint 10.
 */
@Injectable()
export class ReceiptUploadService implements ReceiptStorageAdapter {
  validateReceiptUrl(url: string): boolean {
    if (!url?.trim()) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }

  async prepareUpload(
    request: ReceiptUploadRequest,
  ): Promise<ReceiptUploadPrepareResult> {
    if (!request.transactionId?.trim()) {
      throw new BadRequestException('transactionId is required');
    }
    if (request.byteSize <= 0 || request.byteSize > RECEIPT_UPLOAD_MAX_BYTES) {
      throw new BadRequestException('Invalid receipt file size');
    }
    if (
      !RECEIPT_ALLOWED_MIME.includes(
        request.mimeType as (typeof RECEIPT_ALLOWED_MIME)[number],
      )
    ) {
      throw new BadRequestException('Unsupported receipt file type');
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    return {
      uploadToken: randomUUID(),
      expiresAt,
      // Sprint 10: populate uploadUrl from object storage presign.
    };
  }
}
