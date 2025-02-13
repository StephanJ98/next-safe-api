import { RouteHandlerBuilder } from './routeHandlerBuilder';
import { HandlerServerErrorFn } from './types';

export function createSafeApi(params?: { handleServerError?: HandlerServerErrorFn }) {
  return new RouteHandlerBuilder({
    handleServerError: params?.handleServerError,
    contextType: {},
  });
}
