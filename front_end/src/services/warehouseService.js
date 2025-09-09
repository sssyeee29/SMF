// src/services/warehouseService.js
import axios from 'axios';

// 필요하면 프로젝트 공통 httpClient로 교체 가능
const api = axios.create({
  baseURL: 'http://localhost:8080', // 백엔드 주소
  withCredentials: false,
});

/**
 * 목록 조회
 * UI는 1-base page, 서버는 0-base page라고 가정.
 * 서버 응답은 { content, total, page, size } 형태라고 가정.
 * 프론트에서 쓰기 편하게 { items, total, page, size }로 변환하여 반환.
 */
export async function fetchInventory({
  page = 1,       // UI 1-base
  size = 10,
  search = '',
  productType = '',
  category = '',
  status = '',
  regDays = null,
  from = null,
  to = null,
} = {}, opts = {}) {
  const params = {
    page: Math.max(0, page - 1), // 0-base 변환
    size,
  };

  if (search) params.search = search;
  if (productType) params.productType = productType;
  if (category) params.category = category;
  if (status) params.status = status;
  if (regDays !== null && regDays !== undefined) params.regDays = regDays;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data } = await api.get('/api/warehouse/items', {
    params,
    // AbortController 신호 지원 (axios v1.2+)
    signal: opts.signal,
  });

  // data: { content, total, page, size }
  return {
    items: data?.content ?? [],
    total: data?.total ?? 0,
    page: (data?.page ?? 0) + 1, // 다시 1-base로
    size: data?.size ?? size,
  };
}

/**
 * 단건 삭제
 * DELETE /api/warehouse/items/:id
 */
export async function deleteItem(id) {
  await api.delete(`/api/warehouse/items/${id}`);
  return true;
}

/**
 * 납품(수량 차감)
 * PATCH /api/warehouse/items/:id/deliver
 * body: { amount: number }  // 예: 100
 * 응답은 200(JSON) 또는 204(No Content) 모두 허용
 */
export async function deliverItem(id, amount) {
  const res = await api.patch(
    `/api/warehouse/items/${id}/deliver`,
    { amount }
  );
  return res.data ?? { id, amount };
}

/**
 * 아이템 생성
 * POST /api/warehouse/items
 * payload 예:
 * {
 *   name, code, quantity, location, inDate, note,
 *   category, productType, (옵션) limit
 * }
 * 서버가 자동 분할 생성(수량/limit 기준으로 여러 행 INSERT)하도록 구현되어 있다면
 * limit을 함께 보내면 됨(미전송 시 서버 기본값 사용).
 */
export async function createItem(payload) {
  const { data, status } = await api.post('/api/warehouse/items', payload);
  if (status === 204) return true;
  return data ?? true;
}

/**
 * 한도 변경(단건)
 * PATCH /api/warehouse/items/:id/limit?limit=값
 * 컨트롤러: @PatchMapping("/items/{id}/limit") + @RequestParam int limit
 */
export async function updateLimit(itemId, limit) {
  const { data } = await api.patch(
    `/api/warehouse/items/${itemId}/limit`,
    null,
    { params: { limit } }
  );
  return data ?? { ok: true };
}

/**
 * 한도 변경(배치) - 선택
 * PATCH /api/warehouse/items/limits
 * body: { limits: [ { id, limit }, ... ] }
 * 컨트롤러 구현 시에만 사용 가능.
 */
export async function updateLimitsBatch(list) {
  const { data } = await api.patch(
    '/api/warehouse/items/limits',
    { limits: list }
  );
  return data ?? { ok: true, updated: 0 };
}
