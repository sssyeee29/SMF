package plant.dev.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;
import plant.dev.jpa.entity.User;
import plant.dev.jpa.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * AuthController에 대한 통합 테스트 클래스입니다.
 * @SpringBootTest: 전체 스프링 컨텍스트를 로드하여 통합 테스트를 진행합니다.
 * @AutoConfigureMockMvc: MockMvc를 자동으로 설정하고 주입받아 컨트롤러를 테스트할 수 있게 합니다.
 * @Transactional: 각 테스트 실행 후 데이터베이스 변경 사항을 롤백하여 테스트 독립성을 보장합니다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc; // HTTP 요청을 시뮬레이션하는 MockMvc 객체

    @Autowired
    private ObjectMapper objectMapper; // Java 객체를 JSON으로 변환하기 위한 객체

    @Autowired
    private UserRepository userRepository; // 테스트 데이터 생성을 위한 리포지토리

    @Autowired
    private PasswordEncoder passwordEncoder; // 비밀번호 암호화를 위한 인코더

    private final String TEST_USER_ID = "testuser";
    private final String TEST_USER_PASSWORD = "password123";

    /**
     * 각 테스트가 실행되기 전에 테스트용 사용자 데이터를 DB에 저장합니다.
     */
    @BeforeEach
    void setUp() {
        // 기존에 같은 ID의 사용자가 있을 경우를 대비해 삭제
        userRepository.deleteById(TEST_USER_ID);

        // 테스트에 사용할 새로운 사용자 생성
        User testUser = new User(
                TEST_USER_ID,
                passwordEncoder.encode(TEST_USER_PASSWORD), // 비밀번호는 반드시 암호화하여 저장
                "테스트유저",
                "Y",
                "ROLE_USER", // 사용자 역할
                null,
                null
        );
        userRepository.save(testUser);
    }

    @Test
    @DisplayName("로그인 성공 테스트")
    void login_success() throws Exception {
        // given: 로그인에 필요한 요청 본문(JSON) 생성
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("userId", TEST_USER_ID);
        loginRequest.put("password", TEST_USER_PASSWORD);
        String requestBody = objectMapper.writeValueAsString(loginRequest);

        // when: /api/auth/login으로 POST 요청을 보냄
        ResultActions actions = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody));

        // then: 응답을 검증
        actions
                .andExpect(status().isOk()) // HTTP 상태 코드가 200 OK인지 확인
                .andExpect(jsonPath("$.token").exists()) // 응답 JSON에 'token' 필드가 존재하는지 확인
                .andExpect(jsonPath("$.token").isString()) // 'token' 필드의 값이 문자열인지 확인
                .andDo(print()); // 요청/응답 전체 내용을 콘솔에 출력
    }

    @Test
    @DisplayName("로그인 실패 테스트 - 잘못된 비밀번호")
    void login_fail_wrong_password() throws Exception {
        // given: 잘못된 비밀번호로 요청 본문 생성
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("userId", TEST_USER_ID);
        loginRequest.put("password", "wrongpassword"); // 틀린 비밀번호
        String requestBody = objectMapper.writeValueAsString(loginRequest);

        // when: /api/auth/login으로 POST 요청
        ResultActions actions = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody));

        // then: 실패 응답을 검증
        actions
                .andExpect(status().isBadRequest()) // HTTP 상태 코드가 400 Bad Request인지 확인
                .andExpect(jsonPath("$.code").value("LOGIN_FAIL")) // 에러 코드가 'LOGIN_FAIL'인지 확인
                .andExpect(jsonPath("$.message").value("아이디 또는 비밀번호가 일치하지 않습니다.")) // 에러 메시지 확인
                .andDo(print());
    }

    @Test
    @DisplayName("로그인 실패 테스트 - 존재하지 않는 사용자")
    void login_fail_user_not_found() throws Exception {
        // given: 존재하지 않는 사용자 정보로 요청 본문 생성
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("userId", "nonexistentuser");
        loginRequest.put("password", "anypassword");
        String requestBody = objectMapper.writeValueAsString(loginRequest);

        // when: /api/auth/login으로 POST 요청
        ResultActions actions = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody));

        // then: 실패 응답을 검증
        actions
                .andExpect(status().isBadRequest()) // HTTP 상태 코드가 400 Bad Request인지 확인
                .andExpect(jsonPath("$.code").value("LOGIN_FAIL")) // 에러 코드가 'LOGIN_FAIL'인지 확인
                .andDo(print());
    }
}
/*
```
        *참고: 위 코드의 `User` 엔티티 생성자 부분은 실제 `User` 클래스에 맞게 수정이 필요할 수 있습니다. 만약 모든 필드를 받는 생성자가 없다면, 기본 생성자와 setter를 사용하여 객체를 생성해야 합니다.*

        ### **실행 방법**

        1.  위 코드를 `src/test/java/plant/dev/auth/controller/AuthControllerTest.java`에 저장합니다.
        2.  IntelliJ, Eclipse 등 사용하시는 IDE에서 해당 파일을 열고 테스트 실행 버튼(보통 녹색 삼각형 아이콘)을 클릭하거나, 클래스 또는 각 메서드 옆의 실행 아이콘을 클릭합니다.
        3.  또는, Maven이나 Gradle 빌드 도구를 통해 전체 테스트를 실행할 수도 있습니다.
        * **Maven**: `mvn test`
        * **Gradle**: `./gradlew test`

테스트가 성공적으로 실행되면, 로그인 기능이 예상대로 동작함을 보장할 수 있습

Body = {"token":"eyJhbGciOiJIUzUxMiJ9.eyJyb2xHcmFkZSI6IlJPTEVfVVNFUiIsInVzZXJOYW1lIjoi7YWM7Iqk7Yq47Jyg7KCAIiwic3ViIjoidGVzdHVzZXIiLCJpYXQiOjE3NTIyMDU3MTcsImV4cCI6MTc1MjIwOTMxN30.5Xeu63eft3hPXVtxp31bSkRhLdU7F1bM2FGotdBUQAVOtcHujQR9hSWlMQR_Yeb1yJgMnb73SR9zPrLePGcnWQ"}
Body = {"token":"eyJhbGciOiJIUzUxMiJ9.eyJyb2xHcmFkZSI6IlJPTEVfVVNFUiIsInVzZXJOYW1lIjoi7YWM7Iqk7Yq47Jyg7KCAIiwic3ViIjoidGVzdHVzZXIiLCJpYXQiOjE3NTIyMDU4NDcsImV4cCI6MTc1MjIwOTQ0N30.pz8KKWxCLsqMmjXZuT-0Pw0UNH658Xy88vYI4x22x_1L61_977vwrQP6Vsic9fVeZso0lJ-odzqQVp5xOkOaNA"}
*/
