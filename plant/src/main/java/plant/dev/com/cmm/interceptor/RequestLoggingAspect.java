package plant.dev.com.cmm.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;
import java.util.Enumeration;

// 컨트롤러의 요청 및 응답 정보를 로깅하는 AOP 클래스입니다.
@Slf4j // Lombok을 사용하여 로거 자동 생성
@Aspect // 이 클래스가 AOP 애스펙트임을 선언
@Component // Spring 빈으로 등록하여 컨테이너가 관리하도록 함
public class RequestLoggingAspect {

    /**
     * 포인트컷 정의: @RestController 또는 @Controller 어노테이션이 붙은 클래스의
     * 모든 public 메서드를 대상으로 합니다.
     * 이는 특정 패키지 경로를 지정하는 것보다 더 유연하고 권장되는 방법입니다.
     */
    @Pointcut("@within(org.springframework.web.bind.annotation.RestController) || @within(org.springframework.stereotype.Controller)")
    public void controllerMethods() {
        // 이 메서드는 단지 포인트컷을 정의하기 위한 식별자 역할만 합니다.
    }

    /**
     * `@Before` 어드바이스: 컨트롤러 메서드 실행 **전**에 요청 정보를 로깅합니다.
     *
     * @param joinPoint 현재 실행될 조인 포인트(컨트롤러 메서드)에 대한 정보
     */
    @Before("controllerMethods()")
    public void logRequestEntry(JoinPoint joinPoint) {
        // 현재 HTTP 요청 객체 가져오기 (웹 요청이 아닐 경우 null 반환 가능)
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = null;

        if (attributes != null) {
            request = attributes.getRequest();
        }

        log.info("============== Controller 요청 시작 ==============");
        log.info("요청된 메서드: {}", joinPoint.getSignature().toShortString()); // 호출될 메서드의 이름 (클래스명.메서드명)

        if (request != null) {
            log.info("요청 URL: {}", request.getRequestURL());
            log.info("HTTP 메서드: {}", request.getMethod());
            log.info("클라이언트 IP: {}", request.getRemoteAddr());

            // 요청 헤더 로깅 (선택 사항)
            log.info("--- 요청 헤더 ---");
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                log.info("{}: {}", headerName, request.getHeader(headerName));
            }

            // 요청 파라미터 로깅 (GET 요청 등)
            if (request.getParameterMap() != null && !request.getParameterMap().isEmpty()) {
                log.info("--- 요청 파라미터 ---");
                request.getParameterMap().forEach((key, value) ->
                        log.info("{}: {}", key, Arrays.toString(value))
                );
            }
        }

        // 메서드에 전달된 인자 로깅 (@RequestBody 데이터 포함)
        Object[] args = joinPoint.getArgs();
        if (args != null && args.length > 0) {
            log.info("--- 메서드 인자 ---");
            for (int i = 0; i < args.length; i++) {
                // 경고: 민감한 정보(예: 비밀번호, 주민등록번호)는 로그에 남기지 않도록 주의!
                // 필요시 마스킹 로직 추가 (e.g., args[i] instanceof String && "password".equalsIgnoreCase(joinPoint.getSignature().getName()) ? "***" : args[i])
                log.info("인자 #{}: {}", i, args[i]);
            }
        }
        log.info("-------------------------------------------------");
    }

    /**
     * `@AfterReturning` 어드바이스: 컨트롤러 메서드가 성공적으로 실행되어 값을 반환한 **후**에 응답 값을 로깅합니다.
     * 이 어드바이스는 예외가 발생하지 않고 메서드가 정상적으로 완료되었을 때만 실행됩니다.
     *
     * @param joinPoint 현재 실행된 조인 포인트(컨트롤러 메서드)에 대한 정보
     * @param result    컨트롤러 메서드가 반환한 객체 (클라이언트로 전송될 최종 응답 데이터)
     */
    @AfterReturning(pointcut = "controllerMethods()", returning = "result")
    public void logResponseExit(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().toShortString();

        log.info("============== Controller 응답 시작 ==============");
        log.info("응답된 메서드: {}", methodName);
        // 클라이언트로 보내질 최종 응답 값을 로깅합니다.
        // 경고: 민감한 정보가 포함될 수 있으므로, 실제 운영 환경에서는 주의가 필요합니다.
        log.info("반환된 응답 값: {}", result);
        log.info("============== Controller 응답 종료 ==============\n"); // 응답 로깅 후 줄바꿈으로 구분
    }
}