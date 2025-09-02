package plant.dev.warehouse.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plant.dev.warehouse.service.WarehouseService;

import java.time.LocalDate;
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
        var updated = service.deliver(id, amount); // 업데이트 후 엔티티/DTO 반환
        // 200으로 변경 결과를 주거나, 필요 시 204로 본문 없이 응답해도 OK(프론트는 둘 다 대응)
        return ResponseEntity.ok(updated);
    }
}
