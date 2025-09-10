package plant.dev.camera.dto;

import lombok.Data;

import java.sql.Timestamp;

@Data
public class SettingDTO {
    private Long settingId;

    // AI 관련
    private Double confidenceThreshold;
    private Double sensitivity;
    private Double tolerance;
    private String captureResolution;
    private Integer imageQuality;

    // 저장 관련
    private Boolean autoSaveResults;
    private Boolean saveImages;
    private Boolean saveDefectData;
    private String logStoragePath;
    private Integer retentionPeriod;

    private String theme;     // ✅ 추가
    private String language;  // ✅ 추가

    private Timestamp updatedAt;
}
