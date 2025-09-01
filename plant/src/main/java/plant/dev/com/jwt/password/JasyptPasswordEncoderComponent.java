package plant.dev.com.jwt.password;


import org.jasypt.encryption.StringEncryptor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// Jasypt를 이용한 비밀번호 인코더 컴포넌트입니다.
@Component("jasyptPasswordEncoder")
public class JasyptPasswordEncoderComponent implements PasswordEncoder {

    private final StringEncryptor jasyptStringEncryptor;

    // JasyptConfig에 정의된 "jasyptStringEncryptor" Bean을 주입받습니다.
    public JasyptPasswordEncoderComponent(@Qualifier("jasyptStringEncryptor") StringEncryptor jasyptStringEncryptor) {
        this.jasyptStringEncryptor = jasyptStringEncryptor;
    }

    /**
     * 사용자가 입력한 원본 비밀번호를 Jasypt로 암호화합니다.
     * @param rawPassword 암호화되지 않은 원본 비밀번호
     * @return 암호화된 문자열
     */
    @Override
    public String encode(CharSequence rawPassword) {
        return jasyptStringEncryptor.encrypt(rawPassword.toString());
    }

    /**
     * 사용자가 입력한 비밀번호와 DB에 저장된 암호화된 비밀번호가 일치하는지 검증합니다.
     * @param rawPassword 사용자가 입력한 원본 비밀번호
     * @param encodedPassword DB에 저장된 암호화된 비밀번호
     * @return 일치 여부 (true/false)
     */
    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        try {
            // DB에 저장된 비밀번호를 복호화하여, 사용자가 입력한 원본 비밀번호와 비교합니다.
            String decryptedPassword = jasyptStringEncryptor.decrypt(encodedPassword);
            return decryptedPassword.equals(rawPassword.toString());
        } catch (Exception e) {
            // 복호화 과정에서 오류가 발생하면 (예: 암호화 키 불일치, 잘못된 형식) 일치하지 않는 것으로 간주합니다.
            return false;
        }
    }
}
