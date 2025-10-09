export const FILE_NOT_FOUND_ERROR_EVENT = 'file_not_found_error';

export interface FileNotFoundErrorEventPayload {
  reason: string;
  key: string;
}

export class FileNotFoundErrorEvent {
  constructor(private readonly payload: FileNotFoundErrorEventPayload) {}

  toString() {
    const { reason, key } = this.payload;

    return JSON.stringify({
      id: Date.now(),
      status: 'error',
      event: FILE_NOT_FOUND_ERROR_EVENT,
      payload: {
        data: {
          reason,
          key,
        },
      },
    });
  }
}
