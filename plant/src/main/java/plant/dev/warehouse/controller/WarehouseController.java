package plant.dev.warehouse.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import plant.dev.warehouse.service.WarehouseService;

import java.util.Map;

@RestController
@RequestMapping("/api/warehouse")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService service;

    @GetMapping("/items")
    public Map<String, Object> list(
            @RequestParam(required=false) String search,
            @RequestParam(required=false) String productType,
            @RequestParam(required=false) String category,
            @RequestParam(required=false) String status,
            @RequestParam(required=false) Integer regDays,   // 등록일: 3/7/30 등
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size
    ) {
        int offset = page * size;
        var result = service.findItems(search, productType, category, status, regDays, size, offset);
        int total = service.countItems(search, productType, category, status, regDays);
        return Map.of("content", result, "total", total, "page", page, "size", size);
    }

    @DeleteMapping("/items/{id}")
    public void delete(@PathVariable Long id) { service.delete(id); }
}