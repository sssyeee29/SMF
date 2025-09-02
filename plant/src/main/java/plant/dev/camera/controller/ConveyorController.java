package plant.dev.camera.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/conveyor")
public class ConveyorController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String RASPBERRY_PI_URL = "http://192.168.10.243:5000/control";


    @PostMapping("/start")
    public ResponseEntity<String> startConveyor() {
        // 쿼리 파라미터로 action=start 붙여서 전송
        String url = RASPBERRY_PI_URL + "?action=start";
        return restTemplate.postForEntity(url, null, String.class);
    }

    @PostMapping("/stop")
    public ResponseEntity<String> stopConveyor() {
        // 쿼리 파라미터로 action=stop 붙여서 전송
        String url = RASPBERRY_PI_URL + "?action=stop";
        return restTemplate.postForEntity(url, null, String.class);
    }
}

