// 사용자 정보를 담는 JPA 엔티티 클래스입니다.
package plant.dev.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_tbl")
@Getter
@NoArgsConstructor
@AllArgsConstructor //테스트로 인해서
public class User {

    @Id
    @Column(name = "user_id", length = 20)
    private String userId;

    @Column(name = "user_pswr", nullable = false)
    private String userPswr;

    @Column(name = "user_name", nullable = false, length = 50)
    private String userName;

    @Column(name = "user_yn", length = 1)
    private String userYn;

    @Column(name = "rol_grade", length = 50)
    private String rolGrade;

    @Column(name = "user_provider", length = 50)
    private String userProvider;

    @Column(name = "user_provider_id", length = 255)
    private String userProviderId;
}
