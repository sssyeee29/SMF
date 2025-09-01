package plant.com;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import plant.com.cmm.util.map.CustomMap;

import java.util.Map;

@RestController
@Slf4j
public class TestController {
    // 기존 GET 요청 테스트 엔드포인트
    @GetMapping("/xss-test")
    public String testXss(@RequestParam String input) {
        log.debug("GET input: {}", input);
        return input;
    }

    // JSON 요청을 받을 DTO (Data Transfer Object) 클래스 - 그대로 유지 또는 제거 (필요에 따라)
    @Data
    public static class XssRequestDto {
        private String content;
        private String title;
    }

    // JSON POST 요청 테스트 엔드포인트 (DTO 사용) - 그대로 유지
    @PostMapping("/xss-json-test")
    public XssRequestDto testXssJson(@RequestBody XssRequestDto requestDto) {
        log.debug("POST JSON DTO content: {}", requestDto.getContent());
        log.debug("POST JSON DTO title: {}", requestDto.getTitle());
        return requestDto;
    }

    // Map을 사용하여 JSON POST 요청을 받는 새로운 엔드포인트
    @PostMapping("/xss-map-test")
    public Map<String, Object> testXssMap(@RequestBody Map<String, Object> requestMap) {
        log.debug("POST JSON Map content: {}", requestMap.get("content"));
        log.debug("POST JSON Map title: {}", requestMap.get("title"));
        // 필터 또는 Deserializer가 걸려야 여기서 escape된 결과가 반환됨
        return requestMap;
    }


    @PostMapping("/xss-custom-map-test") // 엔드포인트 경로를 변경하여 다른 테스트와 구별
    public CustomMap testXssCustomMap(@RequestBody CustomMap cMsp) {
        // 1. 요청 본문에서 'content' 필드 값 로깅
        log.debug("POST JSON Custom Map content: {}", cMsp.get("content"));

        // 2. 요청 본문에서 'title' 필드 값 로깅
        log.debug("POST JSON Custom Map title: {}", cMsp.get("title"));

        // 3. 전체 CustomMap 객체 로깅 (toString() 메서드를 통해 내용 확인)
        log.debug("POST JSON Custom Map : {}", cMsp.toString());

        // 4. 중요한 점: XssStringJsonDeserializer가 적용되었다면,
        //    'cMsp' 객체 내의 'content'와 'title' 필드(및 다른 모든 문자열 필드)는
        //    이미 XSS 공격을 방지하기 위해 이스케이프 처리된 상태일 것입니다.
        //    이는 @JsonDeserialize 어노테이션을 통해 CustomMap에 직접 적용되었거나,
        //    Jackson의 전역 설정으로 적용되었을 경우에 해당합니다.

        // 5. 처리된 CustomMap 객체를 클라이언트에 반환
        return cMsp;
    }
}