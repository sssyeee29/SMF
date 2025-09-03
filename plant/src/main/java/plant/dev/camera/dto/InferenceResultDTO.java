package plant.dev.camera.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class InferenceResultDTO {

    // 인자 #0: captureId
    private String captureId;

    // 인자 #1: JSON 본문에서 가져올 필드들
    private String status;
    private Boolean hasMilk;
    private Boolean hasDefect;
    private List<Integer> detectedCids;
    private Double timestamp;
    private Double confidence;
    private List<List<Object>> classes;  // [ [1, 0.90], [4, 0.56] ] 형태

    // 인자 #2: 선택적 시퀀스 번호
    private Long seq;

    // 💡 imageUrl은 서버에서 조합해서 넣을 수 있으므로 DTO에는 없어도 됨
}
