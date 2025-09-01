// 비즈니스 예외 처리를 위한 커스텀 런타임 예외 클래스입니다.
package plant.dev.com.cmm.exception;

import lombok.Getter;

@Getter
public class CustomException extends RuntimeException {
    private final String errorCode;
    private final Object[] args; // 메시지 포맷팅을 위한 인자 배열

    /**
     * 고정된 메시지를 사용하는 기존 생성자
     * @param errorCode 에러 코드
     * @param message 에러 메시지
     */
    public CustomException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.args = null;
    }

    /**
     * errors.properties의 메시지 키와 인자를 사용하는 새로운 생성자
     * @param errorCode 메시지 프로퍼티의 키 (예: "auth.register.save.failed")
     * @param args 메시지 포맷팅에 사용될 인자 (예: 사용자 이름, ID 등)
     */
    public CustomException(String errorCode, Object... args) {
        super(errorCode); // 부모 클래스에는 에러 코드를 메시지로 전달 (나중에 MessageSource가 대체)
        this.errorCode = errorCode;
        this.args = args;
    }
}
