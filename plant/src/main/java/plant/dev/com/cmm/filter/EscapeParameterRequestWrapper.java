package plant.dev.com.cmm.filter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import static plant.dev.com.cmm.filter.EsxapeFilerPattern.esxapeFilerPattern;

// 파라미터 값을 XSS로부터 보호하는 HttpServletRequestWrapper입니다.
public class EscapeParameterRequestWrapper extends HttpServletRequestWrapper {

    public EscapeParameterRequestWrapper(HttpServletRequest request) {
        super(request);
    }
    @Override
    public String[] getParameterValues(String parameter) {
        String[] values = super.getParameterValues(parameter);
        if (values == null) {
            return null;
        }

        String[] sanitizedValues = new String[values.length];
        for (int i = 0; i < values.length; i++) {
            sanitizedValues[i] = sanitize(values[i]);
        }
        return sanitizedValues;
    }

    @Override
    public String getParameter(String parameter) {
        String value = super.getParameter(parameter);
        return value == null ? null : sanitize(value);
    }

    private String sanitize(String input) {
        if (input == null) return null;

        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            switch (c) {
                case '<': sb.append("&lt;"); break;
                case '>': sb.append("&gt;"); break;
                case '&': sb.append("&amp;"); break;
                case '"': sb.append("&quot;"); break;
                case '\'': sb.append("&apos;"); break;
                default: sb.append(c); break;
            }
        }
        String cleanedValue = sb.toString();
        // 추가적인 XSS 패턴 제거
        cleanedValue = esxapeFilerPattern(cleanedValue);
        return cleanedValue;
    }
}
