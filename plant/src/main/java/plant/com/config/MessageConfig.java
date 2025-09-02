package plant.com.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;

// 다국어 메시지 소스(MessageSource) 설정을 담당하는 클래스입니다.
@Configuration
public class MessageConfig {

    /**
     * 애플리케이션의 주 MessageSource 빈을 등록합니다.
     * 이 빈은 'messages/errors.properties' 파일에서 메시지를 로드하고,
     * UTF-8 인코딩을 사용하며, 60초마다 캐시를 갱신합니다.
     *
     * @return MessageSource - 설정된 ReloadableResourceBundleMessageSource 인스턴스
     */
    @Bean // 이 메서드가 Spring 빈을 생성함을 명시
    public MessageSource messageSource() { // 빈 이름은 'messageSource'로 하여 Spring이 기본 MessageSource로 인식하도록 함
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        // 메시지 파일의 기본 이름 설정 (classpath 기준)
        // src/main/resources/messages/errors.properties 파일을 읽습니다.
        messageSource.setBasenames("classpath:messages/errors","classpath:/messages/success");
        messageSource.setDefaultEncoding("UTF-8"); // 인코딩 설정
        messageSource.setCacheSeconds(60); // 메시지 파일 변경 시 캐시 갱신 주기 (초)
        return messageSource;
    }
}