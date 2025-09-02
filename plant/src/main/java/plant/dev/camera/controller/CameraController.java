package plant.dev.camera.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import plant.dev.camera.store.CameraFrameStore;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/*
 * CameraController
 * - 카메라 API 컨트롤러 (REST)
 * - 최신 프레임(snapshot)과 상태(status) 제공
 * - (선택) AI/Python이 프레임+메타데이터를 업로드하는 엔드포인트 포함
 *
 * [엔드포인트]
 * - GET  /camera/snapshot.jpg : 최신 프레임 1장 (캐시 방지 헤더 포함)
 * - GET  /camera/status       : 메타데이터 + 서버시간 JSON
 * - POST /camera/ai/frame     : (선택) JPEG+메타 업로드(multipart/form-data)
 *
 * @author : yeonsu
 * @fileName : CameraController
 * @since : 250902
 */

@RestController
@RequestMapping("/api/camera")
public class CameraController {

    private final CameraFrameStore store;
    private final ObjectMapper om = new ObjectMapper(); //JSON 파싱용

    public CameraController(CameraFrameStore store) {
        this.store = store; // 생성자 주입
    }

    /* 최신 프레임 1장(스냅샷) */
    @GetMapping(value = "/snapshot.jpg", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> snapshot() {
        byte[] frame = store.getLastFrame(); // 메모리에서 마지막 프레임(byte[]) 조회
        if (frame == null) return ResponseEntity.status(HttpStatus.NO_CONTENT).build(); // 없으면 204

        HttpHeaders headers = new HttpHeaders();
        headers.setCacheControl(CacheControl.noStore()); // 캐시 금지(항상 최신 이미지 받도록)
        headers.setPragma("no-cache");
        headers.setExpires(0);
        return new ResponseEntity<>(frame, headers, HttpStatus.OK); // JPEG 바이트 그대로 반환
    }

    /* 상태 JSON(메타데이터 + 서버처리) */
    @GetMapping("/status")
    public Map<String, Object> status() {

        // 메타데이터(Map) 읽고, 없으면 빈 Map
        Map<String, Object> meta = Optional.ofNullable(store.getLastMeta()).orElseGet(HashMap::new);
        meta.put("serverTime", Instant.now().toString()); // 서버 현재시간 추가(진단/표시용)
        return meta;    // JSON으로 직렬화되어 응답됨
    }

    /**
     * 라즈베리파이(Python)에서 최신 프레임 + 메타 업로드
     * curl 예:
     * curl -F "image=@frame.jpg" \
     *      -F 'meta={"defect_on":true,"score":0.73,"shotId":1693640392000}' \
     *      http://localhost:8080/api/camera/ai/frame
     */
    @PostMapping(value = "/ai/frame", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(@RequestPart("image") MultipartFile image,
                                      @RequestPart(value = "meta", required = false) String metaJson) throws Exception {
        Map<String, Object> meta = (metaJson == null || metaJson.isBlank())
                ? new HashMap<>()
                : om.readValue(metaJson, new TypeReference<Map<String, Object>>() {});
        store.update(image.getBytes(), meta);
        return Map.of("ok", true, "size", image.getSize());
    }
}

