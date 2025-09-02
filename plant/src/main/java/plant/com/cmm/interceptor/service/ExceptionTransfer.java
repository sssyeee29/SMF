package plant.com.cmm.interceptor.service;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.springframework.stereotype.Service;

// AOP에서 발생한 예외를 공통 처리하는 서비스 클래스입니다.
@Slf4j
// 이 클래스도 스프링 빈으로 등록합니다.
@Service
public class ExceptionTransfer {


    /**
     * 발생한 예외를 받아서 처리하거나 다른 예외로 전환하는 메서드.
     *
     * @param joinPoint 예외가 발생한 조인 포인트
     * @param ex        발생한 원본 예외
     * @throws Exception 처리 후 다시 던질 새로운 예외 (또는 원본 예외)
     */
    public void transfer(JoinPoint joinPoint, Exception ex) throws Exception {
        String methodName = joinPoint.getSignature().toShortString();
        log.error("메서드 '{}' 실행 중 예외 발생: {}", methodName, ex.getMessage(), ex);

        // --- 여기에 예외 전환 또는 사용자 정의 로직을 구현합니다. ---
        // 예시 1: 특정 예외를 사용자 정의 비즈니스 예외로 전환
        if (ex instanceof IllegalArgumentException) {
            log.warn("IllegalArgumentException을 BusinessException으로 전환합니다.");
            throw new RuntimeException("테스트 이다. 잘못된 입력값입니다.");
        }
        // 예시 2: 데이터베이스 관련 예외를 데이터 접근 예외로 전환
        else if (ex instanceof java.sql.SQLException) {
            log.error("데이터베이스 예외 발생: {}", ex.getMessage());
            throw new RuntimeException("데이터베이스 처리 중 오류가 발생했습니다.", ex);
        }
        // 예시 3: 다른 모든 예외는 그대로 던지거나, 제네릭 예외로 캡슐화
        else {
            log.error("알 수 없는 예외가 발생했습니다. 원본 예외를 다시 던집니다.");
            throw ex; // 원본 예외를 그대로 던지거나, 새로운 RuntimeException으로 랩핑할 수 있습니다.
            // throw new RuntimeException("서비스 처리 중 오류가 발생했습니다.", ex);
        }
    }
}
