package plant.dev.camera.service;

import lombok.RequiredArgsConstructor;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plant.dev.camera.dto.DetectionLogDTO;
import plant.dev.camera.mapper.DetectionLogMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DetectionLogServiceImpl implements DetectionLogService {

    private final DetectionLogMapper detectionLogMapper;

    // ✔ 클래스 ID → 제품명
    private static final Map<Integer, String> PRODUCT_MAP = Map.of(
            0, "Banana",
            1, "Strawberry",
            2, "Melon"
    );

    // ✔ 클래스 ID → 불량 타입
    private static final Map<Integer, String> DEFECT_MAP = Map.of(
            3, "Damage-H",
            4, "Damage-B"
    );

    @Override
    @Transactional
    public void saveInferJson(String captureId, String resultJson, Long seq) {
        JSONObject json = new JSONObject(resultJson);

        DetectionLogDTO dto = new DetectionLogDTO();
        dto.setCaptureId(captureId);

        // ✅ confidence (string으로 변환)
        double conf = json.optDouble("confidence", 0.0);
        dto.setConfidence(String.format("%.4f", conf));

        // ✅ classes → 요약 문자열 저장
        JSONArray classes = json.optJSONArray("classes");
        dto.setClasses(toClassSummary(classes));  // 예: "2:0.85,4:0.72"

        // ✅ 클래스 기반 매핑
        mapProductAndDefect(classes, dto);

        // ✅ image_url은 result에 없으면 null
        dto.setImageUrl(json.optString("image_url", null));

        // ✅ DB 저장 (UPSERT)
        detectionLogMapper.upsertDetectionLog(dto);

        System.out.printf("[INFER][DB] 저장 완료 → %s (seq=%s)\n", captureId, seq);
    }

    // 🔹 요약 문자열로 변환: [[1, 0.9], [4, 0.72]] → "1:0.9000,4:0.7200"
    private String toClassSummary(JSONArray arr) {
        if (arr == null || arr.isEmpty()) return null;
        List<String> result = new ArrayList<>();
        for (int i = 0; i < arr.length(); i++) {
            JSONArray inner = arr.optJSONArray(i);
            if (inner != null && inner.length() >= 2) {
                int id = inner.optInt(0);
                double score = inner.optDouble(1);
                result.add(id + ":" + String.format("%.4f", score));
            }
        }
        return String.join(",", result);
    }

    // 🔹 클래스 ID 기반으로 제품 코드 / 불량 타입 / 결과 자동 매핑
    private void mapProductAndDefect(JSONArray classesArray, DetectionLogDTO dto) {
        if (classesArray == null || classesArray.isEmpty()) return;

        String productCode = null;
        double maxProductScore = -1.0;

        String defectType = null;
        boolean hasDefect = false;

        for (int i = 0; i < classesArray.length(); i++) {
            JSONArray cls = classesArray.optJSONArray(i);
            if (cls == null || cls.length() < 2) continue;

            int id = cls.optInt(0);
            double score = cls.optDouble(1);

            if (PRODUCT_MAP.containsKey(id) && score > maxProductScore) {
                productCode = PRODUCT_MAP.get(id);
                maxProductScore = score;
            }

            if (DEFECT_MAP.containsKey(id)) {
                hasDefect = true;
                defectType = DEFECT_MAP.get(id);
            }
        }

        dto.setProductCode(productCode);
        dto.setDefectType(defectType);
        dto.setProductResult(hasDefect ? "defect" : "normal");
    }
}
