package plant.dev.com.config;

// JPA 및 MyBatis 영속성 관련 설정을 담당하는 클래스입니다.

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.type.JdbcType;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.transaction.ChainedTransactionManager;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import plant.dev.com.cmm.interceptor.mybatis.QueryLoggingPlugin;
import plant.dev.com.cmm.util.map.CustomMap;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * @ClassName : PersistenceConfig.java
 * @Description : 데이터베이스, MyBatis, JPA 통합 영속성 설정 (ChainedTransactionManager 적용)
 */
@Configuration
@PropertySource("classpath:/plant/secrets.properties")
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "plant.dev.jpa.repository",
        entityManagerFactoryRef = "entityManagerFactory",
        transactionManagerRef = "transactionManager" // 기본 트랜잭션 매니저를 ChainedTransactionManager로 설정
)
public class PersistenceConfig {

    // =================================================================
    // == DataSource 설정
    // =================================================================

    @Value("${Globals.DriverClassName}")
    private String driverClassName;

    @Value("${Globals.Url}")
    private String url;

    @Value("${Globals.UserName}")
    private String userName;

    @Value("${Globals.Password}")
    private String password;

    @Bean
    @Profile("prod")
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setDriverClassName(driverClassName);
        config.setJdbcUrl(url);
        config.setUsername(userName);
        config.setPassword(password);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setConnectionTestQuery("SELECT 1");
        return new HikariDataSource(config);
    }

    @Bean
    @Profile("!prod")
    public DataSource devDataSource() {
        HikariConfig config = new HikariConfig();
        // P6Spy의 드라이버 클래스를 설정합니다.
        config.setDriverClassName("com.p6spy.engine.spy.P6SpyDriver");
        // JDBC URL에 P6Spy를 추가하여 래핑하도록 설정합니다.
        config.setJdbcUrl("jdbc:p6spy:" + url.substring(url.indexOf(":") + 1));
        config.setUsername(userName);
        config.setPassword(password);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setConnectionTestQuery("SELECT 1");
        return new HikariDataSource(config);
    }

    // =================================================================
    // == MyBatis 설정
    // =================================================================

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);

        /// ************************************************************************************** ///
        // MyBatis XML 설정 파일을 Java 코드로 대체합니다.
        org.apache.ibatis.session.Configuration mybatisConfig = new org.apache.ibatis.session.Configuration();
        // 1. mapUnderscoreToCamelCase 설정
        mybatisConfig.setMapUnderscoreToCamelCase(true);
        // 2. jdbcTypeForNull 설정
        mybatisConfig.setJdbcTypeForNull(JdbcType.VARCHAR);
        // 3. Type Alias 설정
        mybatisConfig.getTypeAliasRegistry().registerAlias("CustomMap", CustomMap.class);
        sessionFactory.setConfiguration(mybatisConfig);

        // 위에 내용으로 대체됨
        //sessionFactory.setConfigLocation(new PathMatchingResourcePatternResolver().getResource("classpath:/plant/mapper/config/mapper-config.xml"));
        /// ************************************************************************************** ///

        sessionFactory.setMapperLocations(new PathMatchingResourcePatternResolver().getResources("classpath:/plant/mapper/sql/**/*.xml"));
        sessionFactory.setPlugins(new Interceptor[]{new QueryLoggingPlugin()});
        return sessionFactory.getObject();
    }

    @Bean
    public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }

    // =================================================================
    // == JPA 설정
    // =================================================================

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("plant.dev.jpa.entity");
        em.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

        Map<String, Object> jpaProperties = new HashMap<>();

        if("org.h2.Driver".equals(driverClassName)){
            jpaProperties.put("hibernate.hbm2ddl.auto", "none");
            jpaProperties.put("hibernate.dialect", "org.hibernate.dialect.H2Dialect"); // H2Dialect로 수정
            //jpaProperties.put("hibernate.show_sql", "true"); //P6Spy 사용
            //jpaProperties.put("hibernate.format_sql", "true");
        }else{
            jpaProperties.put("hibernate.dialect", "org.hibernate.dialect.MySQL8Dialect");
            //jpaProperties.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
            jpaProperties.put("hibernate.hbm2ddl.auto", "update"); // application.properties의 설정과 일치시킵니다.
            //jpaProperties.put("hibernate.show_sql", "true");
            //jpaProperties.put("hibernate.format_sql", "true");
        }



        em.setJpaPropertyMap(jpaProperties);
        return em;
    }

    // =================================================================
    // == 트랜잭션 매니저 설정 (Chained)
    // =================================================================

    /**
     * MyBatis를 위한 트랜잭션 매니저를 생성합니다.
     */
    @Bean(name = "mybatisTransactionManager")
    public PlatformTransactionManager mybatisTransactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }

    /**
     * JPA를 위한 트랜잭션 매니저를 생성합니다.
     */
    @Bean(name = "jpaTransactionManager")
    public PlatformTransactionManager jpaTransactionManager(EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

    /**
     * JPA와 MyBatis 트랜잭션 매니저를 연결(chain)하는 ChainedTransactionManager를
     * 최종 트랜잭션 매니저로 설정합니다.
     * @Primary 어노테이션으로 이 트랜잭션 매니저를 기본으로 사용하도록 지정합니다.
     */
    @Bean
    @Primary
    public PlatformTransactionManager transactionManager(
            @Qualifier("jpaTransactionManager") PlatformTransactionManager jpaTransactionManager,
            @Qualifier("mybatisTransactionManager") PlatformTransactionManager mybatisTransactionManager
    ) {
        return new ChainedTransactionManager(jpaTransactionManager, mybatisTransactionManager);
    }
}
/*
```

        ### 주요 변경점 요약

1.  **트랜잭션 매니저 분리**: JPA와 MyBatis를 위한 트랜잭션 매니저를 각각 `jpaTransactionManager`, `mybatisTransactionManager`라는 이름으로 명확하게 분리하여 Bean으로 등록했습니다.
        2.  **ChainedTransactionManager 통합**: `@Primary` 어노테이션을 사용하여 `ChainedTransactionManager`를 최종 기본 트랜잭션 매니저(`transactionManager`)로 지정했습니다. 이 Bean이 위에서 만든 두 매니저를 주입받아 하나로 묶는 역할을 합니다.
3.  **중복 제거**: 기존에 있던 JPA 전용 `transactionManager` Bean을 제거하여 중복 정의 오류를 해결했습니다.
        4.  **
Dialect 수정**: H2 데이터베이스를 사용하고 있으므로, JPA의 Dialect 설정을 `MariaDBDialect`에서 `H2Dialect`로 수정했습니다.

이제 이 설정 파일을 사용하시면, 서비스 계층에서 `@Transactional` 어노테이션 하나만으로 JPA와 MyBatis의 작업을 하나의 트랜잭션으로 안전하게 관리할 수 있습니다
*/