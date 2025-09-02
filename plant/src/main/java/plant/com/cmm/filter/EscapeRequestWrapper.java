package plant.com.cmm.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.util.Iterator;
import java.util.Map;
import java.util.stream.Collectors;

import static plant.com.cmm.filter.EsxapeFilerPattern.esxapeFilerPattern;

// JSON 요청 본문을 XSS로부터 보호하는 HttpServletRequestWrapper입니다.
public class EscapeRequestWrapper extends HttpServletRequestWrapper {

    private final String sanitizedBody; // 필터링된 JSON 본문을 저장
    private static final ObjectMapper objectMapper = new ObjectMapper(); // JSON 처리 도구



    /**
     * 생성자: 원본 HttpServletRequest를 받아 JSON 본문을 필터링 처리
     */
    public EscapeRequestWrapper(HttpServletRequest request) {
        super(request);
        try {
            // Request Body(JSON)를 문자열로 읽어오기
            String body = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));

            // JSON 문자열 필터링 (특수문자 이스케이프)
            this.sanitizedBody = sanitizeJson(body);
        } catch (IOException e) {
            // JSON 파싱 오류 시 런타임 예외 발생
            throw new RuntimeException("요청 본문을 읽거나 확인을 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * JSON 문자열을 파싱하고, 재귀적으로 모든 텍스트 노드를 이스케이프 처리
     */
    private String sanitizeJson(String jsonInput) throws IOException {
        if (jsonInput == null || jsonInput.trim().isEmpty()) {
            return jsonInput; // 입력이 비어 있으면 그대로 반환
        }

        JsonNode rootNode = objectMapper.readTree(jsonInput); // JSON 파싱
        rootNode = sanitizeJsonNode(rootNode); // 재귀적으로 이스케이프 처리
        return objectMapper.writeValueAsString(rootNode); // 다시 JSON 문자열로 변환
    }

    /**
     * JSON 트리를 재귀적으로 순회하며 텍스트 값을 이스케이프 처리
     */
    private JsonNode sanitizeJsonNode(JsonNode node) {
        if (node.isObject()) {
            // JSON 객체일 경우 각 필드를 순회
            ObjectNode objectNode = (ObjectNode) node;
            Iterator<Map.Entry<String, JsonNode>> fields = objectNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                JsonNode originalValue = field.getValue();
                JsonNode sanitizedValue = sanitizeJsonNode(originalValue); // 재귀 호출
                if (originalValue != sanitizedValue) {
                    objectNode.replace(field.getKey(), sanitizedValue); // 변경된 값 반영
                }
            }
            return objectNode;
        } else if (node.isArray()) {
            // JSON 배열일 경우 각 요소를 순회
            ArrayNode arrayNode = (ArrayNode) node;
            for (int i = 0; i < arrayNode.size(); i++) {
                JsonNode originalElement = arrayNode.get(i);
                JsonNode sanitizedElement = sanitizeJsonNode(originalElement); // 재귀 호출
                if (originalElement != sanitizedElement) {
                    arrayNode.set(i, sanitizedElement); // 변경된 값 반영
                }
            }
            return arrayNode;
        } else if (node.isTextual()) {
            // 텍스트 노드일 경우 이스케이프 처리
            String originalText = node.asText();
            String sanitizedText = sanitizeHtml(originalText);
            if (!originalText.equals(sanitizedText)) {
                return new TextNode(sanitizedText); // 새로운 텍스트 노드로 교체
            } else {
                return node; // 변경 없으면 기존 노드 그대로
            }
        }
        return node; // 그 외의 경우 (숫자, 불리언 등)은 그대로 반환
    }


    /**
     * HTML 특수문자를 이스케이프 처리
     */
    private String sanitizeHtml(String input) {
        if (input == null) return null;

        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            switch (c) {
                case '<': sb.append("&lt;"); break;      // <
                case '>': sb.append("&gt;"); break;      // >
                case '&': sb.append("&amp;"); break;     // &
                case '"': sb.append("&quot;"); break;    // "
                case '\'': sb.append("&apos;"); break;   // '
                default: sb.append(c); break;            // 그 외는 그대로
            }
        }
        String cleanedValue = sb.toString();
        // 추가적인 XSS 패턴 제거
        cleanedValue = esxapeFilerPattern(cleanedValue);
        return cleanedValue;
    }

    /**
     * 필터링된 JSON 본문을 BufferedReader로 제공
     */
    @Override
    public BufferedReader getReader() throws IOException {
        return new BufferedReader(new StringReader(sanitizedBody));
    }

    /**
     * 필터링된 JSON 본문을 ServletInputStream으로 제공
     */
    @Override
    public ServletInputStream getInputStream() throws IOException {
        final byte[] bytes = sanitizedBody.getBytes(getCharacterEncoding() != null ? getCharacterEncoding() : "UTF-8");

        return new ServletInputStream() {
            private int lastIndexRetrieved = -1;

            @Override
            public int read() {
                if (++lastIndexRetrieved < bytes.length) {
                    return bytes[lastIndexRetrieved];
                } else {
                    return -1; // EOF
                }
            }

            @Override
            public boolean isFinished() {
                return lastIndexRetrieved >= bytes.length - 1;
            }

            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setReadListener(ReadListener readListener) {
                // 비동기 처리 필요 없으므로 구현하지 않음
            }
        };
    }
}
