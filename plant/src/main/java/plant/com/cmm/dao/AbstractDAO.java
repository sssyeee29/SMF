package plant.com.cmm.dao;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// MyBatis SqlSessionTemplate을 활용한 공통 DAO 클래스입니다.
@Repository("abstractDAO")
public class AbstractDAO {

    @Autowired
    private SqlSessionTemplate sqlSession;

    /**
     * 단일 레코드를 조회합니다.
     * @param queryId XML에 정의된 쿼리 ID
     * @return 조회 결과 객체
     */
    public <T> T selectOne(String queryId) {
        return sqlSession.selectOne(queryId);
    }

    /**
     * 단일 레코드를 조회합니다. (파라미터 포함)
     * Optional을 반환하여 Null-safe한 처리를 돕습니다.
     * @param queryId XML에 정의된 쿼리 ID
     * @param parameter 쿼리에 전달할 파라미터
     * @return Optional<T> 조회 결과
     */
    public <T> Optional<T> selectOne(String queryId, Object parameter) {
        return Optional.ofNullable(sqlSession.selectOne(queryId, parameter));
    }

    /**
     * 다중 레코드를 조회합니다.
     * @param queryId XML에 정의된 쿼리 ID
     * @return 조회 결과 리스트
     */
    public <T> List<T> selectList(String queryId) {
        return sqlSession.selectList(queryId);
    }

    /**
     * 다중 레코드를 조회합니다. (파라미터 포함)
     * @param queryId XML에 정의된 쿼리 ID
     * @param parameter 쿼리에 전달할 파라미터
     * @return 조회 결과 리스트
     */
    public <T> List<T> selectList(String queryId, Object parameter) {
        return sqlSession.selectList(queryId, parameter);
    }
 
    /**
     * 데이터를 삽입합니다.
     * @param queryId XML에 정의된 쿼리 ID
     * @param parameter 삽입할 데이터
     * @return 영향을 받은 행의 수
     */
    public int insert(String queryId, Object parameter) {
        return sqlSession.insert(queryId, parameter);
    }

    /**
     * 데이터를 수정합니다.
     * @param queryId XML에 정의된 쿼리 ID
     * @param parameter 수정할 데이터
     * @return 영향을 받은 행의 수
     */
    public int update(String queryId, Object parameter) {
        return sqlSession.update(queryId, parameter);
    }

    /**
     * 데이터를 삭제합니다.
     * @param queryId XML에 정의된 쿼리 ID
     * @param parameter 삭제할 조건
     * @return 영향을 받은 행의 수
     */
    public int delete(String queryId, Object parameter) {
        return sqlSession.delete(queryId, parameter);
    }
}
