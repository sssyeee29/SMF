package plant.dev.com.cmm.interceptor;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import plant.dev.com.cmm.interceptor.service.ExceptionTransfer;

// AOP를 이용해 서비스 계층의 예외를 공통 처리하는 클래스입니다.
@Aspect
@Component
public class AopExceptionTransfer {

    // 예외를 실제로 전환하거나 처리할 서비스/유틸리티 객체
    // 스프링 컨테이너가 이 타입의 빈을 찾아 자동으로 주입해 줍니다.
    private final ExceptionTransfer exceptionTransfer;

    // 생성자 주입을 통해 ExceptionTransfer 객체를 받습니다.
    public AopExceptionTransfer(ExceptionTransfer exceptionTransfer) {
        this.exceptionTransfer = exceptionTransfer;
    }

    /**
     * 포인트컷 정의: 애스펙트를 적용할 조인 포인트를 지정합니다.
     * 여기서는 'com.plant.com.service' 패키지 내에 있는
     * 모든 서비스 클래스(혹은 특정 명명 규칙을 따르는 클래스)의
     * 모든 public 메서드를 대상으로 합니다.
     *
     * 예시 1: 특정 패키지 내 모든 public 메서드
     * "execution(public * com.plant.com.service..*.*(..))"
     *
     * 예시 2: @Service 어노테이션이 붙은 클래스의 모든 public 메서드 (더 유연)
     * "@within(org.springframework.stereotype.Service) && execution(public * *(..))"
     */

    //@Pointcut("execution(* plant.dev..service..*.*(..))) or execution(* plant.com..service..*.*(..))")
    @Pointcut("execution(public * plant.dev..service..*.*(..))")
    private void serviceOperation() {} // 포인트컷 식별자 메서드

    /**
     * 어드바이스 정의: serviceOperation() 포인트컷으로 지정된 메서드에서
     * 예외(Exception)가 발생하여 던져질 때 실행됩니다.
     *
     * @param joinPoint 현재 실행 중인 조인 포인트에 대한 정보 (예외가 발생한 메서드)
     * @param ex        발생한 예외 객체
     * @throws Exception 예외 전환 후 다시 예외를 던질 수 있습니다.
     */
    @AfterThrowing(pointcut = "serviceOperation()", throwing = "ex")
    public void doAfterThrowingServiceException(JoinPoint joinPoint, Exception ex) throws Exception {
        // 실제 예외 전환 또는 처리 로직을 exceptionTransfer 객체에 위임합니다.
        exceptionTransfer.transfer(joinPoint, ex);
        // exceptionTransfer.transfer() 메서드가 새로운 예외를 던지거나,
        // 로깅 후 예외를 삼키거나(권장하지 않음), 다른 처리를 수행할 수 있습니다.
    }
}