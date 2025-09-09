package plant.dev.warehouse.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plant.dev.warehouse.service.WarehouseService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouse")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService service;

    // 목록
    @GetMapping("/items")
    public Map<String, Object> list(
            @RequestParam(required=false) String search,
            @RequestParam(required=false) String productType,
            @RequestParam(required=false) String category,
            @RequestParam(required=false) String status,
            @RequestParam(required=false) Integer regDays,   // 0,3,7,30 등 (상대기간)
            @RequestParam(required=false) String from,       // YYYY-MM-DD (절대기간 시작)
            @RequestParam(required=false) String to,         // YYYY-MM-DD (절대기간 끝)
            @RequestParam(defaultValue="0") int page,        // 0-base
            @RequestParam(defaultValue="20") int size
    ) {
        int offset = page * size;

        // 상대기간(regDays) → from/to 변환(프론트가 from/to를 보냈다면 그걸 우선)
        LocalDate fromDate = null, toDate = null;
        if (from != null && !from.isBlank() && to != null && !to.isBlank()) {
            fromDate = LocalDate.parse(from);
            toDate = LocalDate.parse(to);
        } else if (regDays != null) {
            toDate = LocalDate.now();
            fromDate = toDate.minusDays(regDays);
        }

        var result = service.findItems(search, productType, category, status, fromDate, toDate, size, offset);
        int total = service.countItems(search, productType, category, status, fromDate, toDate);
        return Map.of("content", result, "total", total, "page", page, "size", size);
    }

    // 단건 삭제
    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ 납품: 수량 차감(기본 100), 0 미만 방지, outDate 갱신, status 업데이트
    @PatchMapping("/items/{id}/deliver")
    public ResponseEntity<?> deliver(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body
    ) {
        int amount = body.getOrDefault("amount", 100);
        var updated = service.deliver(id, amount); // 업데이트 후 DTO 반환
        return ResponseEntity.ok(updated);
    }

    // ✅ 한도 변경 (단건) — JSX 모달에서 저장 시 개별 호출
    //   프론트: PATCH /api/warehouse/items/{id}/limit?limit=120
    @PatchMapping("/items/{id}/limit")
    public Map<String, Object> updateLimit(@PathVariable Long id,
                                           @RequestParam int limit) {
        service.updateLimit(id, limit);
        return Map.of("ok", true);
    }

    // ✅ 한도 변경 (배치) — 여러 개를 한 번에 변경하고 싶을 때
    //   요청 바디 예:
    //   { "limits": [ { "id": 1, "limit": 120 }, { "id": 5, "limit": 80 } ] }
    @PatchMapping("/items/limits")
    public Map<String, Object> updateLimits(@RequestBody Map<String, List<Map<String, Object>>> payload) {
        var list = payload.getOrDefault("limits", List.of());
        int updated = service.updateLimitsBatch(list); // 각 원소: {id, limit}
        return Map.of("ok", true, "updated", updated);
    }

    // (옵션) ✅ 자동 분할 생성 — 한번에 들어온 수량을 limit 단위로 여러 행 INSERT
    //   요청 바디 예:
    //   {
    //     "name":"바나나맛 우유","code":"BAN001","quantity":230,"location":"A-01-01",
    //     "inDate":"2025-01-15","note":"신선","category":"BANANA","productType":"BASIC","limit":100
    //   }
    @PostMapping("/items")
    public Map<String, Object> createWithAutoSplit(@RequestBody Map<String, Object> body) {
        var createdIds = service.createWithAutoSplit(body); // 서비스에서 DTO 변환/검증 처리
        return Map.of("createdIds", createdIds, "count", createdIds.size());
    }
}
