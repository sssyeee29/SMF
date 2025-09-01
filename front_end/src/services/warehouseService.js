// src/services/warehouseService.js
import axios from 'axios';

// 필요하면 기존 httpClient를 쓰세요:
// import http from './httpClient';  // <- 프로젝트에 이미 있으면 이걸로 교체

const api = axios.create({
  baseURL: 'http://localhost:8080',   // 백엔드 주소
  withCredentials: false,             // 필요 시 조정
});

/**
 * 목록 조회
 * UI는 1-base page를 쓰고, 서버는 0-base page를 쓰므로 여기서 변환합니다.
 * 서버 응답(Map)은 { content, total, page, size } 이므로
 * 프론트에서 쓰기 편하게 { items, total, page, size }로 변환해 돌려줍니다.
 */
export async function fetchInventory({
  page = 1,       // UI 1-base
  size = 10,
  search = '',
  productType = '',
  category = '',
  status = '',
  regDays = null,
} = {}) {
  const params = {
    page: Math.max(0, page - 1), // 0-base 변환
    size,
  };

  if (search) params.search = search;
  if (productType) params.productType = productType;
  if (category) params.category = category;
  if (status) params.status = status;
  if (regDays !== null && regDays !== undefined) params.regDays = regDays;

  const { data } = await api.get('/api/warehouse/items', { params });
  // data: { content, total, page, size }
  return {
    items: data?.content ?? [],
    total: data?.total ?? 0,
    page: (data?.page ?? 0) + 1, // 다시 1-base로 변환해서 리턴
    size: data?.size ?? size,
  };
}

/**
 * 단건 삭제
 */
export async function deleteItem(id) {
  await api.delete(`/api/warehouse/items/${id}`);
}
