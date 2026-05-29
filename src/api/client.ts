import { HttpError } from 'app/../error/AppErrors';

const axios = require('axios/dist/browser/axios.cjs') as typeof import('axios').default;

type AxiosError<T = any> = import('axios').AxiosError<T>;
type AxiosResponse<T = any> = import('axios').AxiosResponse<T>;
type InternalAxiosRequestConfig<T = any> = import('axios').InternalAxiosRequestConfig<T>;

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
    console.info('http', `--> ${request.method?.toUpperCase()} ${request.baseURL}${request.url}`);

    return request;
  };

  const onResponse = (response: AxiosResponse<any>) => {
    console.info('http', `<-- ${response.status} ${response.config.baseURL}${response.config.url}`);

    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  };

  const onError = (error: AxiosError) => {
    const requestUrl = error.config?.url || baseUrl;

    if (error.response) {
      console.error('http', `<-- ${error.response.status} ${error.config?.baseURL || baseUrl}${requestUrl}`);
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
