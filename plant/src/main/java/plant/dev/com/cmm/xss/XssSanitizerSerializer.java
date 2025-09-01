// XSS 방지를 위해 문자열을 안전하게 JSON으로 직렬화하는 클래스입니다.
package plant.dev.com.cmm.xss;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import plant.dev.com.cmm.filter.EsxapeFilerPattern;

import java.io.IOException;

public class XssSanitizerSerializer extends JsonSerializer<String> {

    @Override
    public void serialize(String value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value != null) {
            // EsxapeFilerPattern의 정규식 필터링을 적용합니다.
            String sanitized = EsxapeFilerPattern.esxapeFilerPattern(value);
            gen.writeString(sanitized);
        }
    }
}
