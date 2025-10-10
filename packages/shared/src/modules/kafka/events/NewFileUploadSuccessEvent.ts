export const NEW_FILE_UPLOAD_SUCCESS_EVENT = 'new_file_upload_success';

export interface NewFileUploadSuccessEventPayload {
  jobId: string | null;
  uploadId: string | null;
  tenantId: string | null;
}

export class NewFileUploadSuccessEvent {
  readonly event = NEW_FILE_UPLOAD_SUCCESS_EVENT;

  constructor(readonly payload: NewFileUploadSuccessEventPayload) {}

  toString() {
    const { jobId, uploadId, tenantId } = this.payload;

    return JSON.stringify({
      id: Date.now(),
      status: 'success',
      event: this.event,
      payload: {
        jobId,
        uploadId,
        tenantId,
      },
    });
  }
}
