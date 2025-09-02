package plant.dev.warehouse.service;

import plant.dev.warehouse.dto.InventoryItemDto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface WarehouseService {

    // ✅ 절대기간 지원 (from/to). 컨트롤러에서 regDays를 from/to로 변환하여 넘기도록 권장
    List<InventoryItemDto> findItems(
            String search,
            String productType,
            String category,
            String status,
            LocalDate from,       // null 허용
            LocalDate to,         // null 허용
            int size,
            int offset
    );

    int countItems(
            String search,
            String productType,
            String category,
            String status,
            LocalDate from,       // null 허용
            LocalDate to          // null 허용
    );

    // ✅ 납품(수량 차감) - 100개씩 차감하는 기본 정책
    // 반환은 프론트가 바로 쓰기 쉽도록 맵/DTO 중 택1. 여기선 간단히 Map을 예시로 사용.
    Map<String, Object> deliver(Long id, int amount);

    void delete(Long id);

    // ⬇️ 하위호환용 오버로드(선택). 기존 호출부가 많다면 유지하고 내부에서 from/to로 위임
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
