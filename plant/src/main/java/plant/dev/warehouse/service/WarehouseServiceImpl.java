package plant.dev.warehouse.service; // src/main/java/plant/warehouse/WarehouseServiceImpl.java

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plant.dev.warehouse.dto.InventoryItemDto;
import plant.dev.warehouse.mapper.WarehouseMapper;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseMapper warehouseMapper;

    @Override
    public List<InventoryItemDto> findItems(
            String search,
            String productType,
            String category,
            String status,
            LocalDate from,
            LocalDate to,
            int size,
            int offset
    ) {
        Map<String, Object> params = new HashMap<>();
        params.put("search", nullIfBlank(search));
        params.put("productType", nullIfAll(productType, "전체"));
        params.put("category", nullIfAll(category, "전체"));
        params.put("status", nullIfAll(status, "전체"));
        params.put("from", from);
        params.put("to", to);
        params.put("size", size);
        params.put("offset", offset);

        return warehouseMapper.findItems(params);
    }


    @Override
    public int countItems(
            String search,
            String productType,
            String category,
            String status,
            LocalDate from,
            LocalDate to
    ) {
        Map<String, Object> params = new HashMap<>();
        params.put("search", nullIfBlank(search));
        params.put("productType", nullIfAll(productType, "전체"));
        params.put("category", nullIfAll(category, "전체"));
        params.put("status", nullIfAll(status, "전체"));

        // ✅ from/to 그대로 전달
        params.put("from", from);
        params.put("to", to);

        return warehouseMapper.countItems(params);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        warehouseMapper.deleteItem(id);
    }

    /**
     * ✅ 납품 처리: 수량 amount(기본 100) 차감, 0 미만 방지,
     *    outDate = 오늘, status = (0이면 DONE, 아니면 READY) 로 업데이트
     *    프론트가 바로 쓰기 쉬운 맵을 반환
     */
    @Override
    @Transactional
    public Map<String, Object> deliver(Long id, int amount) {
        // 현재 아이템 조회
        InventoryItemDto item = warehouseMapper.findById(id);
        if (item == null) {
            throw new IllegalArgumentException("Item not found: " + id);
        }

        int cur = safeInt(item.getQuantity());
        int amt = Math.max(0, amount);
        int next = Math.max(0, cur - amt);

        String nextStatus = (next == 0) ? "DONE" : "READY";
        String outDate = LocalDate.now().toString();

        // DB 반영 (수량/상태/출고일)
        Map<String, Object> params = new HashMap<>();
        params.put("id",   id);
        params.put("qty",  next);
        params.put("status", nextStatus);
        params.put("outDate", outDate);
        warehouseMapper.updateDelivery(params);

        // 응답(프론트 재조회도 하지만, 즉시 확인용으로 반환)
        Map<String, Object> result = new HashMap<>();
        result.put("id", id);
        result.put("quantity", next);
        result.put("status", nextStatus);
        result.put("outDate", outDate);
        return result;
    }

    /* ===== 유틸 ===== */

    /** 공백/빈 문자열이면 null 반환 */
    private String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    /** value가 null 이거나 '전체' 같은 전체값이면 null 처리 */
    private String nullIfAll(String value, String allLabel) {
        if (value == null) return null;
        return value.equals(allLabel) ? null : value;
    }

    private int safeInt(Object q) {
        if (q == null) return 0;
        if (q instanceof Number n) return n.intValue();
        return Integer.parseInt(q.toString());
    }
}
