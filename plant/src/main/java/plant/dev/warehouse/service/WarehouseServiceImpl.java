package plant.dev.warehouse.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plant.dev.warehouse.dto.InventoryItemDto;
import plant.dev.warehouse.mapper.WarehouseMapper;

import java.time.LocalDate;
import java.util.*;

/**
 * WarehouseService 구현체
 * - 자동분할 + 위치 자동배치(칸이 차면 다음 칸으로 이동) 포함
 * - 납품: 수량 차감 없이 상태만 DONE으로 마킹 (같은 칸 재투입 가능)
 */
@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseMapper mapper;

    // ========================= 조회 =========================
    @Override
    @Transactional(readOnly = true)
    public List<InventoryItemDto> findItems(
            String search, String productType, String category, String status,
            LocalDate from, LocalDate to, int size, int offset
    ) {
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
    public int countItems(
            String search, String productType, String category, String status,
            LocalDate from, LocalDate to
    ) {
        Map<String, Object> p = new HashMap<>();
        p.put("search", emptyToNull(search));
        p.put("productType", emptyToNull(productType));
        p.put("category", emptyToNull(category));
        p.put("status", emptyToNull(status));
        p.put("from", from);
        p.put("to", to);
        return mapper.countItems(p);
    }

    // ========================= 납품(수량 차감 없음, 상태만 DONE) =========================
    @Override
    @Transactional
    public Map<String, Object> deliver(Long id, int amount) {
        InventoryItemDto row = mapper.findById(id);
        if (row == null) return Map.of("ok", false, "message", "Not found", "id", id);

        // ✔ 수량은 그대로 두고 상태만 DONE으로 변경
        String outDate = LocalDate.now().toString();

        Map<String, Object> p = new HashMap<>();
        p.put("id", id);
        p.put("outDate", outDate);
        mapper.markDone(p);  // <-- Mapper에 markDone 구현 필요

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ok", true);
        res.put("id", id);
        res.put("quantity", row.getQuantity()); // 수량 변화 없음
        res.put("status", "DONE");
        res.put("outDate", outDate);
        return res;
    }

    // ========================= 삭제 =========================
    @Override
    @Transactional
    public void delete(Long id) {
        mapper.deleteItem(id);
    }

    // ========================= 한도 변경 =========================
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
            if (id != null && limit != null && limit > 0) {
                mapper.updateLimit(id, limit);
                cnt++;
            }
        }
        return cnt;
    }

    // ========================= 자동분할 + 위치 자동배치 =========================
    @Override
    @Transactional
    public List<Long> createWithAutoSplit(Map<String, Object> body) {
        // 1) 입력 파싱
        String name = objToString(body.get("name"));
        String code = objToString(body.get("code"));
        Integer quantity = toInt(body.get("quantity"));
        String location = Optional.ofNullable(objToString(body.get("location"))).orElse("A-01-01");
        String inDate = objToString(body.get("inDate"));
        String note = objToString(body.get("note"));
        String category = objToString(body.get("category"));
        String productType = objToString(body.get("productType"));
        int limit = Optional.ofNullable(toInt(body.get("limit"))).orElse(100); // 칸 용량

        // 가드
        int remain = Optional.ofNullable(quantity).orElse(0);
        if (remain <= 0) return Collections.emptyList();
        limit = Math.max(1, limit);

        List<Long> ids = new ArrayList<>();
        int lot = 1;
        String loc = location;

        while (remain > 0) {
            // 같은 위치 + 같은 code의 READY 합으로 남은 공간 계산
            int used = mapper.sumReadyQtyAtLocationForCode(Map.of("loc", loc, "code", code));
            int canPut = Math.max(0, limit - used);

            if (canPut <= 0) {               // 이 위치가 해당 code로 가득 차면 다음 칸
                loc = nextLocation(loc);
                continue;
            }

            int take = Math.min(remain, canPut);

            // 기존 READY 행 있으면 누적, 없으면 신규 INSERT
            InventoryItemDto mergeTarget = mapper.findReadyRowForMerge(Map.of("loc", loc, "code", code));
            if (mergeTarget != null) {
                mapper.addQuantity(Map.of("id", mergeTarget.getId(), "add", take));
                ids.add(mergeTarget.getId());
            } else {
                InventoryItemDto dto = new InventoryItemDto();
                dto.setName(name);
                dto.setCode(code);
                dto.setQuantity(take);
                dto.setLocation(loc);
                dto.setInDate(inDate);
                dto.setOutDate(null);
                dto.setNote(lot == 1 ? note : safeNote(note, lot));
                dto.setCategory(category);
                dto.setProductType(productType);
                dto.setStatus("READY");
                dto.setLimit(limit);
                mapper.insertItem(dto);
                ids.add(dto.getId());
            }

            remain -= take;
            if (take == canPut) {            // 해당 칸을 정확히 꽉 채웠으면 다음 칸으로
                loc = nextLocation(loc);
            }
            lot++;
        }
        return ids;
    }

    // ========================= helpers =========================
    private static String emptyToNull(String s) { return (s == null || s.isBlank()) ? null : s; }
    private static String objToString(Object o) { return (o == null) ? null : String.valueOf(o); }

    private static Integer toInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(o).trim()); }
        catch (Exception e) { return null; }
    }

    private static Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try { return Long.parseLong(String.valueOf(o).trim()); }
        catch (Exception e) { return null; }
    }

    private static String safeNote(String base, int lot) {
        if (base == null || base.isBlank()) return "자동분할 " + lot;
        return base + " / 자동분할 " + lot;
    }

    // ---- location helpers: "A-01-01" → 다음 칸 계산 ----
    private static class Loc { char sec; int row; int col; }

    private static Loc parseLoc(String s) {
        if (s == null || !s.matches("^[A-Za-z]-\\d{2}-\\d{2}$"))
            throw new IllegalArgumentException("invalid location: " + s);
        String[] t = s.split("-");
        Loc r = new Loc();
        r.sec = t[0].trim().toUpperCase().charAt(0); // A,B,C...
        r.row = Integer.parseInt(t[1]);
        r.col = Integer.parseInt(t[2]);
        return r;
    }

    private static String fmt(Loc l) { return String.format("%c-%02d-%02d", l.sec, l.row, l.col); }

    /** 다음 칸: A-01-01 → A-01-02 → … → A-02-01 → … → B-01-01 … (상한은 필요시 추가) */
    private static String nextLocation(String cur) {
        Loc l = parseLoc(cur);
        l.col++;
        if (l.col > 99) { l.col = 1; l.row++; }
        if (l.row > 99) { l.row = 1; l.sec = (char) (l.sec + 1); } // A→B→C→D…
        return fmt(l);
    }
}
