package plant.dev.warehouse.service;// src/main/java/plant/warehouse/WarehouseServiceImpl.java


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plant.dev.warehouse.dto.InventoryItemDto;
import plant.dev.warehouse.mapper.WarehouseMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseMapper warehouseMapper;

    @Override
    public List<InventoryItemDto> findItems(String search, String productType, String category,
                                            String status, Integer regDays, int size, int offset) {

        Map<String, Object> params = new HashMap<>();
        params.put("search", nullIfBlank(search));
        params.put("productType", nullIfAll(productType, "전체"));
        params.put("category", nullIfAll(category, "전체"));
        params.put("status", nullIfAll(status, "전체"));
        params.put("regDays", regDays);        // null이면 XML에서 조건 제외
        params.put("size", size);
        params.put("offset", offset);

        return warehouseMapper.findItems(params);
    }

    @Override
    public int countItems(String search, String productType, String category,
                          String status, Integer regDays) {

        Map<String, Object> params = new HashMap<>();
        params.put("search", nullIfBlank(search));
        params.put("productType", nullIfAll(productType, "전체"));
        params.put("category", nullIfAll(category, "전체"));
        params.put("status", nullIfAll(status, "전체"));
        params.put("regDays", regDays);

        return warehouseMapper.countItems(params);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        warehouseMapper.deleteItem(id);
    }

    /** 공백/빈 문자열이면 null 반환 */
    private String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    /** value가 null 이거나 '전체' 같은 전체값이면 null 처리 */
    private String nullIfAll(String value, String allLabel) {
        if (value == null) return null;
        return value.equals(allLabel) ? null : value;
    }
}
