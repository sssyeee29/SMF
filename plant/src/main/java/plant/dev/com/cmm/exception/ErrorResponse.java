// API 오류 응답 포맷을 정의하는 클래스입니다.
package plant.dev.com.cmm.exception;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;

@Getter
@Builder
@Slf4j
@ToString
public class ErrorResponse {

    private final LocalDateTime timestamp = LocalDateTime.now();
    private final int status;
    private final String error;
    private final String code; // 커스텀 에러 코드를 위한 필드 추가
    private final String message;
    private final String path;

    // ResponseEntity를 더 쉽게 생성하기 위한 정적 메서드
    public static ResponseEntity<ErrorResponse> toResponseEntity(HttpStatus status, String code, String message, String path) {

        // 1. ErrorResponse 객체를 먼저 생성합니다.
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(status.value())
                .error(status.getReasonPhrase())
                .code(code)
                .message(message)
                .path(path)
                .build();

        // 2. 💡 생성된 객체의 내용을 로그로 기록합니다.
        log.debug("클라이언트로 전송되는 오류 응답: {}", errorResponse.toString());

        // 3. 생성된 객체를 body에 담아 ResponseEntity를 반환합니다.
        return ResponseEntity
                .status(status)
                .body(errorResponse);
    }

}