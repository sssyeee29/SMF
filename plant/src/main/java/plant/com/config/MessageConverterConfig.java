// HTTP 메시지 컨버터 관련 설정을 담당하는 클래스입니다.
package plant.com.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import plant.com.cmm.xss.HtmlCharacterEscapes;
import plant.com.cmm.xss.XssSanitizerSerializer;
import plant.com.cmm.xss.XssSanitizingStringHttpMessageConverter;

@Configuration
public class MessageConverterConfig {

    @Bean
    public HttpMessageConverters customHttpMessageConverters() {
        // 1. 보안 ObjectMapper를 생성합니다.
        ObjectMapper secureMapper = new ObjectMapper();

        // --- 수정된 부분 시작 ---
        // Java 8의 날짜/시간 타입(LocalDateTime 등)을 올바르게 변환하기 위해 JavaTimeModule을 등록합니다.
        secureMapper.registerModule(new JavaTimeModule());
        // 날짜를 숫자(타임스탬프)가 아닌, 표준 문자열(ISO-8601) 형식으로 변환하도록 설정합니다.
        secureMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // --- 수정된 부분 끝 ---

        // Serializer 모듈 등록 (eval, onclick 등 패턴 필터링)
        SimpleModule xssModule = new SimpleModule();
        xssModule.addSerializer(String.class, new XssSanitizerSerializer());
        secureMapper.registerModule(xssModule);

        // CharacterEscapes 등록 (<, > 등 특수문자 치환)
        secureMapper.getFactory().setCharacterEscapes(new HtmlCharacterEscapes());

        // 2. 이 ObjectMapper를 사용하는 JSON 컨버터를 생성합니다.
        MappingJackson2HttpMessageConverter jsonConverter = new MappingJackson2HttpMessageConverter(secureMapper);

        // String 전용 변환기를 생성합니다.
        // 이거 쓰지 말고 return Map.of("data", "<script>alert('공격')</script>"); 이런식으로 할까
        HttpMessageConverter<?> stringConverter = new XssSanitizingStringHttpMessageConverter();

        // 3. 이 컨버터를 유일한 컨버터로 등록하여, Spring Boot가 반드시 사용하도록 강제합니다.
        return new HttpMessageConverters(jsonConverter,stringConverter);
    }
}


/*

    @Bean
    public HttpMessageConverters customHttpMessageConverters() {
        // 1. 테스트에서 성공했던 보안 ObjectMapper를 그대로 생성합니다.
        ObjectMapper secureMapper = new ObjectMapper();

        // Serializer 모듈 등록 (eval, onclick 등 패턴 필터링)
        SimpleModule xssModule = new SimpleModule();
        xssModule.addSerializer(String.class, new XssSanitizerSerializer());
        secureMapper.registerModule(xssModule);

        // CharacterEscapes 등록 (<, > 등 특수문자 치환)
        secureMapper.getFactory().setCharacterEscapes(new HtmlCharacterEscapes());

        // 2. 이 ObjectMapper를 사용하는 JSON 컨버터를 생성합니다.
        MappingJackson2HttpMessageConverter jsonConverter = new MappingJackson2HttpMessageConverter(secureMapper);

        // String 전용 변환기를 생성합니다.
        // 이거 쓰지 말고 return Map.of("data", "<script>alert('공격')</script>"); 이런식으로 할까
        HttpMessageConverter<?> stringConverter = new XssSanitizingStringHttpMessageConverter();

        // 3. 이 컨버터를 유일한 컨버터로 등록하여, Spring Boot가 반드시 사용하도록 강제합니다.
        return new HttpMessageConverters(jsonConverter);
    }







    @Bean
    public HttpMessageConverters customHttpMessageConverters() {
        // 1. 보안 ObjectMapper를 생성합니다.
        ObjectMapper secureMapper = new ObjectMapper();

        // --- 수정된 부분 시작 ---
        // Java 8의 날짜/시간 타입(LocalDateTime 등)을 올바르게 변환하기 위해 JavaTimeModule을 등록합니다.
        secureMapper.registerModule(new JavaTimeModule());
        // 날짜를 숫자(타임스탬프)가 아닌, 표준 문자열(ISO-8601) 형식으로 변환하도록 설정합니다.
        secureMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // --- 수정된 부분 끝 ---

        // Serializer 모듈 등록 (eval, onclick 등 패턴 필터링)
        SimpleModule xssModule = new SimpleModule();
        xssModule.addSerializer(String.class, new XssSanitizerSerializer());
        secureMapper.registerModule(xssModule);

        // CharacterEscapes 등록 (<, > 등 특수문자 치환)
        secureMapper.getFactory().setCharacterEscapes(new HtmlCharacterEscapes());

        // 2. 이 ObjectMapper를 사용하는 JSON 컨버터를 생성합니다.
        MappingJackson2HttpMessageConverter jsonConverter = new MappingJackson2HttpMessageConverter(secureMapper);

        // String 전용 변환기를 생성합니다.
        // 이거 쓰지 말고 return Map.of("data", "<script>alert('공격')</script>"); 이런식으로 할까
        HttpMessageConverter<?> stringConverter = new XssSanitizingStringHttpMessageConverter();

        // 3. 이 컨버터를 유일한 컨버터로 등록하여, Spring Boot가 반드시 사용하도록 강제합니다.
        return new HttpMessageConverters(jsonConverter,stringConverter);
    }

 */
