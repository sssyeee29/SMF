package plant.dev.com.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Component;
import plant.dev.com.cmm.exception.CustomException;
import plant.dev.auth.dto.UserDto;

import javax.crypto.SecretKey;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

// JWT 토큰 생성, 검증, 파싱을 담당하는 유틸리티 클래스입니다.
// (jjwt 0.12.x+ 호환, CustomException 적용)
@Slf4j
@Component
@PropertySource("classpath:/plant/secrets.properties")
public class JwtUtil implements Serializable {

    private static final long serialVersionUID = -5180902194184255251L;

    public static final long JWT_TOKEN_VALIDITY = 60 * 60;

    @Value("${Globals.jwt.secret.key}")
    private String secretKey;

    private SecretKey key;

    @PostConstruct
    public void init() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * 토큰에서 사용자 ID(Subject)를 추출합니다.
     * @param token JWT 토큰
     * @return 사용자 ID
     */
    public String getUserIdFromToken(String token) {
        return getAllClaimsFromToken(token).getSubject();
    }

    public <T> T getClaimFromToken(String token, String key, Class<T> requiredType) {
        try {
            final Claims claims = getAllClaimsFromToken(token);
            return claims.get(key, requiredType);
        } catch (Exception e) {
            log.warn("토큰에서 클레임 '{}' 추출 중 오류 발생: {}", key, e.getMessage());
            return null;
        }
    }

    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 사용자 정보를 바탕으로 JWT 토큰을 생성합니다.
     * @param userDto 사용자 정보 DTO
     * @return 생성된 JWT 토큰
     */
    public String generateToken(UserDto userDto) {
        Map<String, Object> claims = new HashMap<>();
        // === 수정된 부분: 변경된 DTO 필드로 클레임 생성 ===
        claims.put("rolGrade", userDto.getRolGrade());
        claims.put("userName", userDto.getUserName());
        // ===============================================

        return doGenerateToken(claims, userDto.getUserId()); // 토큰의 주체(Subject)로 userId 사용
    }

    private String doGenerateToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject) // 토큰의 주체
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY * 1000))
                .signWith(key)
                .compact();
    }

    /**
     * 토큰에서 UserDto 정보를 추출합니다.
     * @param token JWT 토큰
     * @return 토큰 정보를 바탕으로 생성된 UserDto 객체
     * @throws CustomException 토큰이 유효하지 않을 경우 발생
     */
    public UserDto getUserDtoFromToken(String token) throws CustomException {
        try {
            Claims claims = getAllClaimsFromToken(token);

            // === 수정된 부분: 변경된 클레임과 Subject로 DTO 생성 ===
            UserDto userDto = new UserDto();
            userDto.setUserId(claims.getSubject()); // Subject에서 userId 추출
            userDto.setRolGrade(claims.get("rolGrade", String.class));
            userDto.setUserName(claims.get("userName", String.class));
            // ===============================================

            return userDto;

        } catch (ExpiredJwtException e) {
            throw new CustomException("JWT_EXPIRED", "만료된 JWT 토큰입니다.");
        } catch (JwtException e) { // MalformedJwtException, SignatureException 등을 한번에 처리
            throw new CustomException("JWT_INVALID", "유효하지 않은 JWT 토큰입니다: " + e.getMessage());
        }
    }
}