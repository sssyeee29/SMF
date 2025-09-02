package plant.com.cmm.util.map;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// DTO → CustomMap 변환기 관련 설정을 담당하는 클래스입니다.
@Configuration
public class dtoToCustomMapConverterConfig {
    /**
     * Jackson ObjectMapper를 Spring Bean으로 등록합니다.
     * JSON 직렬화/역직렬화 및 Map <-> DTO 변환에 사용됩니다.
     */


    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        // 필요에 따라 ObjectMapper 설정 추가:
        // 예: DTO의 필드명(camelCase)을 데이터베이스 컬럼명(snake_case)으로 매핑
        // objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        // 예: 날짜/시간 직렬화 포맷 설정 (ISO 8601 등)
        // objectMapper.findAndRegisterModules(); // Java 8 날짜/시간 모듈 자동 등록

        return objectMapper;
    }

    /**
     * DtoToCustomMapConverter를 Spring Bean으로 등록합니다.
     * 생성자를 통해 ObjectMapper 빈을 자동으로 주입받습니다 (의존성 주입).
     */
    @Bean
    public DtoToCustomMapConverter dtoToCustomMapConverter(ObjectMapper objectMapper) {
        // Spring이 위에서 정의한 objectMapper 빈을 자동으로 찾아 여기에 주입해줍니다.
        return new DtoToCustomMapConverter(objectMapper);
    }
}
/*
import org.springframework.stereotype.Service;
import plant.com.cmm.util.map.CustomMap;
import plant.com.cmm.util.map.DtoToCustomMapConverter; // 컨버터 클래스 임포트

import java.util.List;
// 예시 DTO (실제 사용하는 DTO로 대체)
class UserDto {
    private String userId;
    private String userName;
    // ... getter, setter, constructor
    public UserDto() {} // Jackson을 위한 기본 생성자
    public UserDto(String userId, String userName) { this.userId = userId; this.userName = userName;}
    public String getUserId() { return userId; }
    public String getUserName() { return userName; }
}

@Service // 이 클래스가 Spring 서비스 계층의 컴포넌트임을 나타냅니다.
public class MyService {

    private final DtoToCustomMapConverter converter; // 컨버터 필드 선언

    // 생성자 주입: Spring이 DtoToCustomMapConverter 빈을 자동으로 찾아 여기에 주입합니다.
    public MyService(DtoToCustomMapConverter converter) {
        this.converter = converter;
    }

    public CustomMap createUserMap(UserDto userDto) {
        // DTO -> CustomMap 변환
        return converter.convertDtoToCustomMap(userDto);
    }

    public UserDto getUserDtoFromMap(CustomMap userMap) {
        // CustomMap -> DTO 변환
        return converter.convertCustomMapToDto(userMap, UserDto.class);
    }

    public List<CustomMap> convertUserDtoListToMapList(List<UserDto> userDtoList) {
        // List<DTO> -> List<CustomMap> 변환
        return converter.convertDtoListToCustomMapList(userDtoList);
    }

    public List<UserDto> convertUserMapListToDtoList(List<CustomMap> userMapList) {
        // List<CustomMap> -> List<DTO> 변환
        return converter.convertCustomMapListToDtoList(userMapList, UserDto.class);
    }

    // 예시 사용:
    public void someBusinessLogic() {
        UserDto newUser = new UserDto("testuser", "테스트 사용자");
        CustomMap userMap = createUserMap(newUser);
        System.out.println("생성된 CustomMap: " + userMap);

        // MyBatis에서 받아온 CustomMap이라고 가정
        CustomMap dbMap = new CustomMap();
        dbMap.put("USER_ID", "db_id");
        dbMap.put("USER_NAME", "DB 사용자");
        UserDto dbUserDto = getUserDtoFromMap(dbMap);
        System.out.println("DB CustomMap에서 변환된 DTO: " + dbUserDto.getUserId() + ", " + dbUserDto.getUserName());
    }
}




 */