// src/main/java/com/example/demo/controller/TestController.java
package plant.com;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@Slf4j
public class Test2Controller {
    @GetMapping("/")
    public String home() {
        return "index";
    }



    @GetMapping("/test-runtime-error")
    public String testRuntimeException(@RequestParam(defaultValue = "false") boolean json) {
        // 일반 RuntimeException은 GlobalExceptionHandler에서 "error.internal_server"로 처리
        if (json) {
            throw new RuntimeException("이 메시지는 로깅용으로 사용되지만, 클라이언트에게는 정의된 공통 메시지가 전달됩니다.");
        }
        throw new RuntimeException("이 메시지는 로깅용으로 사용되지만, 클라이언트에게는 정의된 공통 메시지가 전달됩니다.");
    }


}