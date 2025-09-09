package plant.dev.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_ip_tbl")
@Getter
@NoArgsConstructor
@AllArgsConstructor //테스트로 인해서
public class UserIP {

    @Id
    @Column(name = "user_ip", length = 20)
    private String userIp;

    @Column(name = "ip_yn", length = 1)
    private String ipYn;
}
