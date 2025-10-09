export const DUPLICATE_UPLOAD_ERROR_EVENT = 'duplicate_upload_error';

export interface DuplicateUploadErrorEventPayload {
  reason: string;
  contentSha256: string;
  newFileKey: string;
  existingFileKey: string | null;
}

export class DuplicateUploadErrorEvent {
  constructor(private readonly payload: DuplicateUploadErrorEventPayload) {}

  toString() {
    const { reason, contentSha256, newFileKey, existingFileKey } = this.payload;

    return JSON.stringify({
      id: Date.now(),
      status: 'error',
      event: DUPLICATE_UPLOAD_ERROR_EVENT,
      payload: {
        data: {
          reason,
          contentSha256,
          newFileKey,
          existingFileKey,
        },
      },
    });
  }
}
