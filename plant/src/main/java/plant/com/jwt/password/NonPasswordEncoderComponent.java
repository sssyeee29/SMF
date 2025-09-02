package plant.com.jwt.password;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// 비밀번호 인코딩을 하지 않는 컴포넌트입니다.
@Slf4j
@Component("nonPasswordEncoder")
public class NonPasswordEncoderComponent implements PasswordEncoder {

    @Override
    public String encode(CharSequence rawPassword) {
        return rawPassword.toString();
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        return encodedPassword.equals(rawPassword);
    }
}
