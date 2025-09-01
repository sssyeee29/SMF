import axios from 'axios';
import httpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * 로그 화면 함수
 * @description 실제로는 Axios를 사용하여 백엔드에 API 요청을 보냅니다.
 * @returns Promise<log>
 */
export const logs = async () => {
    try {
        const response = await httpClient.post(
            API_ENDPOINTS.log.logs,{}
        );
        console.log(response.data);
        return response.data; 
    } catch (error) { 
        if (axios.isAxiosError(error) && error.response) {
            throw new Error((error.response.data )?.message || '잘못된 자료입니다.');
        }
        throw new Error('알 수 없는 오류가 발생했습니다.');
    }
};