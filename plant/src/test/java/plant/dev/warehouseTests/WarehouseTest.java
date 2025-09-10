package plant.dev.warehouseTests;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;
import plant.dev.warehouse.service.WarehouseService;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@SpringBootTest
@Transactional  // 테스트 후 롤백. 실제 DB에 남기려면 제거하거나 @Rollback(false) 사용
@Rollback(false)
public class WarehouseTest {

    @Autowired
    WarehouseService warehouseService;

    @Test
    @DisplayName("바나나맛 우유 자동분할로 DB에 넣기")
    void insertBananaAutoSplit() {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "바나나맛 우유");
        body.put("code", "BAN001"); // UNIQUE 보장 필요
        body.put("quantity", 55);                   // 총 수량
        body.put("location", "A-02-01");            // 시작 위치
        body.put("inDate", LocalDate.now().toString());
        body.put("note", "자동분할 JUnit 테스트");
        body.put("category", "Banana");
        body.put("productType", "NORMAL");
        body.put("limit", 20);                      // 칸 용량

        List<Long> ids = warehouseService.createWithAutoSplit(body);

        System.out.println("✅ 생성된 아이템 ID들: " + ids);
    }
}
