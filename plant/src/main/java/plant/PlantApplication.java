package plant;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.Banner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.ServletComponentScan;
//수정
// Spring Boot 메인 애플리케이션 클래스입니다.
@Slf4j
@ServletComponentScan
@SpringBootApplication
public class PlantApplication {

    public static void main(String[] args) {
        log.debug("##### SpringApplication Start #####");
        //스프링부트 로그 없이 실행하기
//        SpringApplication springApplication = new SpringApplication(plantApplication.class);
//        springApplication.setBannerMode(Banner.Mode.OFF);
//        springApplication.run(args);
        new SpringApplicationBuilder()
                .bannerMode(Banner.Mode.OFF)
                .sources(PlantApplication.class)
                .run(args);
        log.debug("##### SpringApplication End #####");
    }
}
