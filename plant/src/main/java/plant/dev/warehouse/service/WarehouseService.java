package plant.dev.warehouse.service;

import plant.dev.warehouse.dto.InventoryItemDto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface WarehouseService {

    // 조회
    List<InventoryItemDto> findItems(
            String search,
            String productType,
            String category,
            String status,
            LocalDate from,
            LocalDate to,
            int size,
            int offset
    );

    int countItems(
            String search,
            String productType,
            String category,
            String status,
            LocalDate from,
            LocalDate to
    );

    // 납품(수량 차감)
    Map<String, Object> deliver(Long id, int amount);

    // 삭제
    void delete(Long id);

    // ---------------------- ⬇️ 추가 ----------------------

    /** 단건 한도 변경 (limit_qty) */
    void updateLimit(Long id, int limit);

    /** 여러 건 한도 변경 (배치). 리턴: 실제 업데이트 건수 */
    int updateLimitsBatch(List<Map<String, Object>> limits);

    /**
     * 자동 분할 생성:
     * body 예시
     * {
     *   "name":"바나나맛 우유","code":"BAN001","quantity":230,"location":"A-01-01",
     *   "inDate":"2025-01-15","note":"신선","category":"BANANA","productType":"BASIC","limit":100
     * }
     * 반환: 생성된 item_id 목록
     */
    List<Long> createWithAutoSplit(Map<String, Object> body);

    // ---------------------- ⬆️ 추가 ----------------------

    // 하위호환용 오버로드(선택)
    default List<InventoryItemDto> findItems(
            String search, String productType, String category, String status,
            Integer regDays, int size, int offset
    ) {
        LocalDate from = null, to = null;
        if (regDays != null) {
            to = LocalDate.now();
            from = to.minusDays(regDays);
        }
        return findItems(search, productType, category, status, from, to, size, offset);
    }

    default int countItems(
            String search, String productType, String category, String status,
            Integer regDays
    ) {
        LocalDate from = null, to = null;
        if (regDays != null) {
            to = LocalDate.now();
            from = to.minusDays(regDays);
        }
        return countItems(search, productType, category, status, from, to);
    }
}
