package plant.dev.camera.mapper;

import org.apache.ibatis.annotations.Mapper;
import plant.dev.camera.dto.SettingDTO;

@Mapper
public interface SettingMapper {
    void upsertSettings(SettingDTO settingsDTO);

    SettingDTO getSettings();
}
