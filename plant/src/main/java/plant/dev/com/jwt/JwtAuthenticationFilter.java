package plant.dev.com.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;
import plant.dev.com.cmm.exception.CustomException;
import plant.dev.auth.dto.UserDto;


import java.io.IOException;
import java.util.Collections;

// JWT 토큰을 검증하고 인증을 처리하는 필터 클래스입니다.
@Slf4j
@RequiredArgsConstructor // 생성자를 통해 JwtUtil을 주입받습니다.
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    public static final String HEADER_STRING = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws IOException, ServletException {

        String jwtToken = resolveToken(req);

        if (jwtToken != null) {
            try {
                // 토큰이 유효하고, 현재 SecurityContext에 인증 정보가 없는 경우에만 처리
                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDto userDto = jwtUtil.getUserDtoFromToken(jwtToken);
                    log.debug("JWT 토큰에서 사용자 정보 추출 성공: {}", userDto.getUserId());

                    // === 수정된 부분: 변경된 DTO의 Getter 메서드 사용 ===
                    // 인증 토큰 생성
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDto, // Principal 객체로 UserDto를 사용
                            null,    // 비밀번호는 필요 없음
                            Collections.singletonList(new SimpleGrantedAuthority(userDto.getRolGrade())) // 권한 정보 설정
                    );
                    // ===============================================

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));

                    // SecurityContext에 인증 정보 저장
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("SecurityContext에 '{}' 사용자의 인증 정보를 저장했습니다. 권한: {}", userDto.getUserId(), userDto.getRolGrade());
                }
            } catch (CustomException e) { // InvalidJwtException 대신 CustomException을 catch합니다.
                log.warn("JWT 처리 중 오류 발생 (errorCode: {}): {}", e.getErrorCode(), e.getMessage());
                SecurityContextHolder.clearContext();
            }
        } else {
            log.trace("Authorization 헤더에 JWT 토큰이 없습니다.");
        }

        chain.doFilter(req, res);
    }

    /**
     * HttpServletRequest에서 토큰을 추출합니다.
     * 'Authorization' 헤더보다 쿠키를 우선적으로 확인합니다.
     * @param request HTTP 요청
     * @return 추출된 JWT 문자열 또는 null
     */
    private String resolveToken(HttpServletRequest request) {
        // 1. 쿠키에서 'jwt_token'을 찾습니다.
        Cookie cookie = WebUtils.getCookie(request, "jwt_token");
        if (cookie != null) {
            return cookie.getValue();
        }

        // 2. 쿠키에 토큰이 없으면 기존 방식대로 'Authorization' 헤더를 확인합니다.
        String bearerToken = request.getHeader(HEADER_STRING);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(TOKEN_PREFIX)) {
            return bearerToken.substring(TOKEN_PREFIX.length());
        }
        return null;
    }
}