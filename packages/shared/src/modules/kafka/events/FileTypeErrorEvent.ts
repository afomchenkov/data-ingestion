export const FILE_TYPE_ERROR_EVENT = 'file_type_error';

export interface FileTypeErrorEventPayload {
  reason: string;
  uploadid: string;
  tenantid: string;
}

export class FileTypeErrorEvent {
  constructor(private readonly payload: FileTypeErrorEventPayload) {}

  toString() {
    const { reason, uploadid, tenantid } = this.payload;

    return JSON.stringify({
      id: Date.now(),
      status: 'error',
      event: FILE_TYPE_ERROR_EVENT,
      payload: {
        data: {
          reason,
          uploadid,
          tenantid,
        },
      },
    });
  }
}
