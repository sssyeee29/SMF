package plant.dev.camera.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/*
 * WebCorsConfig
 * - CORS(Cross-Origin Resource Sharing) 설정 클래스
 * - React( http://localhost:3000 ) → Spring Boot(8080) 카메라 API(/camera/**) 호출 시
 *   발생하는 CORS 문제 해결
 *
 * @author : yeonsu
 * @fileName : WebCorsConfig
 * @since : 250902
 */

@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/camera/**") // 카메라 API 허용
                .allowedOrigins("http://localhost:3000") // React 서버
                .allowedMethods("GET", "POST")
                .allowCredentials(true); // 쿠키/인증 헤더 포함 허용
    }
}
