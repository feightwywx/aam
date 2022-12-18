import { IPCResponse } from 'type';

export function makeSuccessResp<T = unknown>(data: T): IPCResponse<T> {
  return {
    code: 0,
    message: 'success',
    data,
  };
}

export function makeFailResp(message: string, code = -1): IPCResponse<null> {
  return {
    code,
    message,
    data: null,
  };
}
