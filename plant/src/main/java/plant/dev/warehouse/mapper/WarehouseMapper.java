package plant.dev.warehouse.mapper; // src/main/java/plant/warehouse/WarehouseMapper.java

import org.apache.ibatis.annotations.Mapper;
import plant.dev.warehouse.dto.InventoryItemDto;

import java.util.List;
import java.util.Map;

@Mapper
public interface WarehouseMapper {
    List<InventoryItemDto> findItems(Map<String, Object> params);
    int countItems(Map<String, Object> params);
    int deleteItem(Long id);

    // ✅ 추가: 납품에 필요
    InventoryItemDto findById(Long id);
    int updateDelivery(Map<String, Object> params); // expects: id, qty, status, outDate
}
