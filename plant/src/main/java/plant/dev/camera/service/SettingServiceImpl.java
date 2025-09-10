package plant.dev.camera.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plant.dev.camera.dto.SettingDTO;
import plant.dev.camera.mapper.SettingMapper;

@Service
@RequiredArgsConstructor
public class SettingServiceImpl implements SettingService {

    private final SettingMapper settingMapper;  // ✅ 변수명도 통일

    @Override
    public void saveSettings(SettingDTO settingDTO) {
        // ✅ 단일 row 관리용 테이블이면 upsert (insert or update)
        settingMapper.upsertSettings(settingDTO);
    }

    @Override
    public SettingDTO getSettings() {
        return settingMapper.getSettings();
    }
}
