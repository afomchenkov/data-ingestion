export const SQS_ERROR_EVENT = 'sqs_error';

export interface SQSErrorEventPayload {
  reason: string;
  error: string;
}

export class SQSErrorEvent {
  constructor(private readonly payload: SQSErrorEventPayload) {}

  toString() {
    const { reason, error } = this.payload;

    return JSON.stringify({
      id: Date.now(),
      status: 'error',
      event: SQS_ERROR_EVENT,
      payload: {
        data: {
          reason,
          error,
        },
      },
    });
  }
}
