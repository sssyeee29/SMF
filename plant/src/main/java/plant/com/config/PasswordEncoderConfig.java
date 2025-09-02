package plant.com.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

// 비밀번호 인코더 관련 설정을 담당하는 클래스입니다.
// 암호화 전략을 한 곳에서 관리하여 일관성과 유지보수성을 높입니다.
@Configuration
@Slf4j
public class PasswordEncoderConfig {

    private final PasswordEncoder passwordEncoder;

    /**
     * 사용할 PasswordEncoder 구현체를 생성자 주입으로 받습니다.
     * @Qualifier("jasyptPasswordEncoder")를 사용하여 여러 PasswordEncoder 구현체 중
     * 우리가 만든 JasyptPasswordEncoder를 특정하여 주입받습니다.
     *
     * @param jasyptPasswordEncoder @Component("jasyptPasswordEncoder")로 등록된 Bean
     *                                          bCryptPasswordEncoder
     *                                          nonPasswordEncoder
     */
    public PasswordEncoderConfig(@Qualifier("nonPasswordEncoder") PasswordEncoder jasyptPasswordEncoder) {
        this.passwordEncoder = jasyptPasswordEncoder;
    }

    /**
     * 주입받은 JasyptPasswordEncoder를 애플리케이션의 기본 PasswordEncoder Bean으로 등록합니다.
     * 이제부터 @Autowired로 PasswordEncoder를 주입받는 모든 곳에서는
     * Jasypt 방식의 암호화/검증 로직이 사용됩니다.
     *
     * @return 애플리케이션 전역에서 사용될 PasswordEncoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return this.passwordEncoder;
    }

}