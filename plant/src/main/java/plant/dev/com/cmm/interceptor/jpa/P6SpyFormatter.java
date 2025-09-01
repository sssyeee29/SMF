package plant.dev.com.cmm.interceptor.jpa;

import com.p6spy.engine.logging.Category;
import com.p6spy.engine.spy.P6SpyOptions;
import com.p6spy.engine.spy.appender.MessageFormattingStrategy;
import jakarta.annotation.PostConstruct;
import org.hibernate.engine.jdbc.internal.FormatStyle;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

// P6Spy SQL 로그 포맷을 커스터마이징하는 클래스입니다.
// 개발 환경에서만 활성화되며(@Profile("!prod")), SQL 쿼리, 실행 시간,
// 그리고 해당 쿼리를 호출한 소스 코드의 위치(스택 트레이스)를 함께 로깅하여
// 디버깅 효율을 극대화합니다.
//
// @Profile("!prod") - 운영(prod) 프로파일이 아닐 때만 이 설정이 활성화됩니다.
@Configuration
@Profile("!prod") // 개발, 로컬 환경 등에서만 적용
public class P6SpyFormatter implements MessageFormattingStrategy {

    /**
     * 이 클래스가 빈으로 등록된 후, P6Spy의 로그 포맷터로 자기 자신을 등록합니다.
     * 이 설정을 통해 P6Spy는 아래의 formatMessage 메서드를 사용하여 로그를 출력하게 됩니다.
     */
    @PostConstruct
    public void setLogMessageFormat() {
        P6SpyOptions.getActiveInstance().setLogMessageFormat(this.getClass().getName());
    }

    /**
     * P6Spy에 의해 가로채진 SQL 로그를 최종적으로 어떤 형태로 출력할지 결정합니다.
     *
     * @param connectionId 커넥션 ID
     * @param now          현재 시간
     * @param elapsed      쿼리 실행에 소요된 시간 (ms)
     * @param category     쿼리 종류 (e.g., statement, resultset)
     * @param prepared     PreparedStatement에 바인딩될 파라미터 정보
     * @param sql          실행된 SQL 쿼리
     * @param url          DB URL
     * @return 최종적으로 포맷팅된 로그 메시지
     */
    @Override
    public String formatMessage(int connectionId, String now, long elapsed, String category, String prepared, String sql, String url) {
        // 실행된 SQL과 파라미터를 조합합니다.
        sql = formatSql(category, sql, prepared);
        // 로그 형식: [카테고리] | 실행시간 ms | 호출 스택 위치 \n 정렬된 SQL
        return String.format("[%s] | %d ms | %s", category, elapsed, sql);
    }

    /**
     * SQL 쿼리를 보기 좋게 포맷팅하고, 호출 스택 정보를 추가합니다.
     *
     * @param category 쿼리 종류
     * @param sql      원본 SQL
     * @param prepared 바인딩 파라미터
     * @return 포맷팅된 SQL과 스택 트레이스가 포함된 문자열
     */
    private String formatSql(String category, String sql, String prepared) {
        // STATEMENT 카테고리일 때만 SQL 포맷팅 및 스택 트레이스 로깅을 적용합니다.
        if (sql != null && !sql.trim().isEmpty() && Category.STATEMENT.getName().equals(category)) {
            String trimmedSql = sql.trim().toLowerCase(Locale.ROOT);

            // 파라미터가 존재하면, SQL의 '?' 부분에 실제 값을 채워넣습니다.
            // P6Spy가 prepared 인자에 파라미터를 전달해주므로 이를 활용합니다.
            if (prepared != null && !prepared.trim().isEmpty()) {
                // prepared는 "param1, param2, ..." 형태이므로 쉼표로 분리
                String[] params = prepared.split(",");
                for (String param : params) {
                    sql = sql.replaceFirst("\\?", "'" + param.trim() + "'");
                }
            }

            // DDL(create, alter, drop 등)과 DML(select, insert, update, delete)을 구분하여 포맷팅합니다.
            String formattedSql;
            if (trimmedSql.startsWith("create") || trimmedSql.startsWith("alter") || trimmedSql.startsWith("drop") || trimmedSql.startsWith("comment")) {
                formattedSql = FormatStyle.DDL.getFormatter().format(sql);
            } else {
                formattedSql = FormatStyle.BASIC.getFormatter().format(sql);
            }
            // 최종적으로 스택 트레이스와 포맷팅된 SQL을 합쳐서 반환합니다.
            return stackTrace() + "\n" + formattedSql;
        }
        return sql;
    }

    /**
     * 현재 쿼리를 호출한 애플리케이션의 코드 위치(스택 트레이스)를 찾아 반환합니다.
     *
     * @return 필터링된 스택 트레이스 문자열
     */
    private String stackTrace() {
        return Stream.of(new Throwable().getStackTrace())
                // 'plant'으로 시작하는, 즉 우리가 작성한 패키지만 필터링합니다.
                .filter(t -> t.toString().startsWith("plant"))
                // P6SpyFormatter 자기 자신의 호출 정보는 제외하여 불필요한 로그를 줄입니다.
                .filter(t -> !t.toString().contains(this.getClass().getName()))
                .map(StackTraceElement::toString)
                .collect(Collectors.joining("\n    ", "\n    ", "")); // 각 라인 앞에 공백을 추가하여 가독성을 높입니다.
    }
}