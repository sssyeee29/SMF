// XSS 공격 패턴을 필터링하는 유틸리티 클래스입니다.
package plant.dev.com.cmm.filter;

import java.util.regex.Pattern;

public class EsxapeFilerPattern {

    // --- 미리 컴파일된 정규 표현식 패턴 ---
    // 모든 패턴은 static final로 선언되어 클래스 로드 시 한 번만 컴파일되며,
    // Pattern.CASE_INSENSITIVE 플래그를 사용하여 대소문자를 구분하지 않습니다.

    /**
     * 완전한 <script>...</script> 블록을 찾습니다.
     */
    protected static final Pattern SCRIPT_FULL_BLOCK_PATTERN = Pattern.compile("<script>(.*?)</script>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    /**
     * 'src' 속성(예: src="malicious.js")을 찾습니다.
     * '=' 주위의 줄 바꿈이나 캐리지 리턴도 처리합니다.
     */
    protected static final Pattern SCRIPT_SRC_ATTRIBUTE_PATTERN = Pattern.compile("src[\\r\\n]*=[\\r\\n]*\\\"(.*?)\\\"", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);

    /**
     * 'on[이벤트명]=' 형태의 이벤트 핸들러를 찾습니다 (예: onclick=, onmouseover=).
     */
    protected static final Pattern SCRIPT_EVENT_HANDLER_PATTERN = Pattern.compile("on[a-z]+\\s*=", Pattern.CASE_INSENSITIVE);

    /**
     * 열리는 <script> 태그를 찾습니다 (속성 포함).
     */
    protected static final Pattern SCRIPT_OPEN_TAG_PATTERN = Pattern.compile("<script(.*?)>", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);

    /**
     * 닫히는 </script> 태그를 찾습니다.
     */
    protected static final Pattern SCRIPT_CLOSE_TAG_PATTERN = Pattern.compile("</script>", Pattern.CASE_INSENSITIVE);

    /**
     * 'eval()' JavaScript 함수 호출을 찾습니다.
     */
    protected static final Pattern JAVASCRIPT_EVAL_PATTERN = Pattern.compile("eval\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);

    /**
     * 'expression()' CSS 함수 호출을 찾습니다.
     */
    protected static final Pattern CSS_EXPRESSION_PATTERN = Pattern.compile("expression\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);

    /**
     * 'javascript:' URI 스키마를 찾습니다.
     */
    protected static final Pattern URI_JAVASCRIPT_SCHEME_PATTERN = Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE);

    /**
     * 'vbscript:' URI 스키마를 찾습니다.
     */
    protected static final Pattern URI_VBSCRIPT_SCHEME_PATTERN = Pattern.compile("vbscript:", Pattern.CASE_INSENSITIVE);

    /**
     * 'alert()' JavaScript 함수 호출을 찾습니다.
     */
    protected static final Pattern JAVASCRIPT_ALERT_PATTERN = Pattern.compile("alert\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);

    /**
     * 'href' 문자열을 찾습니다 (원본 코드의 의도에 따라 처리).
     */
    protected static final Pattern ATTRIBUTE_HREF_PATTERN = Pattern.compile("href", Pattern.CASE_INSENSITIVE);

    /**
     * 'style' 문자열을 찾습니다 (원본 코드의 의도에 따라 처리).
     */
    protected static final Pattern ATTRIBUTE_STYLE_PATTERN = Pattern.compile("style", Pattern.CASE_INSENSITIVE);

    // --- HTML 태그 시작 및 종료를 이스케이프하기 위한 패턴 ---
    // Pattern.CASE_INSENSITIVE 플래그 덕분에 (S|s)와 같은 반복 없이 간결하게 작성 가능합니다.
    protected static final Pattern TAG_SCRIPT_START_PATTERN = Pattern.compile("<script", Pattern.CASE_INSENSITIVE);
    protected static final Pattern TAG_SCRIPT_END_PATTERN = Pattern.compile("</script", Pattern.CASE_INSENSITIVE);
    protected static final Pattern TAG_OBJECT_START_PATTERN = Pattern.compile("<object", Pattern.CASE_INSENSITIVE);
    protected static final Pattern TAG_OBJECT_END_PATTERN = Pattern.compile("</object", Pattern.CASE_INSENSITIVE);
    protected static final Pattern TAG_APPLET_START_PATTERN = Pattern.compile("<applet", Pattern.CASE_INSENSITIVE);
    protected static final Pattern TAG_APPLET_END_PATTERN = Pattern.compile("</applet", Pattern.CASE_INSENSITIVE);
    protected static final Pattern TAG_EMBED_START_PATTERN = Pattern.compile("<embed", Pattern.CASE_INSENSITIVE);
    protected static final Pattern TAG_EMBED_END_PATTERN = Pattern.compile("</embed", Pattern.CASE_INSENSITIVE);
    protected static final Pattern TAG_FORM_START_PATTERN = Pattern.compile("<form", Pattern.CASE_INSENSITIVE);
    protected static final Pattern TAG_FORM_END_PATTERN = Pattern.compile("</form", Pattern.CASE_INSENSITIVE);


    // --- 정화(Sanitization) 메서드 ---

    /**
     * 입력 문자열에서 일반적인 XSS 공격 벡터를 제거하거나 이스케이프하여 정리합니다.
     *
     * @param cleanedValue 정리할 입력 문자열.
     * @return 정리된 문자열.
     */
    public static String esxapeFilerPattern(String cleanedValue){

        // 1단계: 컴파일된 정규식을 사용하여 악성 스크립트 요소 제거 또는 대체
        // 이 대체 작업들은 스크립트 주입 시도를 무력화하는 것을 목표로 합니다.

        // 전체 <script>...</script> 블록 제거
        cleanedValue = SCRIPT_FULL_BLOCK_PATTERN.matcher(cleanedValue).replaceAll("");
        // 'src' 속성 제거 (예: <script src="..."> 에서)
        cleanedValue = SCRIPT_SRC_ATTRIBUTE_PATTERN.matcher(cleanedValue).replaceAll("");
        // 'on[이벤트]=' 속성을 공백으로 대체 (예: 'onclick='가 ' '로 변경)
        cleanedValue = SCRIPT_EVENT_HANDLER_PATTERN.matcher(cleanedValue).replaceAll(" ");
        // 열리는 <script> 태그를 HTML 엔티티로 이스케이프 (&lt;script$1&gt;). $1은 태그 내부 속성 유지.
        cleanedValue = SCRIPT_OPEN_TAG_PATTERN.matcher(cleanedValue).replaceAll("&lt;script$1&gt;");
        // 닫히는 </script> 태그를 HTML 엔티티로 이스케이프
        cleanedValue = SCRIPT_CLOSE_TAG_PATTERN.matcher(cleanedValue).replaceAll("&lt;/script&gt;");
        // 'eval()' 함수 호출 제거
        cleanedValue = JAVASCRIPT_EVAL_PATTERN.matcher(cleanedValue).replaceAll("");
        // 'expression()' 함수 호출 제거
        cleanedValue = CSS_EXPRESSION_PATTERN.matcher(cleanedValue).replaceAll("");
        // 'javascript:' URI 스키마 제거
        cleanedValue = URI_JAVASCRIPT_SCHEME_PATTERN.matcher(cleanedValue).replaceAll("");
        // 'vbscript:' URI 스키마 제거
        cleanedValue = URI_VBSCRIPT_SCHEME_PATTERN.matcher(cleanedValue).replaceAll("");
        // 'alert()' 함수 호출 제거
        cleanedValue = JAVASCRIPT_ALERT_PATTERN.matcher(cleanedValue).replaceAll("");
        // 'href'를 'h_ref'로 대체 (원본 코드의 의도에 따라 의심스러운 경우)
        cleanedValue = ATTRIBUTE_HREF_PATTERN.matcher(cleanedValue).replaceAll("h_ref");
        // 'style'을 's_tyle'로 대체 (원본 코드의 의도에 따라 의심스러운 경우)
        cleanedValue = ATTRIBUTE_STYLE_PATTERN.matcher(cleanedValue).replaceAll("s_tyle");


        // 2단계: 특정 HTML 태그의 시작 및 종료 부분을 HTML 엔티티로 변환
        // 이는 브라우저가 이들을 실제 HTML 태그로 해석하는 것을 방지합니다.
        // 위에 정의된 Pattern 객체들을 활용하여 코드를 더 깔끔하게 만듭니다.

        cleanedValue = TAG_SCRIPT_START_PATTERN.matcher(cleanedValue).replaceAll("&lt;script");
        cleanedValue = TAG_SCRIPT_END_PATTERN.matcher(cleanedValue).replaceAll("&lt;/script");
        cleanedValue = TAG_OBJECT_START_PATTERN.matcher(cleanedValue).replaceAll("&lt;object");
        cleanedValue = TAG_OBJECT_END_PATTERN.matcher(cleanedValue).replaceAll("&lt;/object");
        cleanedValue = TAG_APPLET_START_PATTERN.matcher(cleanedValue).replaceAll("&lt;applet");
        cleanedValue = TAG_APPLET_END_PATTERN.matcher(cleanedValue).replaceAll("&lt;/applet");
        cleanedValue = TAG_EMBED_START_PATTERN.matcher(cleanedValue).replaceAll("&lt;embed");
        cleanedValue = TAG_EMBED_END_PATTERN.matcher(cleanedValue).replaceAll("&lt;/embed");
        cleanedValue = TAG_FORM_START_PATTERN.matcher(cleanedValue).replaceAll("&lt;form");
        cleanedValue = TAG_FORM_END_PATTERN.matcher(cleanedValue).replaceAll("&lt;/form");

        return cleanedValue;
    }
}