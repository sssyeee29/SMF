package plant.dev.warehouse.service;// src/main/java/plant/warehouse/WarehouseService.java


import plant.dev.warehouse.dto.InventoryItemDto;

import java.util.List;

public interface WarehouseService {

    List<InventoryItemDto> findItems(
            String search,
            String productType,
            String category,
            String status,
            Integer regDays,   // 최근 N일 (null이면 조건 제외)
            int size,
            int offset
    );

    int countItems(
            String search,
            String productType,
            String category,
            String status,
            Integer regDays
    );

    void delete(Long id);
}
