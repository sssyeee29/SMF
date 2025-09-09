package plant.dev.warehouse.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plant.dev.warehouse.dto.InventoryItemDto;
import plant.dev.warehouse.mapper.WarehouseMapper;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<InventoryItemDto> findItems(String search, String productType, String category, String status,
                                            LocalDate from, LocalDate to, int size, int offset) {
        Map<String, Object> p = new HashMap<>();
        p.put("search", emptyToNull(search));
        p.put("productType", emptyToNull(productType));
        p.put("category", emptyToNull(category));
        p.put("status", emptyToNull(status));
        p.put("from", from);
        p.put("to", to);
        p.put("size", size);
        p.put("offset", offset);
        return mapper.findItems(p);
    }

    @Override
    @Transactional(readOnly = true)
    public int countItems(String search, String productType, String category, String status,
                          LocalDate from, LocalDate to) {
        Map<String, Object> p = new HashMap<>();
        p.put("search", emptyToNull(search));
        p.put("productType", emptyToNull(productType));
        p.put("category", emptyToNull(category));
        p.put("status", emptyToNull(status));
        p.put("from", from);
        p.put("to", to);
        return mapper.countItems(p);
    }

    @Override
    @Transactional
    public Map<String, Object> deliver(Long id, int amount) {
        // 현재 행 조회
        InventoryItemDto row = mapper.findById(id);
        if (row == null) {
            return Map.of("ok", false, "message", "Not found", "id", id);
        }
        int current = Optional.ofNullable(row.getQuantity()).orElse(0);
        int newQty = Math.max(0, current - Math.max(0, amount));
        String newStatus = (newQty == 0) ? "DONE" : "READY";
        String outDate = (newQty == 0) ? LocalDate.now().toString() : row.getOutDate();

        Map<String, Object> u = new HashMap<>();
        u.put("id", id);
        u.put("qty", newQty);
        u.put("status", newStatus);
        u.put("outDate", outDate);
        mapper.updateDelivery(u);

        // 갱신 결과 간단 반환(프론트에서 바로 씀)
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ok", true);
        res.put("id", id);
        res.put("quantity", newQty);
        res.put("status", newStatus);
        res.put("outDate", outDate);
        return res;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        mapper.deleteItem(id);
    }

    // ---------------------- ⬇️ 추가 구현 ----------------------

    @Override
    @Transactional
    public void updateLimit(Long id, int limit) {
        mapper.updateLimit(id, limit);
    }

    @Override
    @Transactional
    public int updateLimitsBatch(List<Map<String, Object>> limits) {
        if (limits == null || limits.isEmpty()) return 0;
        int cnt = 0;
        for (Map<String, Object> m : limits) {
            Long id = toLong(m.get("id"));
            Integer limit = toInt(m.get("limit"));
            if (id != null && limit != null) {
                mapper.updateLimit(id, limit);
                cnt++;
            }
        }
        return cnt;
    }

    @Override
    @Transactional
    public List<Long> createWithAutoSplit(Map<String, Object> body) {
        // 입력 파싱
        String name = objToString(body.get("name"));
        String code = objToString(body.get("code"));
        Integer quantity = toInt(body.get("quantity"));
        String location = objToString(body.get("location"));
        String inDate = objToString(body.get("inDate")); // XML/DTO는 String 날짜여도 OK
        String note = objToString(body.get("note"));
        String category = objToString(body.get("category"));
        String productType = objToString(body.get("productType"));
        Integer limit = Optional.ofNullable(toInt(body.get("limit"))).orElse(100);

        int remain = Optional.ofNullable(quantity).orElse(0);
        if (remain <= 0) return Collections.emptyList();

        List<Long> ids = new ArrayList<>();
        int lot = 1;

        while (remain > 0) {
            int take = Math.min(remain, limit);

            InventoryItemDto dto = new InventoryItemDto();
            dto.setName(name);
            dto.setCode(code);
            dto.setQuantity(take);
            dto.setLocation(location);
            dto.setInDate(inDate);
            dto.setOutDate(null);
            dto.setNote(lot == 1 ? note : (safeNote(note, lot)));
            dto.setCategory(category);
            dto.setProductType(productType);
            dto.setStatus(take > 0 ? "READY" : "DONE");
            dto.setLimit(limit);

            mapper.insertItem(dto); // 🔸 Mapper에 insertItem 필요 (아래 참고)
            ids.add(dto.getId());

            remain -= take;
            lot++;
        }
        return ids;
    }

    // ---------------------- ⬆️ 추가 구현 ----------------------

    // ─── helpers ───────────────────────────────────────────
    private static String emptyToNull(String s) { return (s == null || s.isBlank()) ? null : s; }

    private static String objToString(Object o) { return o == null ? null : String.valueOf(o); }

    private static Integer toInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(o)); } catch (Exception e) { return null; }
    }

    private static Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try { return Long.parseLong(String.valueOf(o)); } catch (Exception e) { return null; }
    }

    private static String safeNote(String base, int lot) {
        if (base == null || base.isBlank()) return "자동분할 " + lot;
        return base + " / 자동분할 " + lot;
    }
}
