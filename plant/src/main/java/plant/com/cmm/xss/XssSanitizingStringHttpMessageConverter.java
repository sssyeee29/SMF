package plant.com.cmm.xss;

import org.springframework.http.HttpOutputMessage;
import org.springframework.http.converter.StringHttpMessageConverter;
import plant.com.cmm.filter.EsxapeFilerPattern;

import java.io.IOException;

// XSS 방지를 위해 문자열을 안전하게 처리하는 HTTP 메시지 컨버터입니다.
public class XssSanitizingStringHttpMessageConverter extends StringHttpMessageConverter {

    @Override
    protected void writeInternal(String str, HttpOutputMessage outputMessage) throws IOException {
        // 문자열을 클라이언트로 보내기 직전에 XSS 필터링을 적용합니다.
        String sanitizedString = EsxapeFilerPattern.esxapeFilerPattern(str);
        super.writeInternal(sanitizedString, outputMessage);
    }
}