package plant.dev.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plant.com.cmm.exception.CustomException;
import plant.com.cmm.util.map.CustomMap;
import plant.com.jwt.JwtUtil;
import plant.dev.auth.dto.RegisterDto;
import plant.dev.auth.dto.UserDto;
import plant.dev.jpa.entity.User;
import plant.dev.jpa.repository.UserRepository;

// 사용자 인증 관련 비즈니스 로직을 처리하는 서비스 클래스입니다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public CustomMap login(String userId, String password) {
        // 1. JPA로 사용자 조회
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException("LOGIN_FAIL", "아이디 또는 비밀번호가 일치하지 않습니다."));

        // 2. 패스워드 검증
        if (!passwordEncoder.matches(password, user.getUserPswr())) {
            throw new CustomException("LOGIN_FAIL", "아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        // 3. User 엔티티를 UserDto로 변환
        UserDto userDto = new UserDto();
        userDto.setUserId(user.getUserId());
        userDto.setUserName(user.getUserName());
        userDto.setRolGrade(user.getRolGrade());

        // 4. JWT 생성
        String token = jwtUtil.generateToken(userDto);

        // 5. 💡 토큰과 사용자 이름을 CustomMap에 담아 반환
        CustomMap result = new CustomMap();
        result.put("token", token);
        result.put("id", user.getUserId());
        result.put("email", user.getUserId());
        result.put("name", user.getUserName());

        return result;
    }

    /**
     * 신규 사용자 회원가입 처리
     * @param requestDto 회원가입 정보 (email, password, name)
     */
    @Transactional
    public void register(RegisterDto requestDto) {
        // 1. 이메일(사용자 ID) 중복 확인
        if (userRepository.findByUserId(requestDto.getEmail()).isPresent()) {
            log.error("중복이메일. User: {}", requestDto.getEmail());
            throw new CustomException("error.save_failed");
        }

        // 2. User 엔티티 생성 및 정보 설정
        User newUser = new User(
                requestDto.getEmail(),
                passwordEncoder.encode(requestDto.getPassword()),
                requestDto.getName(),
                "Y",
                "ROLE_USER"
        );

        // 3. JPA를 통해 사용자 정보 저장
        try {
            userRepository.save(newUser);
        } catch (DataAccessException e) { // 더 구체적인 DataAccessException으로 변경
            // 저장 과정에서 데이터베이스 관련 예외 발생 시 로그를 남기고, 사용자 정의 예외를 던집니다.
            log.error("회원가입 저장 중 데이터베이스 오류 발생. User: {}", newUser.getUserId(), e);
            throw new CustomException("error.save_failed");
        }
    }

}
