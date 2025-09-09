package plant.dev.warehouse.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import plant.dev.warehouse.dto.InventoryItemDto;

import java.util.List;
import java.util.Map;

@Mapper
public interface WarehouseMapper {

    // 조회
    List<InventoryItemDto> findItems(Map<String, Object> params);
    int countItems(Map<String, Object> params);

    // 단건 조회
    InventoryItemDto findById(@Param("id") Long id);

    // 삭제
    int deleteItem(@Param("id") Long id);

    // 납품 업데이트 (qty/status/outDate)
    int updateDelivery(Map<String, Object> params); // expects: id, qty, status, outDate

    // 한도 변경
    int updateLimit(@Param("id") Long id, @Param("limit") int limit);

    // ✅ 신규 아이템 INSERT (자동 분할 생성에서 사용)
    int insertItem(InventoryItemDto dto);
}
