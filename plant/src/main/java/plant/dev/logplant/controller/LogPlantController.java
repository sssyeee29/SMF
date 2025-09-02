package plant.dev.logplant.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import plant.com.cmm.util.map.CustomMap;
import plant.dev.auth.dto.UserDto;
import plant.dev.logplant.serviec.LogPlantService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class LogPlantController {
    private final LogPlantService logPlantService;
    @PostMapping("/logs")
    public ResponseEntity<List<CustomMap>> logs(@RequestBody Map<String, String> requestBody,
                                                @AuthenticationPrincipal UserDto userDto) {
        log.debug("verifyUserName request: {}", requestBody);
        List<CustomMap> Plant_Log = logPlantService.getPlantLog();
        return ResponseEntity.ok(Plant_Log);
    }


}
