package plant.dev.warehouse.dto;

import lombok.Getter;
import lombok.Setter;
// 필요하면 @ToString, @NoArgsConstructor 도 추가

@Getter
@Setter
public class InventoryItemDto {
    private Long id;
    private String name;
    private String code;

    private Integer quantity;
    private String location;

    // 날짜를 String으로 받을지 LocalDate로 받을지는 팀 규칙에 맞추세요.
    // (현재 XML은 AS inDate, AS outDate 로 별칭을 맞춰놨으니 이름만 일치하면 됩니다)
    private String inDate;
    private String outDate;

    private String note;
    private String category;

    // ✅ XML에서 "product_type AS productType" 로 내려오므로 필드 필요
    private String productType;

    // ✅ XML에서 "delivery_status AS status" 로 내려오므로 필드 필요
    private String status;   // READY / DONE 등

    // ✅ XML에서 "limit_qty AS `limit`" 로 내려오므로 필드 필요
    private Integer limit;   // DB: limit_qty
}
