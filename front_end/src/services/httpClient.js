import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { apiConfig } from '../config/api';

// axios 인스턴스 생성 AxiosInstance
const httpClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 모든 요청에 쿠키 자동 포함
});

// 요청 인터셉터
httpClient.interceptors.request.use(
  (config) => {
    console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('요청 인터셉터 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 AxiosResponse
httpClient.interceptors.response.use(
  (response) => {
    console.log(`API 응답: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('응답 인터셉터 오류:', error);
    return Promise.reject(error);
  }
);

export default httpClient; 