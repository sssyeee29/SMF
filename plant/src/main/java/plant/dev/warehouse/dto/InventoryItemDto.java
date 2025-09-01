package plant.dev.warehouse.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InventoryItemDto {
    private Long id;
    private String name;
    private String code;
    private Integer quantity;
    private String location;
    private String inDate;   // 문자열로 받을지 LocalDate로 받을지는 팀 규칙대로
    private String outDate;
    private String note;
    private String category;
}
