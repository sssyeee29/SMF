package plant.dev.jpa.entity;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

@MybatisTest
class MyBatisMapperTest {
    @Autowired
    TestMapper testMapper;

    @Test
    void 마이바티스_간단_쿼리_테스트() {
        int result = testMapper.selectOne();
        assertThat(result).isEqualTo(1);
    }

    @Mapper
    interface TestMapper {
        @Select("SELECT 1")
        int selectOne();
    }
}
