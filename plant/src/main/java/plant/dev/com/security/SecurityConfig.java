package plant.dev.com.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import plant.dev.com.jwt.JwtAuthenticationEntryPoint;
import plant.dev.com.jwt.JwtAuthenticationFilter;
import plant.dev.com.jwt.JwtUtil;

// Spring Security 설정을 담당하는 클래스입니다.
@Configuration
@EnableWebSecurity // Spring Security 활성화
@RequiredArgsConstructor
@PropertySource("classpath:/plant/secrets.properties")
@Slf4j
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Value("${Globals.DriverClassName}")
    private String driverClassName;

    /*
    // PasswordEncoderConfig 사용
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // 1. CSRF 보호 비활성화 (Stateless JWT 사용 시)
        http.csrf((csrf) -> csrf.disable());

        // 2. 세션 관리 정책을 STATELESS로 설정 (세션을 사용하지 않음)
        http.sessionManagement((sessionManagement) ->
                sessionManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );

        // 3. HTTP 요청에 대한 인가 규칙 설정
        http.authorizeHttpRequests((authorizeHttpRequests) ->
                authorizeHttpRequests
                        // 로그인, 회원가입, OAuth2 관련 경로는 인증 없이 접근 허용
                        //.requestMatchers("/api/auth/**", "/login/**", "/oauth2/**").permitAll()
                        //.requestMatchers("/api/auth/login", "/api/auth/logout","/api/auth/profile","/api/auth/register").permitAll()
                        //.requestMatchers("/api/menus").permitAll()
                        // H2 콘솔 접근 허용 (개발용)
                        //.requestMatchers("/h2-console/**").permitAll()
                        // 그 외 모든 요청은 인증 필요
                        .requestMatchers("/**").permitAll()
                        .anyRequest().authenticated()
        );
        // 4. 예외 처리 설정
        http.exceptionHandling((exceptionHandling) ->
                exceptionHandling.authenticationEntryPoint(jwtAuthenticationEntryPoint)
        );

        // 5. 커스텀 필터 추가 (수정된 부분)
        // XSS 방어 필터를 UsernamePasswordAuthenticationFilter 앞에 추가 (가장 먼저 실행)
        // 주석처리 이유는 WebMvcConfig로 이동함
        // http.addFilterBefore(new EscapeFilter(), UsernamePasswordAuthenticationFilter.class);
        // JWT 인증 필터를 UsernamePasswordAuthenticationFilter 앞에 추가 (EscapeFilter 다음에 실행)
        http.addFilterBefore(new JwtAuthenticationFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);

        if("org.h2.Driver".equals(driverClassName)) {
            // H2 콘솔을 위한 헤더 설정 (개발용)
            http.headers((headers) -> headers.frameOptions((frameOptions) -> frameOptions.sameOrigin()));
        }else {
            log.debug("driverClassName 드라이브는 : {}", driverClassName);
        }

        return http.build();
    }
}
/*

        ### 주요 변경점

```java
// 기존 코드
http.addFilterBefore(new EscapeFilter(), JwtAuthenticationFilter.class);
        http.addFilterBefore(new JwtAuthenticationFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);

// 수정된 코드
        http.addFilterBefore(new EscapeFilter(), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(new JwtAuthenticationFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);
        ```EscapeFilter`를 추가할 때 기준이 되는 필터를 `JwtAuthenticationFilter.class`에서 `UsernamePasswordAuthenticationFilter.class`로 변경했습니다. 이렇게 하면 두 필터 모두 명확한 순서를 가지게 되어 문제가 해결됩


 */