export const NEW_FILE_UPLOAD_SUCCESS_EVENT = 'new_file_upload_success';

export interface NewFileUploadSuccessEventPayload {
  jobId: string | null;
  uploadId: string | null;
  tenantId: string | null;
}

export class NewFileUploadSuccessEvent {
  constructor(private readonly payload: NewFileUploadSuccessEventPayload) {}

  toString() {
    const { jobId, uploadId, tenantId } = this.payload;

    return JSON.stringify({
      id: Date.now(),
      status: 'success',
      event: NEW_FILE_UPLOAD_SUCCESS_EVENT,
      payload: {
        data: {
          jobId,
          uploadId,
          tenantId,
        },
      },
    });
  }
}
