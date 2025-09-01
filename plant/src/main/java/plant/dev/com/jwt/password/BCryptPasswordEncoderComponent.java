package plant.dev.com.jwt.password;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// BCrypt 알고리즘을 사용한 비밀번호 인코더 컴포넌트입니다.
@Slf4j
@Component("bCryptPasswordEncoder") // Bean의 이름을 명시하여 @Qualifier로 참조할 수 있게 함
public class BCryptPasswordEncoderComponent implements PasswordEncoder {

    private final PasswordEncoder passwordEncoder;

    /**
     * 생성자에서 application.properties의 설정값을 주입받아 BCrypt 인스턴스를 생성합니다.
     * @param strength BCrypt 강도 (기본값 10)
     */
    public BCryptPasswordEncoderComponent(@Value("${security.password.bcrypt.strength:10}") int strength) {
        log.info("BCryptPasswordEncoder를 생성합니다. (강도: {})", strength);
        this.passwordEncoder = new BCryptPasswordEncoder(strength);
    }

    @Override
    public String encode(CharSequence rawPassword) {
        return this.passwordEncoder.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        return this.passwordEncoder.matches(rawPassword, encodedPassword);
    }
}