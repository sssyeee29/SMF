package plant.com.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Web MVC 관련 설정을 담당하는 클래스입니다.
/**
 * fileName       : WebMvcConfig
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
//@EnableWebMvc // @ControllerAdvice의 @ExceptionHandler(NoHandlerFoundException.class)가 작동하도록 설정 //spring.web.resources.add-mappings=false 이걸로 변경
public class WebMvcConfig implements WebMvcConfigurer {
	// 이 설정을 추가하면 스프링이 404 Not Found 오류를 DispatcherServlet으로 보냅니다.
	@Value("${cors.allowed-origins}")
	private String[] allowedOrigins;

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/api/**")
				.allowedOrigins(allowedOrigins)
				.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
				.allowedHeaders("*")
				.allowCredentials(true)
				.maxAge(3600);

		// [카메라 API 전용 CORS 설정] /camera/**
		registry.addMapping("/camera/**")
				.allowedOrigins("http://localhost:3000") // React 개발 서버
				.allowedMethods("GET", "POST")
				.allowCredentials(true);
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		// Raspberry Pi에서 저장한 이미지 접근 경로 설정
		registry.addResourceHandler("/static/frames/**")
				.addResourceLocations("file:///C:/ingest_frames/");  // 윈도우 경로는 file:/// 로 시작
	}
}

/*

항목                  필터 방식 (EscapeFilter)                  설정 방식 (WebMvcConfig) - (권장)
변환                  시점 입력(Request) 시 변환                      출력(Response) 시 변환
DB 저장 데이터        변환된 데이터 (&lt;script&gt;)                   원본 데이터 (<script>)
데이터 무결성            훼손됨 (원본 데이터 소실)                       유지됨 (원본 데이터 보존)
데이터 재사용성     낮음 (웹이 아닌 다른곳에서 사용 시 불편)    높음 (모바일 앱, 데이터 분석 등 다양한 곳에서 활용 용이)
책임 소재         불명확 (모든 데이터가 변환됨을 가정해야 함)         명확 (출력(View) 계층이 보안을 책임짐)

## 왜 '출력 시 변환'이 더 좋은가?
1. 데이터 무결성
필터 방식은 데이터베이스에 원본이 아닌, 변형된 데이터를 저장합니다. 이는 데이터의 원형을 잃어버리는 결과를 낳습니다.
반면,
출력 시 변환 방식은 DB에 항상 깨끗한 원본 데이터를 보관하므로 데이터 무결성을 지킬 수 있습니다.

2. 데이터 재사용성
만약 DB에 저장된 데이터를 웹페이지가 아닌 모바일 앱이나 데이터 분석 도구로 보내야 한다면 어떻게 될까요?

 - 필터 방식: 모바일 앱은 불필요한 &lt;script&gt; 같은 변환된 데이터를 받게 되어, 이를 다시 원본으로 되돌리는 추가 작업을 해야 할 수 있습니다.

 - 설정 방식: 필요한 곳에서 필요한 만큼만 변환합니다. 웹으로 보낼 땐 HTML을 변환하고, 모바일 앱으로 보낼 땐 원본 그대로 보낼 수 있어 훨씬 유연합니다.

따라서, 데이터의 무결성과 재사용성, 그리고 명확한 책임 분리 측면에서 WebMvcConfig를 통한 '출력 시 변환' 방식이 더 우수하고 현대적인 해결책입니다.


*/

/*

CORS는 "들어오는 요청 주소를 서버가 차단"하는 개념이 아니라, **"서버가 '이 주소는 우리와 통신해도 괜찮다'는 허가증을 응답(Response)에 담아 보내주는"** 개념이기 때문입니다.

---

### ## CORS 동작 방식 (서버와 브라우저의 대화)

CORS는 서버가 아니라 **브라우저**가 보안을 위해 시행하는 정책입니다. 전체 과정은 다음과 같습니다.

1.  **① 브라우저의 사전 요청 (Pre-flight)**
    * 프론트엔드(`http://localhost:3000`)에서 서버(`http://localhost:8080/api/menus`)로 API를 호출합니다.
    * 이때 브라우저는 실제 데이터 요청을 보내기 전에, 먼저 서버로 **"이 주소에서 요청을 보내도 될까요?"** 라는 허락을 구하는 `OPTIONS` 요청을 보냅니다.

2.  **② 서버의 허가 응답 (CORS 정책의 역할)**
    * 서버는 이 `OPTIONS` 요청을 받고, `WebMvcConfig`에 설정된 CORS 정책을 확인합니다.
    * "아, `http://localhost:3000`은 허용된 주소 목록에 있구나. 통신을 허락한다"는 의미로, **응답 헤더(Response Header)에 `Access-Control-Allow-Origin: http://localhost:3000`** 과 같은 허가증을 담아서 브라우저에 보내줍니다.

3.  **③ 브라우저의 최종 결정**
    * 브라우저는 서버로부터 받은 응답에 '허가증'이 포함된 것을 확인하고, 그제야 원래 보내려던 **실제 데이터 요청(GET, POST 등)을 서버로 전송**합니다.
    * 만약 허가증이 없으면, **브라우저 스스로가 요청을 차단**하고 콘솔에 CORS 오류를 표시합니다.

이처럼 CORS 정책의 핵심은 **서버가 응답(출력)에 어떤 허가 헤더를 담아줄지 결정하는 것**이므로, 웹의 요청/응답 설정을 담당하는 `WebMvcConfig`에서 구성하는 것이 올바른 방법입니다.

 */