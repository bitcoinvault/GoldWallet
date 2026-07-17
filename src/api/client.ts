import { HttpError } from 'app/../error/AppErrors';

import logger from '../../logger';

const axios = require('axios/dist/browser/axios.cjs') as typeof import('axios').default;

type AxiosError = import('axios').AxiosError;
type AxiosResponse = import('axios').AxiosResponse;
type InternalAxiosRequestConfig = import('axios').InternalAxiosRequestConfig;

export enum GeneralHttpError {
  NO_RESPONSE = 'No response',
  NO_MESSAGE = 'No message',
}

const createHttpClient = (baseUrl: string) => {
  const httpClient = axios.create({
    baseURL: baseUrl,
    headers: { 'Content-Type': 'application/json' },
  });

  const onRequest = (request: InternalAxiosRequestConfig) => {
    logger.info({
      category: 'http',
      message: `--> ${request.method?.toUpperCase()} ${request.baseURL}${request.url}`,
    });

    return request;
  };

  const onResponse = (response: AxiosResponse) => {
    logger.info({
      category: 'http',
      message: `<-- ${response.status} ${response.config.baseURL}${response.config.url}`,
    });

    logger.info({
      category: 'http',
      message: JSON.stringify(response.data, null, 2),
    });
    return response.data;
  };

  const onError = (error: AxiosError) => {
    const requestUrl = error.config?.url || baseUrl;

    if (error.response) {
      logger.error({
        category: 'http',
        message: `<-- ${error.response.status} ${error.config?.baseURL || baseUrl}${requestUrl}`,
      });
    }

    if (!error?.response) {
      throw new HttpError(`Request to ${baseUrl} failed. Details: No response`);
    }

    const responseData = error.response.data;
    const message =
      responseData && typeof responseData === 'object' && 'msg' in responseData
        ? String(responseData.msg)
        : 'No message';

    throw new HttpError(`Request to ${requestUrl} failed. Details: ${message}`);
  };

  httpClient.interceptors.request.use(request => onRequest(request));
  httpClient.interceptors.response.use(
    response => onResponse(response),
    error => onError(error),
  );

  return httpClient;
};

export default createHttpClient;
