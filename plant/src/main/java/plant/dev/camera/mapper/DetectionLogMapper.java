package plant.dev.camera.mapper;

import org.apache.ibatis.annotations.Mapper;
import plant.dev.camera.dto.DetectionLogDTO;

@Mapper
public interface DetectionLogMapper {
    int upsertDetectionLog(DetectionLogDTO dto);
}
