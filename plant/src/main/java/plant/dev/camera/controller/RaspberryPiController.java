package plant.dev.camera.controller;

import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import plant.dev.camera.service.DetectionLogService;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/pi")  // ✅ Raspberry Pi에서 전송하는 데이터는 모두 /api/pi 이하에서 처리
public class RaspberryPiController {

    // 🔸 추론 결과를 임시로 저장할 메모리 맵 (나중에 DB로 교체 가능)
    private final Map<String, JSONObject> inferenceMap = new ConcurrentHashMap<>();

    // 🔸 이미지 저장 경로 (실제 운영 환경에서는 config 파일로 분리 추천)
    private static final String SAVE_DIR = "C:/ingest_frames";
    private final DetectionLogService detectionLogService;

    public RaspberryPiController(DetectionLogService detectionLogService) {
        this.detectionLogService = detectionLogService;
    }

    /**
     * ✅ [1] Raspberry Pi로부터 이미지 프레임을 수신하고 저장하는 API
     * - content-type: multipart/form-data
     * - 이미지 파일은 {capture_id}.jpg 로 저장됨
     */
    @PostMapping("/frame")
    public ResponseEntity<?> uploadFrame(
            @RequestParam("image") MultipartFile image,         // JPG 이미지 파일
            @RequestParam("capture_id") String captureId,       // 고유 ID
            @RequestParam("camera_id") String cameraId,         // 카메라 구분용 (예: pi-left)
            @RequestParam(value = "seq", required = false) Long seq  // 선택적: 시퀀스 번호
    ) {
        try {
            // 저장 폴더가 없다면 생성
            Files.createDirectories(Paths.get(SAVE_DIR));

            // {capture_id}.jpg 형태로 저장
            Path savePath = Paths.get(SAVE_DIR, captureId + ".jpg");
            image.transferTo(savePath.toFile());

            System.out.println("[FRAME] Saved → " + savePath);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("이미지 저장 실패");
        }
    }

    /**
     * ✅ [2] Raspberry Pi로부터 추론 결과(JSON)를 수신하는 API
     * - content-type: application/x-www-form-urlencoded
     * - 추론 결과는 메모리에 저장 (나중에 DB 저장으로 확장 가능)
     */
    @PostMapping("/infer")
    public ResponseEntity<?> uploadInfer(
            @RequestParam("capture_id") String captureId,
            @RequestParam("result") String resultJson,
            @RequestParam(value = "seq", required = false) Long seq
    ) {
        try {
            // 1. 원본 추론 결과 JSON 파싱
            JSONObject json = new JSONObject(resultJson);

            // 2. 이미지 URL 생성
            String imageUrl = "http://192.168.10.79:8080/static/frames/" + captureId + ".jpg";
            json.put("image_url", imageUrl);  // ✅ 여기가 핵심 한 줄

            // 3. DB 저장 (image_url 포함된 JSON 넘김)
            detectionLogService.saveInferJson(captureId, json.toString(), seq);

            // 4. 추론 결과 메모리 저장
            inferenceMap.put(captureId, json);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("파싱 또는 DB 저장 실패");
        }
    }

    @GetMapping("/result/{id}")
    public ResponseEntity<?> getResult(@PathVariable("id") String captureId) {
        JSONObject result = inferenceMap.get(captureId);

        // 추론 결과가 없을 경우
        if (result == null) {
            return ResponseEntity.status(404).body("결과 없음");
        }

        // 프론트에서 접근 가능한 이미지 경로 (정적 매핑 필요)
        String imageUrl = "/static/frames/" + captureId + ".jpg";

        return ResponseEntity.ok(Map.of(
                "result", result.toMap(),    // JSON 객체 → Map 변환
                "image_url", imageUrl        // 프론트에서 <img src=...> 가능
        ));
    }
}