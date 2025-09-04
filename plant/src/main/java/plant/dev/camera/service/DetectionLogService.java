package plant.dev.camera.service;

public interface DetectionLogService {

    void saveInferJson(String captureId, String resultJson, Long seq);
}
