export const INGEST_JOB_NOT_FOUND_ERROR_EVENT = 'ingest_job_not_found_error';

export interface IngestJobNotFoundErrorEventPayload {
  reason: string;
  uploadid: string;
  tenantid: string;
}

export class IngestJobNotFoundErrorEvent {
  constructor(private readonly payload: IngestJobNotFoundErrorEventPayload) {}

  toString() {
    const { reason, uploadid, tenantid } = this.payload;

    return JSON.stringify({
      id: Date.now(),
      status: 'error',
      event: INGEST_JOB_NOT_FOUND_ERROR_EVENT,
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
