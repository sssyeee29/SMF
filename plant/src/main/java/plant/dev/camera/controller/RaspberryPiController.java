package plant.dev.camera.controller;

import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import plant.dev.camera.dto.SettingDTO;
import plant.dev.camera.service.DetectionLogService;
import plant.dev.camera.service.SettingService;

import java.io.IOException;
import java.nio.file.*;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/pi")
@RequiredArgsConstructor
public class RaspberryPiController {

    private final DetectionLogService detectionLogService;
    private final SettingService settingService;

    private final Map<String, JSONObject> inferenceMap = new ConcurrentHashMap<>();
    private static final String FLASK_SERVER_URL = "http://192.168.10.243:5000";

    /** ✅ [1] 이미지 프레임 수신 */
    @PostMapping("/frame")
    public ResponseEntity<?> uploadFrame(
            @RequestParam("image") MultipartFile image,
            @RequestParam("capture_id") String captureId,
            @RequestParam("camera_id") String cameraId,
            @RequestParam(value = "seq", required = false) Long seq
    ) {
        try {
            SettingDTO settings = settingService.getSettings();
            String saveDir = (settings != null && settings.getLogStoragePath() != null)
                    ? settings.getLogStoragePath()
                    : "C:/ingest_frames";

            Files.createDirectories(Paths.get(saveDir));
            Path savePath = Paths.get(saveDir, captureId + ".jpg");
            image.transferTo(savePath.toFile());

            System.out.println("[FRAME] Saved → " + savePath);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("이미지 저장 실패");
        }
    }

    /** ✅ [2] 추론 결과 수신 */
    @PostMapping("/infer")
    public ResponseEntity<?> uploadInfer(
            @RequestParam("capture_id") String captureId,
            @RequestParam("result") String resultJson,
            @RequestParam(value = "seq", required = false) Long seq
    ) {
        try {
            JSONObject json = new JSONObject(resultJson);
            String imageUrl = "http://192.168.10.79:8080/static/frames/" + captureId + ".jpg";
            json.put("image_url", imageUrl);

            detectionLogService.saveInferJson(captureId, json.toString(), seq);
            inferenceMap.put(captureId, json);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("파싱 또는 DB 저장 실패");
        }
    }

    /** ✅ [3] 추론 결과 조회 */
    @GetMapping("/result/{id}")
    public ResponseEntity<?> getResult(@PathVariable("id") String captureId) {
        JSONObject result = inferenceMap.get(captureId);
        if (result == null) {
            return ResponseEntity.status(404).body("결과 없음");
        }
        String imageUrl = "/static/frames/" + captureId + ".jpg";
        return ResponseEntity.ok(Map.of("result", result.toMap(), "image_url", imageUrl));
    }

    /** ✅ [4] 설정 저장 (DB + Flask 전달) */
    @PostMapping("/settings")
    public ResponseEntity<?> updateSettings(@RequestBody SettingDTO settingsDTO) {
        try {
            // 1) DB 저장 (AI + 저장 설정 전체)
            settingService.saveSettings(settingsDTO);

            // 2) Flask로 AI 관련 설정만 전달
            String flaskUrl = FLASK_SERVER_URL + "/api/pi/settings";
            Map<String, Object> flaskSettings = new HashMap<>();
            flaskSettings.put("confidenceThreshold", settingsDTO.getConfidenceThreshold());
            flaskSettings.put("sensitivity", settingsDTO.getSensitivity());
            flaskSettings.put("tolerance", settingsDTO.getTolerance());
            flaskSettings.put("captureResolution", settingsDTO.getCaptureResolution());
            flaskSettings.put("imageQuality", settingsDTO.getImageQuality());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(flaskSettings, headers);

            RestTemplate restTemplate = new RestTemplate();
            restTemplate.postForEntity(flaskUrl, requestEntity, Map.class);

            return ResponseEntity.ok(Map.of("ok", true, "msg", "설정(DB+Flask) 반영됨", "data", settingsDTO));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("ok", false, "msg", "설정 저장 실패"));
        }
    }

    /** ✅ [5] 현재 설정 조회 */
    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        SettingDTO settings = settingService.getSettings();
        if (settings == null) {
            return ResponseEntity.status(404).body(Map.of("ok", false, "msg", "설정 없음"));
        }
        return ResponseEntity.ok(Map.of("ok", true, "data", settings));
    }
}
