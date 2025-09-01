package plant.dev.auth.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import plant.dev.com.cmm.util.map.CustomMap;
import plant.dev.auth.dto.RegisterDto;
import plant.dev.auth.dto.UserDto;
import plant.dev.auth.service.AuthService;

import java.util.Map;

// 사용자 인증 관련 요청을 처리하는 컨트롤러입니다.
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    private final MessageSource messageSource;


    @PostMapping("/login")
    public ResponseEntity<CustomMap> login(@RequestBody Map<String, String> loginRequest, HttpServletResponse httpServletResponse) {
        String userId = loginRequest.get("id");
        String password = loginRequest.get("pw");

        log.info("login request: {}", loginRequest);

        // 1. 서비스에서 토큰과 사용자 정보를 받아옵니다.
        CustomMap loginResult = authService.login(userId, password);
        String token = loginResult.getString("token");
        String name = loginResult.getString("name");

        // 2. 💡 HttpOnly 쿠키를 생성합니다.
        Cookie cookie = new Cookie("jwt_token", token);
        cookie.setHttpOnly(true); // 자바스크립트 접근 불가
        cookie.setPath("/");      // 모든 경로에서 쿠키 사용
        cookie.setMaxAge(60 * 60); // 쿠키 유효 시간 (1시간)
        // cookie.setSecure(true); // HTTPS 환경에서만 쿠키 전송 (배포 시 활성화 권장)

        // 3. 💡 응답(Response)에 쿠키를 추가합니다.
        httpServletResponse.addCookie(cookie);

        // 4. 응답 본문(Body)에는 사용자 이름 등 민감하지 않은 정보만 담습니다.
        CustomMap responseBody = new CustomMap();
        responseBody.put("name", name);

        return ResponseEntity.ok(responseBody);
    }

    @PostMapping("/logout")
    public ResponseEntity<CustomMap> logout(HttpServletRequest request, HttpServletResponse response) {
        // 1. 'jwt_token' 쿠키를 찾아서 만료시킵니다.
        Cookie cookie = new Cookie("jwt_token", null); // value를 null로 설정
        log.info("logout request: {}", request);
        cookie.setHttpOnly(true);

        cookie.setMaxAge(0); // 유효시간을 0으로 설정하여 즉시 만료
        cookie.setPath("/"); // 쿠키가 사용된 모든 경로에서 삭제되도록 설정

        // 2. 응답에 만료된 쿠키를 추가하여 클라이언트에게 전달합니다.
        response.addCookie(cookie);

        // 3. 응답 본문을 구성합니다.
        CustomMap responseBody = new CustomMap();
        responseBody.put("message", messageSource.getMessage("auth.logout.success",null, LocaleContextHolder.getLocale() ));
        log.info("logout response: {}", responseBody.get("message"));
        return ResponseEntity.ok(responseBody);
    }

    /**
     * 프론트엔드에서 받은 이름과 현재 로그인된 사용자의 이름이 일치하는지 확인합니다.
     * @param requestBody 프론트엔드에서 POST 방식으로 보낸 JSON 객체 (예: {"name": "홍길동"})
     * @param userDto @AuthenticationPrincipal을 통해 주입받은 현재 로그인 사용자 정보
     * @return 이름 일치 여부를 담은 응답 (예: {"isMatch": true})
     */
    @PostMapping("/profile")
    public ResponseEntity<CustomMap> verifyUserName(@RequestBody Map<String, String> requestBody,
                                                    @AuthenticationPrincipal UserDto userDto) {
        log.debug("verifyUserName request: {}", requestBody);
        CustomMap responseBody = new CustomMap();

        // 1. 프론트엔드에서 보낸 이름
        String nameFromRequest = requestBody.get("name");

        // 2. 로그인된 사용자가 없는 경우 처리
        if (userDto == null) {
            responseBody.put("name", "");
            responseBody.put("isMatch", false);
            return ResponseEntity.ok(responseBody);
        }

        // 3. 현재 로그인된 사용자의 이름
        String nameFromToken = userDto.getUserName();

        // 4. 두 이름이 일치하는지 비교
        boolean isMatch = nameFromToken.equals(nameFromRequest);

        // 5. 결과를 CustomMap에 담아 응답
        if(!isMatch) {
            responseBody.put("name", "");
            responseBody.put("isMatch", false);
        }else{
            responseBody.put("name", nameFromRequest );
            responseBody.put("isMatch", true);
        }

        return ResponseEntity.ok(responseBody);
    }

    /**
     * 회원가입 요청을 처리합니다.
     * @param requestDto 회원가입 정보 (email, password, name)
     * @return 성공 메시지
     */
    @PostMapping("/register")
    public ResponseEntity<CustomMap> register(@Valid @RequestBody RegisterDto requestDto) {
        authService.register(requestDto);

        CustomMap responseBody = new CustomMap();
        responseBody.put("message", messageSource.getMessage("auth.register.success",null, LocaleContextHolder.getLocale() ));

        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }
}