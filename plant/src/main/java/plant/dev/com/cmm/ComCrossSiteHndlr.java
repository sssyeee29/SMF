package plant.dev.com.cmm;

import jakarta.servlet.jsp.JspException;
import jakarta.servlet.jsp.JspWriter;
import jakarta.servlet.jsp.PageContext;
import jakarta.servlet.jsp.tagext.BodyTagSupport;

import java.io.IOException;
import java.io.Reader;

// 이 클래스는 JSP (JavaServer Pages) 환경에서 크로스 사이트 스크립팅(XSS) 공격을 방지하기 위해 사용되는 커스텀 태그 핸들러입니다.
// BodyTagSupport를 상속받아 JSP 페이지의 내용(body)을 처리할 수 있습니다.
public class ComCrossSiteHndlr extends BodyTagSupport {

    // HTML/XML 특수 문자의 아스키 값 중 가장 높은 값을 정의합니다.
    public static final int HIGHEST_SPECIAL = '>';

    // 특수 문자들을 HTML 엔티티로 변환하기 위한 맵입니다.
    // 각 인덱스는 문자의 아스키 값에 해당하며, 값은 해당 문자의 HTML 엔티티 표현입니다.
    public static char[][] specialCharactersRepresentation = new char[HIGHEST_SPECIAL + 1][];
    static {
        // '&' 문자를 "&amp;"로 변환합니다.
        specialCharactersRepresentation['&'] = "&amp;".toCharArray();
        // '<' 문자를 "&lt;"로 변환합니다.
        specialCharactersRepresentation['<'] = "&lt;".toCharArray();
        // '>' 문자를 "&gt;"로 변환합니다.
        specialCharactersRepresentation['"'] = "&#034;".toCharArray(); // 따옴표(")를 &#034;로 변환합니다.
        specialCharactersRepresentation['\''] = "&#039;".toCharArray(); // 작은따옴표(')를 &#039;로 변환합니다.
    }

    /*
     * (이 태그에 이름을 붙이는 데 많은 어려움이 있었던 점을 고려하면, XML과 JSP가 "익명 태그"를 지원했더라면 좋았을 것이라는 생각도 듭니다!) :-) - sb
     */

    // *********************************************************************
    // 내부 상태 변수들

    private static final long serialVersionUID = -6750233818675360686L; // 직렬화를 위한 고유 ID
    protected Object value; // JSP 태그의 'value' 속성 (출력할 값)
    protected String def; // JSP 태그의 'default' 속성 (value가 없을 때 사용할 기본값)
    protected boolean escapeXml; // JSP 태그의 'escapeXml' 속성 (XML/HTML 특수 문자를 이스케이프할지 여부)
    private boolean needBody; // 태그의 바디(body) 내용이 필요한지 여부를 나타내는 플래그

    // *********************************************************************
    // 생성 및 초기화

    // 추가적으로 이스케이프할 문자들을 정의한 문자열입니다.
    // 여기에는 괄호, 대괄호, 중괄호, 따옴표, 콜론, 세미콜론, 등호, 공백, 탭, 캐리지 리턴, 개행, 퍼센트, 느낌표, 더하기, 빼기 등이 포함됩니다.
    private String m_sDiffChar ="()[]{}\"',:;= \t\r\n%!+-";
    // 위 m_sDiffChar에 해당하는 문자들을 HTML 엔티티로 변환한 문자열 배열입니다.
    private String m_sArrDiffChar [] = {
            "&#40;","&#41;", // ( )
            "&#91;","&#93;", // [ ]
            "&#123;","&#125;", // { }
            "&#34;","&#39;", // " '
            "&#44;","&#58;", // , :
            "&#59;","&#61;", // ; =
            " ","\t", // 공백, 탭 (공백과 탭은 별도의 HTML 엔티티 없이 그대로 사용되지만, 배열 구조상 포함됨)
            "\r","\n", // 캐리지 리턴, 개행 (마찬가지로 그대로 사용됨)
            "&#37;","&#33;", // % !
            "&#43;","&#45;"  // + -
    };

    /**
     * 새로운 핸들러 객체를 생성합니다. TagSupport와 마찬가지로, 서브클래스는 다른 생성자를 제공해서는 안 되며,
     * 슈퍼클래스 생성자를 호출해야 합니다.
     */
    public ComCrossSiteHndlr() {
        super();
        init(); // 객체 초기화 메서드 호출
    }

    // 로컬 상태 변수들을 초기화합니다.
    private void init() {
        value = def = null; // value와 def를 null로 초기화
        escapeXml = true; // escapeXml은 기본적으로 true로 설정
        needBody = false; // needBody는 false로 초기화
    }

    // 이 핸들러가 사용하던 리소스(존재한다면)를 해제합니다.
    @Override
    public void release() {
        super.release(); // 상위 클래스의 release 메서드 호출
        init(); // 로컬 상태 변수 재초기화
    }

    // *********************************************************************
    // 태그 로직

    // 'value' 속성을 평가하고 바디(body)를 평가할지 여부를 결정합니다.
    @Override
    public int doStartTag() throws JspException {

        needBody = false; // 'default'와 관련된 상태를 재설정합니다.
        this.bodyContent = null; // 바디 내용(body)을 초기화합니다 (컨테이너가 태그 핸들러를 풀링하는 경우를 대비).

        JspWriter out = pageContext.getOut(); // JSP 페이지의 출력 라이터(writer)를 가져옵니다.
        // log.debug("ComCrossSiteFilter> ============================"); // 디버그 로그 (주석 처리됨)
        try {
            // 'value' 속성이 존재하면 해당 값을 출력하고, 그렇지 않으면 'default' 속성을 시도합니다.
            if (value != null) {
                // log.debug("ComCrossSiteFilter> =value"); // 디버그 로그 (주석 처리됨)
                String sWriteEscapedXml = getWriteEscapedXml(); // value 값을 이스케이프 처리하여 가져옵니다.
                // log.debug("ComCrossSiteFilter sWriteEscapedXml>" + sWriteEscapedXml); // 디버그 로그 (주석 처리됨)
                out.print(sWriteEscapedXml); // 이스케이프된 값을 JSP 페이지에 출력합니다.
                return SKIP_BODY; // 태그 바디는 건너뛰고 태그 처리를 계속합니다.
            } else {
                // 'default' 속성이 없으면, 바디 내용을 평가해야 합니다.
                if (def == null) {
                    needBody = true; // 바디 내용이 필요하다고 설정합니다.
                    return EVAL_BODY_BUFFERED; // 바디 내용을 버퍼에 저장하도록 지시합니다.
                }

                // log.debug("ComCrossSiteFilter def> ="+def); // 디버그 로그 (주석 처리됨)

                // 'default' 속성이 있으면, 해당 값을 출력합니다.
                else {
                    // 유효한 'default' 값이 존재합니다.
                    out(pageContext, escapeXml, def); // default 값을 이스케이프 여부에 따라 출력합니다.
                    // log.debug("ComCrossSiteFilter> ="+def); // 디버그 로그 (주석 처리됨)
                }
                return SKIP_BODY; // 태그 바디는 건너뛰고 태그 처리를 계속합니다.
            }
        } catch (IOException ex) {
            // 입출력 예외 발생 시 JspException으로 래핑하여 다시 던집니다.
            throw new JspException(ex.toString(), ex);
        }
    }

    // 필요한 경우 바디 내용을 출력하고, 에러를 보고합니다.
    @Override
    public int doEndTag() throws JspException {
        try {
            // log.debug("ComCrossSiteFilter ==== doEndTag"); // 디버그 로그 (주석 처리됨)
            if (!needBody){
                return EVAL_PAGE; // 더 이상 할 일이 없으므로 페이지 평가를 계속합니다.
            }

            // 바디 내용을 가져와 공백을 제거한 후 출력합니다.
            if (bodyContent != null && bodyContent.getString() != null){
                // String sWriteEscapedXml = getWriteEscapedXml(); // 이 부분은 주석 처리되어 사용되지 않습니다.
                // out2(pageContext, escapeXml, sWriteEscapedXml.toString()); // 이 부분도 주석 처리되어 사용되지 않습니다.
                // log.debug("ComCrossSiteFilter> end"); // 디버그 로그 (주석 처리됨)
                // log.debug("ComCrossSiteFilter sWriteEscapedXml > sWriteEscapedXml"); // 디버그 로그 (주석 처리됨)
                out(pageContext, escapeXml, bodyContent.getString().trim()); // 바디 내용을 공백 제거 후 이스케이프 여부에 따라 출력합니다.

            }
            return EVAL_PAGE; // 페이지 평가를 계속합니다.
        } catch (IOException ex) {
            // 입출력 예외 발생 시 JspException으로 래핑하여 다시 던집니다.
            throw new JspException(ex.toString(), ex);
        }
    }

    // *********************************************************************
    // 공개 유틸리티 메서드

    /**
     * <tt>text</tt>를 <tt>pageContext</tt>의 현재 JspWriter에 출력합니다.
     * <tt>escapeXml</tt>이 true인 경우, XML/HTML 페이지로의 출력을 용이하게 하기 위해 다음 문자열 치환을 수행합니다:
     *
     * & -> &amp;
     * < -> &lt;
     * > -> &gt;
     * " -> &#034;
     * ' -> &#039;
     *
     * Util.escapeXml()도 참조하세요. (이 주석은 원래 JavaDoc에서 온 것으로 보이며, Util.escapeXml()은 현재 코드에 직접 포함되어 있지 않습니다.)
     *
     * @param pageContext 현재 JSP 페이지의 PageContext
     * @param escapeXml XML/HTML 특수 문자를 이스케이프할지 여부
     * @param obj 출력할 객체 (문자열 또는 Reader)
     * @throws IOException 입출력 오류 발생 시
     */
    public static void out(PageContext pageContext, boolean escapeXml,
                           Object obj) throws IOException {
        JspWriter w = pageContext.getOut(); // 출력 라이터를 가져옵니다.

        if (!escapeXml) {
            // XML 이스케이프가 필요 없으면, 문자를 그대로 출력합니다.
            if (obj instanceof Reader) {
                // 객체가 Reader 타입이면, 버퍼를 사용하여 읽고 씁니다.
                Reader reader = (Reader) obj;
                char[] buf = new char[4096]; // 4KB 버퍼
                int count;
                while ((count = reader.read(buf, 0, 4096)) != -1) { // 버퍼에 읽을 내용이 없을 때까지 반복
                    w.write(buf, 0, count); // 읽은 만큼 JspWriter에 씁니다.
                }
            } else {
                // Reader 타입이 아니면, toString() 결과를 그대로 씁니다.
                w.write(obj.toString());
            }
        } else {
            // XML 이스케이프가 필요한 경우
            if (obj instanceof Reader) {
                // 객체가 Reader 타입이면, 버퍼를 사용하여 읽고 이스케이프하여 씁니다.
                Reader reader = (Reader) obj;
                char[] buf = new char[4096];
                int count;
                while ((count = reader.read(buf, 0, 4096)) != -1) {
                    writeEscapedXml(buf, count, w); // 읽은 내용을 이스케이프하여 씁니다.
                }
            } else {
                // Reader 타입이 아니면, toString() 결과를 이스케이프하여 씁니다.
                String text = obj.toString();
                writeEscapedXml(text.toCharArray(), text.length(), w); // 문자열을 char 배열로 변환하여 이스케이프하여 씁니다.
            }
        }
    }

    /**
     * 주어진 객체를 그대로 JspWriter에 출력하는 유틸리티 메서드입니다. (이스케이프하지 않음)
     * out() 메서드와 달리 escapeXml 매개변수가 있지만 실제 이스케이프 로직을 수행하지 않습니다.
     *
     * @param pageContext 현재 JSP 페이지의 PageContext
     * @param escapeXml 이스케이프 여부 (이 메서드에서는 사용되지 않음)
     * @param obj 출력할 객체
     * @throws IOException 입출력 오류 발생 시
     */
    public static void out2(PageContext pageContext, boolean escapeXml,
                            Object obj) throws IOException {
        JspWriter w = pageContext.getOut(); // 출력 라이터를 가져옵니다.

        w.write(obj.toString()); // 객체의 toString() 결과를 그대로 출력합니다.
    }

    /**
     * 추가적인 객체 생성을 피하고 JspWriter에 직접 블록 단위로 이스케이프된/이스케이프되지 않은 문자를 사용하여
     * 최적화된 방식으로 XML 이스케이프된 문자를 작성합니다.
     *
     * @param buffer 출력할 문자 데이터가 포함된 char 배열
     * @param length 버퍼에서 처리할 유효한 문자의 길이
     * @param w 데이터를 쓸 JspWriter 객체
     * @throws IOException 입출력 오류 발생 시
     */
    private static void writeEscapedXml(char[] buffer, int length, JspWriter w)
            throws IOException {
        int start = 0; // 이스케이프되지 않은 문자열의 시작 인덱스

        for (int i = 0; i < length; i++) {
            char c = buffer[i]; // 현재 문자
            if (c <= HIGHEST_SPECIAL) { // 현재 문자가 특수 문자 범위 내에 있는지 확인
                char[] escaped = specialCharactersRepresentation[c]; // 해당 문자의 HTML 엔티티 표현을 가져옵니다.
                if (escaped != null) { // HTML 엔티티 표현이 존재하면 (특수 문자이면)
                    // 이스케이프되지 않은 부분(start에서 현재 위치 i까지)을 먼저 씁니다.
                    if (start < i) {
                        w.write(buffer, start, i - start);
                    }
                    // 이스케이프된 XML 엔티티를 씁니다.
                    w.write(escaped);
                    start = i + 1; // 다음 이스케이프되지 않은 부분의 시작 인덱스를 업데이트합니다.
                }
            }
        }
        // 남아있는 이스케이프되지 않은 부분(start에서 length 끝까지)을 씁니다.
        if (start < length) {
            w.write(buffer, start, length - start);
        }
    }

    /**
     * 태그의 'value' 속성에 설정된 값을 가져와서 크로스 사이트 스크립팅 방지를 위해 이스케이프 처리된 문자열을 반환합니다.
     * 이 메서드는 {@code m_sDiffChar} 및 {@code specialCharactersRepresentation}을 사용하여 문자열을 변환합니다.
     *
     * @return 이스케이프 처리된 문자열
     * @throws IOException 입출력 오류 발생 시 (메서드 시그니처에 포함되었으나 실제 구현에서는 IOException을 발생시키지 않음)
     */
    @SuppressWarnings("unused") // 사용되지 않을 수도 있음을 나타내는 경고 억제 어노테이션
    private String getWriteEscapedXml_old() throws IOException {
        String sRtn = ""; // 반환할 결과 문자열

        Object obj = this.value; // 현재 태그의 'value' 속성 값

        // int start = 0; // 이 변수는 현재 로직에서는 사용되지 않습니다.
        String text = obj.toString(); // value 값을 문자열로 변환

        int length = text.length(); // 문자열의 길이
        char[] buffer = text.toCharArray(); // 문자열을 char 배열로 변환
        boolean booleanDiff = false; // m_sDiffChar에 해당하는 문자인지 여부를 나타내는 플래그

        char[] cDiffChar =  this.m_sDiffChar.toCharArray(); // 추가 이스케이프 대상 문자 배열

        for(int i = 0; i < length; i++) { // 문자열의 각 문자를 순회
            char c = buffer[i]; // 현재 문자

            booleanDiff = false; // 각 문자마다 초기화

            // m_sDiffChar에 해당하는 문자인지 확인하고, 해당하면 m_sArrDiffChar의 값으로 변환하여 sRtn에 추가합니다.
            for(int k = 0; k < cDiffChar.length; k++){
                if(c == cDiffChar[k]){
                    sRtn = sRtn + m_sArrDiffChar[k]; // 변환된 HTML 엔티티 추가
                    booleanDiff = true; // m_sDiffChar에 해당하는 문자임을 표시
                    continue; // 다음 문자로 넘어갑니다.
                }
            }

            if(booleanDiff) continue; // m_sDiffChar에 해당하는 문자였으면 다음 루프 스킵

            // 일반적인 HTML/XML 특수 문자인지 확인하고 변환합니다.
            if (c <= HIGHEST_SPECIAL) { // 특수 문자 범위 내에 있는지 확인
                char[] escaped = specialCharactersRepresentation[c]; // 해당 문자의 HTML 엔티티 표현을 가져옵니다.
                if (escaped != null) { // HTML 엔티티 표현이 존재하면 (특수 문자이면)
                    // 이스케이프된 XML 엔티티를 문자 단위로 sRtn에 추가합니다.
                    for (int j = 0; j < escaped.length; j++) {
                        sRtn = sRtn + escaped[j];
                    }
                    // start = i + 1; // 이 변수는 현재 로직에서는 사용되지 않습니다.
                } else {
                    // specialCharactersRepresentation에 정의되지 않은 일반 문자이면 그대로 추가합니다.
                    sRtn = sRtn + c;
                }
            } else {
                // 특수 문자 범위 밖의 일반 문자이면 그대로 추가합니다.
                sRtn = sRtn + c;
            }
        }

        return sRtn; // 최종 이스케이프 처리된 문자열 반환
    }

    private String getWriteEscapedXml() throws IOException {
        // StringBuilder를 사용하여 문자열을 효율적으로 구성합니다.
        StringBuilder sRtn = new StringBuilder();

        Object obj = this.value;
        String text = obj.toString();

        int length = text.length();
        char[] buffer = text.toCharArray();
        boolean booleanDiff = false;

        char[] cDiffChar = this.m_sDiffChar.toCharArray();

        for (int i = 0; i < length; i++) {
            char c = buffer[i];
            booleanDiff = false;

            // m_sDiffChar에 해당하는 문자인지 확인하고 변환합니다.
            for (int k = 0; k < cDiffChar.length; k++) {
                if (c == cDiffChar[k]) {
                    // sRtn = sRtn + ... 대신 append()를 사용합니다.
                    sRtn.append(m_sArrDiffChar[k]);
                    booleanDiff = true;
                    break; // 일치하는 문자를 찾았으므로 내부 루프를 중단합니다.
                }
            }

            if (booleanDiff) continue;

            // 일반적인 HTML/XML 특수 문자인지 확인하고 변환합니다.
            if (c <= HIGHEST_SPECIAL) {
                char[] escaped = specialCharactersRepresentation[c];
                if (escaped != null) {
                    // 이스케이프된 char 배열 전체를 한 번에 append 합니다.
                    sRtn.append(escaped);
                } else {
                    // 일반 문자를 append 합니다.
                    sRtn.append(c);
                }
            } else {
                // 특수 문자 범위 밖의 일반 문자를 append 합니다.
                sRtn.append(c);
            }
        }

        // 최종적으로 완성된 문자열을 반환합니다.
        return sRtn.toString();
    }

    /**
     * 주어진 문자열을 가져와서 크로스 사이트 스크립팅 방지를 위해 이스케이프 처리된 문자열을 반환합니다.
     * 이 메서드는 {@code m_sDiffChar} 및 {@code specialCharactersRepresentation}을 사용하여 문자열을 변환합니다.
     * 이스케이프 로직은 {@code getWriteEscapedXml()} (매개변수 없는 버전)과 동일합니다.
     *
     * @param sWriteString 이스케이프 처리할 입력 문자열
     * @return 이스케이프 처리된 문자열
     * @throws IOException 입출력 오류 발생 시 (메서드 시그니처에 포함되었으나 실제 구현에서는 IOException을 발생시키지 않음)
     */
    @SuppressWarnings("unused") // 사용되지 않을 수도 있음을 나타내는 경고 억제 어노테이션
    private String getWriteEscapedXml(String sWriteString) throws IOException {

        String sRtn = ""; // 반환할 결과 문자열

        Object obj = sWriteString; // 입력 문자열을 Object로 래핑

        // int start = 0; // 이 변수는 현재 로직에서는 사용되지 않습니다.
        String text = obj.toString(); // 입력 문자열

        int length = text.length(); // 문자열의 길이
        char[] buffer = text.toCharArray(); // 문자열을 char 배열로 변환
        boolean booleanDiff = false; // m_sDiffChar에 해당하는 문자인지 여부를 나타내는 플래그

        char[] cDiffChar =  this.m_sDiffChar.toCharArray(); // 추가 이스케이프 대상 문자 배열

        for(int i = 0; i < length; i++) { // 문자열의 각 문자를 순회
            char c = buffer[i]; // 현재 문자

            booleanDiff = false; // 각 문자마다 초기화

            // m_sDiffChar에 해당하는 문자인지 확인하고, 해당하면 m_sArrDiffChar의 값으로 변환하여 sRtn에 추가합니다.
            for(int k = 0; k < cDiffChar.length; k++){
                if(c == cDiffChar[k]){
                    sRtn = sRtn + m_sArrDiffChar[k]; // 변환된 HTML 엔티티 추가
                    booleanDiff = true; // m_sDiffChar에 해당하는 문자임을 표시
                    continue; // 다음 문자로 넘어갑니다.
                }
            }

            if(booleanDiff) continue; // m_sDiffChar에 해당하는 문자였으면 다음 루프 스킵

            // 일반적인 HTML/XML 특수 문자인지 확인하고 변환합니다.
            if (c <= HIGHEST_SPECIAL) { // 특수 문자 범위 내에 있는지 확인
                char[] escaped = specialCharactersRepresentation[c]; // 해당 문자의 HTML 엔티티 표현을 가져옵니다.
                if (escaped != null) { // HTML 엔티티 표현이 존재하면 (특수 문자이면)
                    // 이스케이프된 XML 엔티티를 문자 단위로 sRtn에 추가합니다.
                    for (int j = 0; j < escaped.length; j++) {
                        sRtn = sRtn + escaped[j];
                    }
                    // start = i + 1; // 이 변수는 현재 로직에서는 사용되지 않습니다.
                } else {
                    // specialCharactersRepresentation에 정의되지 않은 일반 문자이면 그대로 추가합니다.
                    sRtn = sRtn + c;
                }
            } else {
                // 특수 문자 범위 밖의 일반 문자이면 그대로 추가합니다.
                sRtn = sRtn + c;
            }
        }

        return sRtn; // 최종 이스케이프 처리된 문자열 반환
    }

    // 태그 속성 'value'를 설정하는 메서드입니다.
    public void setValue(Object value) {
        this.value = value;
    }

    // 태그 속성 'default'를 설정하는 메서드입니다.
    public void setDefault(String def) {
        this.def = def;
    }

    // 태그 속성 'escapeXml'을 설정하는 메서드입니다.
    public void setEscapeXml(boolean escapeXml) {
        this.escapeXml = escapeXml;
    }
    /*
    // main 메서드는 이 클래스가 독립적으로 실행될 때 테스트용으로 사용됩니다.
    public static void main(String[] args) throws IOException
    {

        ComCrossSiteHndlr ComCrossSiteHndlr = new ComCrossSiteHndlr();

        ComCrossSiteHndlr.value = "TRNSMIT"; // 테스트 값을 설정합니다.

        String sCrossSiteHndlr = ComCrossSiteHndlr.getWriteEscapedXml(); // 이스케이프된 값을 가져옵니다.
        // log.debug("writeEscapedXml " + ComCrossSiteHndlr.getWriteEscapedXml()); // 디버그 로그 (주석 처리됨)

        log.debug("sCrossSiteHndlr|"+ sCrossSiteHndlr + "|"); // 이스케이프된 값을 출력합니다.

        try{
           log.debug("TRY TEST 1"); // try 블록 시작
           throw new Exception(); // 예외를 강제로 발생시킵니다.
        }catch(Exception e){
           log.debug("TRY TEST 2"); // 예외가 잡히면 이 부분이 실행됩니다.
        }finally{
           log.debug("TRY TEST 3"); // try-catch 블록의 결과와 상관없이 항상 실행됩니다.

        }

    }
    */
}
