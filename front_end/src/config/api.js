// API 설정 파일
export const apiConfig = {
  baseURL: 'http://localhost:8080',
  timeout: 10000,
};

// API 엔드포인트 정의
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    register:'/api/auth/register',
  },
  log:{
    logs:'/api/logs',
  },
  // 필요한 다른 엔드포인트들을 여기에 추가
}; 