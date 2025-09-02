// MyBatis 쿼리 실행 정보를 로깅하는 플러그인 클래스입니다.
package plant.com.cmm.interceptor.mybatis;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.ibatis.cache.CacheKey;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.ParameterMapping;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Properties;

@Intercepts({
        @Signature(type = Executor.class, method = "update", args = {MappedStatement.class, Object.class}),
        @Signature(type = Executor.class, method = "query", args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class, CacheKey.class, BoundSql.class}),
        @Signature(type = Executor.class, method = "query", args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})

public class QueryLoggingPlugin implements Interceptor {

    private final static Logger log = LoggerFactory.getLogger(QueryLoggingPlugin.class);

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object[] args = invocation.getArgs();
        MappedStatement mappedStatement = (MappedStatement) args[0];
        Object paramObject = (args.length > 1) ? args[1] : null;

        // 쿼리 로깅
        if (log.isDebugEnabled()) {
            loggingQuery(mappedStatement, paramObject);
        }

        long begin = System.currentTimeMillis();
        Object result = invocation.proceed(); // 실제 쿼리 실행
        long end = System.currentTimeMillis();

        log.info("### 수행시간: {} 초", (end - begin) / 1000.0);

        // 결과 로깅
        if (log.isDebugEnabled()) {
            if (result instanceof List) {
                List<?> list = (List<?>) result;
                log.debug("### 쿼리결과: {} 건", list.size());
            } else {
                log.debug("### 쿼리결과 --> {}", result);
            }
        }
        return result;
    }

    private void loggingQuery(MappedStatement mappedStatement, Object paramObject) {
        try {
            final BoundSql boundSql = mappedStatement.getBoundSql(paramObject);
            String sql = boundSql.getSql();
            List<ParameterMapping> paramMapping = boundSql.getParameterMappings();

            if (paramMapping != null && !paramMapping.isEmpty() && paramObject != null) {
                MetaObject metaObject = mappedStatement.getConfiguration().newMetaObject(paramObject);
                for (ParameterMapping mapping : paramMapping) {
                    String prop = mapping.getProperty();
                    Object value = null;
                    if (boundSql.hasAdditionalParameter(prop)) {
                        value = boundSql.getAdditionalParameter(prop);
                    } else if (metaObject.hasGetter(prop)) {
                        value = metaObject.getValue(prop);
                    } else if(paramObject instanceof String || paramObject instanceof Integer || paramObject instanceof Long){
                        value = paramObject;
                    }

                    String valueStr = (value instanceof String) ? "'" + value + "'" : String.valueOf(value);
                    sql = sql.replaceFirst("\\?", valueStr);
                }
            }

            log.debug("\n----------------------------------------------------------------------------------------"
                            + "\n[SQL ID : {}]\n{}"
                            + "\n----------------------------------------------------------------------------------------",
                    //mappedStatement.getId(), sql.replaceAll("\\s+", " "));
                    mappedStatement.getId(), sql);

        }catch (NullPointerException e){
            log.error("----------------------------------------------------------------------------------------");
            log.error("### SQL Foramtting Error : {}", ExceptionUtils.getStackTrace(e));
            log.error("### SQL ID  : {}", mappedStatement.getId());
            log.error("### StackTrace\n", e);
            log.error("----------------------------------------------------------------------------------------");
        } catch (Exception e) {
            log.error("----------------------------------------------------------------------------------------");
            log.error("### SQL Foramtting Error : {}", ExceptionUtils.getStackTrace(e));
            log.error("### SQL ID  : {}", mappedStatement.getId());
            log.error("### StackTrace\n", e);
            log.error("----------------------------------------------------------------------------------------");
        }
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {
        // 플러그인 프로퍼티 설정 (필요 시)
    }
}