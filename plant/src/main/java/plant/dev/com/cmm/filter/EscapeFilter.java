// XSS 방지를 위해 요청 파라미터를 감싸는 필터 클래스입니다.
package plant.dev.com.cmm.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;

@Slf4j
public class EscapeFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {

        log.debug("##### EscapeFilter #####");
        if (request instanceof HttpServletRequest) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;

            String contentType = httpRequest.getContentType();
            boolean isJson = contentType != null && contentType.contains("application/json");

            if (isJson) {
                chain.doFilter(new EscapeRequestWrapper(httpRequest), response);
            } else {
                // HTML or form 요청
                chain.doFilter(new EscapeParameterRequestWrapper(httpRequest), response);
            }
        } else {
            chain.doFilter(request, response);
        }
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // 필터 초기화 시 필요한 작업 수행 (현재는 없음)
    }

    @Override
    public void destroy() {
        // 필터 소멸 시 필요한 작업 수행 (현재는 없음)
    }
}
