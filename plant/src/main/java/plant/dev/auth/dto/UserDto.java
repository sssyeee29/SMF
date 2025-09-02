// 사용자 정보를 담는 DTO 클래스입니다.
package plant.dev.auth.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class UserDto {
    // 'user_id' 컬럼과 매핑 (기존 userName -> userId 로 변경)
    private String userId;

    // 'user_pswr' 컬럼과 매핑 (기존 userPassword -> userPswr 로 변경)
    private String userPswr;

    // 'user_name' 컬럼과 매핑 (기존 userNickname -> userName 로 변경)
    private String userName;

    // 'rol_grade' 컬럼과 매핑 (기존 userRole -> rolGrade 로 변경)
    private String rolGrade;

    // 'user_yn' 컬럼과 매핑 (신규 추가)
    private String userYn;

    // userEmail은 userId가 이메일을 저장하므로 중복되어 제거하거나,
    // 별도 로직을 위해 유지할 수 있습니다. 여기서는 userId를 사용하도록 통일합니다.
}