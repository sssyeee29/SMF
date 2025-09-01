package plant.dev.com.cmm.util.map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// DTO 객체를 CustomMap으로 변환하는 컨버터 클래스입니다.
public class DtoToCustomMapConverter {

    private final ObjectMapper objectMapper; // Jackson ObjectMapper 인스턴스

    // 생성자를 통해 의존성 주입 (Spring Bean으로 등록하여 싱글톤 관리 권장)
    public DtoToCustomMapConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * [DTO -> CustomMap 변환]
     * 어떤 DTO 객체든 CustomMap으로 변환합니다. (Jackson의 규칙에 따름)
     * DTO의 @JsonProperty 어노테이션 등을 인식합니다.
     *
     * @param dto 변환할 DTO 객체
     * @param <T> DTO 객체의 타입 (제네릭)
     * @return DTO의 데이터를 담은 CustomMap 객체
     */
    public <T> CustomMap convertDtoToCustomMap(T dto) {
        if (dto == null) {
            return new CustomMap();
        }
        // Jackson ObjectMapper를 사용하여 객체를 Map<String, Object>로 변환
        Map<String, Object> map = objectMapper.convertValue(dto, new TypeReference<Map<String, Object>>() {});
        return new CustomMap(map); // CustomMap의 Map 생성자를 사용하여 인스턴스화
    }

    /**
     * [CustomMap -> DTO 변환]
     * CustomMap 객체를 지정된 DTO 타입으로 변환합니다.
     * CustomMap의 키가 DTO의 필드명과 매핑됩니다 (Jackson 규칙).
     *
     * @param customMap 변환할 CustomMap 객체
     * @param targetClass 변환될 DTO 클래스 타입
     * @param <T> 변환될 DTO 객체의 타입 (제네릭)
     * @return CustomMap의 데이터를 담은 DTO 객체
     */
    public <T> T convertCustomMapToDto(CustomMap customMap, Class<T> targetClass) {
        if (customMap == null) {
            return null; // 또는 targetClass.getDeclaredConstructor().newInstance() 등으로 빈 객체 반환 고려
        }
        // CustomMap은 Map 인터페이스를 구현하므로, ObjectMapper가 직접 변환할 수 있습니다.
        return objectMapper.convertValue(customMap, targetClass);
    }

    /**
     * [List<CustomMap> -> List<DTO> 변환]
     * List<CustomMap>을 List<DTO>로 변환합니다. MyBatis 결과 리스트 처리에 유용합니다.
     *
     * @param customMapList 변환할 List<CustomMap>
     * @param targetClass 각 CustomMap이 변환될 DTO 클래스 타입
     * @param <T> 변환될 DTO 객체의 타입 (제네릭)
     * @return 변환된 List<DTO>
     */
    public <T> List<T> convertCustomMapListToDtoList(List<CustomMap> customMapList, Class<T> targetClass) {
        if (customMapList == null || customMapList.isEmpty()) {
            return new ArrayList<>();
        }
        // Stream API를 사용하여 각 CustomMap을 DTO로 변환하여 새로운 리스트 생성
        return customMapList.stream()
                .map(customMap -> convertCustomMapToDto(customMap, targetClass))
                .collect(Collectors.toList());
    }

    /**
     * [List<DTO> -> List<CustomMap> 변환]
     * List<DTO>를 List<CustomMap>으로 변환합니다.
     * 여러 DTO 객체를 Map 형태로 일괄 처리해야 할 때 유용합니다.
     *
     * @param dtoList 변환할 List<DTO>
     * @param <T> DTO 객체의 타입 (제네릭)
     * @return 변환된 List<CustomMap>
     */
    public <T> List<CustomMap> convertDtoListToCustomMapList(List<T> dtoList) {
        if (dtoList == null || dtoList.isEmpty()) {
            return new ArrayList<>();
        }
        // Stream API를 사용하여 각 DTO를 CustomMap으로 변환하여 새로운 리스트 생성
        return dtoList.stream()
                .map(this::convertDtoToCustomMap) // convertDtoToCustomMap 메서드 재사용
                .collect(Collectors.toList());
    }
}
