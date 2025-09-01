package plant.dev.com.cmm.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

// 전역 예외 처리를 담당하는 핸들러 클래스입니다.
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    /**
     * 사용자가 정의한 CustomException 처리
     * MessageSource를 사용하여 에러 코드를 실제 메시지로 변환합니다.
     */
    @ExceptionHandler(CustomException.class)
    protected ResponseEntity<ErrorResponse> handleCustomException(CustomException ex, HttpServletRequest request) {
        String message;
        try {
            // errors.properties에서 에러 코드(ex.getErrorCode())에 해당하는 메시지를 찾습니다.
            // ex.getArgs()가 있으면 메시지 포맷팅에 사용됩니다.
            message = messageSource.getMessage(ex.getErrorCode(), ex.getArgs(), LocaleContextHolder.getLocale());
        } catch (Exception e) {
            // 만약 properties 파일에 해당 코드가 없으면, 예외 객체에 담긴 기본 메시지를 사용합니다.
            message = ex.getMessage();
        }

        log.error("handleCustomException: {}", message, ex);
        return ErrorResponse.toResponseEntity(HttpStatus.BAD_REQUEST, ex.getErrorCode(), message, request.getRequestURI());
    }

    /**
     * 404 Not Found: 일치하는 핸들러(컨트롤러)를 찾지 못한 경우
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    protected ResponseEntity<ErrorResponse> handleNoHandlerFoundException(NoHandlerFoundException ex, HttpServletRequest request) {
        log.warn("handleNoHandlerFoundException: {}", ex.getMessage());
        String message = messageSource.getMessage("error.not.found.page", null, LocaleContextHolder.getLocale());
        return ErrorResponse.toResponseEntity(HttpStatus.NOT_FOUND, "NOT_FOUND", message, request.getRequestURI());
    }

    /**
     * Spring Security: 인증된 사용자가 권한이 없는 리소스에 접근 시
     */
    @ExceptionHandler(AccessDeniedException.class)
    protected ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("handleAccessDeniedException: {}", ex.getMessage());
        String message = messageSource.getMessage("error.access.denied", null, LocaleContextHolder.getLocale());
        return ErrorResponse.toResponseEntity(HttpStatus.FORBIDDEN, "ACCESS_DENIED", message, request.getRequestURI());
    }

    /**
     * @Valid 어노테이션을 사용한 DTO의 유효성 검사 실패 시 (주로 @RequestBody)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        log.warn("handleMethodArgumentNotValidException: {}", ex.getMessage());
        // 첫 번째 유효성 검사 실패에 대한 메시지를 응답으로 사용
        String message = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        String code = ex.getBindingResult().getFieldError().getField(); // 실패한 필드명
        return ErrorResponse.toResponseEntity(HttpStatus.BAD_REQUEST, code, message, request.getRequestURI());
    }

    /**
     * @ModelAttribute를 사용한 객체의 데이터 바인딩 또는 유효성 검사 실패 시
     */
    @ExceptionHandler(BindException.class)
    protected ResponseEntity<ErrorResponse> handleBindException(BindException ex, HttpServletRequest request) {
        log.warn("handleBindException: {}", ex.getMessage());
        String message = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        String code = ex.getBindingResult().getFieldError().getField();
        return ErrorResponse.toResponseEntity(HttpStatus.BAD_REQUEST, code, message, request.getRequestURI());
    }

    /**
     * 지원하지 않는 HTTP 메서드로 요청 시
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    protected ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        log.warn("handleHttpRequestMethodNotSupportedException: {}", ex.getMessage());
        String message = messageSource.getMessage("error.method.not.allowed", null, LocaleContextHolder.getLocale());
        return ErrorResponse.toResponseEntity(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", message, request.getRequestURI());
    }

    /**
     * 데이터베이스 관련 오류 (예: UNIQUE 제약 조건 위반)
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    protected ResponseEntity<ErrorResponse> handleDataIntegrityViolationException(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.error("handleDataIntegrityViolationException: {}", ex.getMessage(), ex);
        String message = messageSource.getMessage("error.database.integrity", null, LocaleContextHolder.getLocale());
        return ErrorResponse.toResponseEntity(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION", message, request.getRequestURI());
    }

    /**
     * 위에서 처리하지 못한 모든 예외 처리
     */
    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse> handleException(Exception ex, HttpServletRequest request) {
        log.error("handleException: {}", ex.getMessage(), ex);
        String message = messageSource.getMessage("error.internal.server", null, LocaleContextHolder.getLocale());
        return ErrorResponse.toResponseEntity(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", message, request.getRequestURI());
    }
}