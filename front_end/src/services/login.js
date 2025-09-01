import axios from 'axios';
import httpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * 사용자 로그인 함수
 * @description 실제로는 Axios를 사용하여 백엔드에 API 요청을 보냅니다.
 * @param id 사용자 id
 * @param pw 사용자 pw
 * @returns Promise<User>
 */
export const loginUser = async (id, pw) => {
    try {
        const response = await httpClient.post(
            API_ENDPOINTS.auth.login,
            { id, pw }
        );
        return response.data; // { name: "홍길동" }
    } catch (error) { //unknown
        if (axios.isAxiosError(error) && error.response) {
            throw new Error((error.response.data )?.message || '로그인에 실패했습니다.');
        }
        throw new Error('알 수 없는 오류가 발생했습니다.');
    }
};

/**
 * 로그아웃 함수
 * @returns Promise<string> (서버 메시지)
 */
export const logoutUser = async () => {
    try {
        const response = await httpClient.post(API_ENDPOINTS.auth.logout);
        return response.data?.message || '로그아웃';
    } catch (error) {
        return '로그아웃 처리 중 오류가 발생했습니다.';
    }
};