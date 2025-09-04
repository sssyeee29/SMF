package plant.dev.camera.dto;

import lombok.Data;

import java.sql.Timestamp;

@Data
public class DetectionLogDTO {

    private Long logId;              // log_id (PK, Auto Increment)
    private String captureId;        // capture_id (UNIQUE, NOT NULL)
    private Timestamp inputDate;     // input_date (자동 생성)

    private String classes;          // 예: "1:0.97,3:0.72"
    private String productCode;      // 예: "banana", "strawberry"
    private String productResult;    // 예: "normal", "defect" (NOT NULL)
    private String defectType;       // 예: "damage-h", "hole"
    private String confidence;       // 예: "0.9707" (문자열 저장)
    private String imageUrl;         // 예: "/static/imgs/abc123.jpg"
}