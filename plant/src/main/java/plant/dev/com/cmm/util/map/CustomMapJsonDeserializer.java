package plant.dev.com.cmm.util.map;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

// CustomMap 객체의 JSON 역직렬화를 지원하는 클래스입니다.
@Slf4j
public class CustomMapJsonDeserializer extends JsonDeserializer<CustomMap> {

    @Override
    public CustomMap deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException, JacksonException {


        // 1. 현재 JsonParser에서 ObjectMapper 인스턴스를 가져옵니다.
        //    이는 중첩된 객체나 배열을 재귀적으로 역직렬화할 때 필요합니다.
        ObjectMapper mapper = (ObjectMapper) jp.getCodec();

        // 2. 현재 JSON을 JSON Tree 구조(JsonNode)로 읽어들입니다.
        //    이를 통해 JSON 객체의 필드를 순회하고 각 값의 타입을 확인할 수 있습니다.
        JsonNode node = jp.getCodec().readTree(jp);

        // 3. 역직렬화된 데이터를 담을 새로운 CustomMap 인스턴스를 생성합니다.
        CustomMap result = new CustomMap();

        // 4. JSON 객체의 모든 필드(키-값 쌍)를 순회합니다.
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            String key = field.getKey();        // 현재 필드의 키 (String)
            JsonNode valueNode = field.getValue(); // 현재 필드의 값 (JsonNode)
            Object value; // 실제 자바 객체로 변환될 값

            // 5. valueNode의 타입에 따라 다르게 처리하여 XSS 방어를 적용합니다.
            if (valueNode.isTextual()) {
                value = valueNode.asText();
            } else if (valueNode.isObject()) {
                // 값이 중첩된 JSON 객체인 경우:
                // 재귀적으로 `deserialize` 메서드를 호출하여 CustomMap으로 변환합니다.
                // `valueNode.traverse(mapper)`는 해당 JsonNode를 새로운 JsonParser로 변환하여,
                // 재귀 호출이 독립적인 파싱 스트림을 가질 수 있게 합니다.
                value = deserialize(valueNode.traverse(mapper), ctxt);
            } else if (valueNode.isArray()) {
                // 값이 JSON 배열인 경우:
                List<Object> list = new ArrayList<>();
                for (JsonNode element : valueNode) { // 배열의 각 요소를 순회
                    if (element.isTextual()) {
                        // 배열 내 요소가 문자열인 경우 XSS 방어 로직 적용
                        list.add(element.asText());
                    } else if (element.isObject()) {
                        // 배열 내 요소가 객체인 경우 재귀적으로 CustomMap으로 변환
                        list.add(deserialize(element.traverse(mapper), ctxt));
                    } else {
                        // 배열 내 다른 타입 (숫자, 불리언 등)은 ObjectMapper의 기본 변환 사용
                        list.add(mapper.treeToValue(element, Object.class));
                    }
                }
                value = list; // 처리된 리스트를 값으로 설정
            } else {
                // 값이 숫자, 불리언, null 등 다른 기본 JSON 타입인 경우:
                // ObjectMapper의 기본 변환 기능을 사용하여 자바 객체로 변환합니다.
                value = mapper.treeToValue(valueNode, Object.class);
            }
            // 6. XSS 처리가 완료된 (또는 변환된) 키와 값을 `CustomMap`에 추가합니다.
            //    `CustomMap`의 `put` 메서드는 키 대소문자 처리 및 중복 키 제거 로직을 가지고 있습니다.
            result.put(key, value);
        }
        return result; // 최종적으로 완성된 CustomMap 객체를 반환
    }

}
