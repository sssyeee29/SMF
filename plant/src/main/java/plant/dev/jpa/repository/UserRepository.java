// 사용자 엔티티에 대한 데이터 접근을 담당하는 레포지토리입니다.
package plant.dev.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import plant.dev.jpa.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    // userId로 사용자를 찾는 메서드
    Optional<User> findByUserId(String userId);


    @Query("SELECT u FROM User u, UserIP ui WHERE u.userIp = ui.userIp AND u.userId = :userId AND ui.ipYn = 'Y'")
    Optional<User> findUserByIdAndApprovedIp(@Param("userId") String userId);
}