package plant.dev.camera.service;

import plant.dev.camera.dto.SettingDTO;

public interface SettingService {
    void saveSettings(SettingDTO settingsDTO);
    SettingDTO getSettings();


}
