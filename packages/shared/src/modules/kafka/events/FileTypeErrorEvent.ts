export const FILE_TYPE_ERROR_EVENT = 'file_type_error';

export interface FileTypeErrorEventPayload {
  reason: string;
  uploadid: string;
  tenantid: string;
}

export class FileTypeErrorEvent {
  readonly event = FILE_TYPE_ERROR_EVENT;

  constructor(readonly payload: FileTypeErrorEventPayload) {}

  toString() {
    const { reason, uploadid, tenantid } = this.payload;

    return JSON.stringify({
      id: Date.now(),
      status: 'error',
      event: this.event,
      payload: {
        reason,
        uploadid,
        tenantid,
      },
    });
  }
}
