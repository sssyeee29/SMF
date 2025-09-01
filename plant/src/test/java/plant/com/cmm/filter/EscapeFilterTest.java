package plant.com.cmm.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("XSS Escape Filter 및 JSON XSS 처리 테스트")
class EscapeFilterTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;



    // Map을 사용한 JSON POST 요청 테스트
    // NEW: Test for the custom class (TestXssMapRequest)
    @Test
    void testXssProtectionForJsonPostWithCustomClass() throws Exception {
        Map<String, String> requestMap = new HashMap<>();
        requestMap.put("content", "Map content with <script>evil</script> code.");
        requestMap.put("title", "Map title with <i>italic</i>.");

        // Map을 JSON 문자열로 변환
        String jsonInput = objectMapper.writeValueAsString(requestMap);

        mockMvc.perform(post("/xss-custom-map-test") // Use the new endpoint path
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonInput))
                .andExpect(status().isOk())
                // Verify the fields are escaped in the JSON response
                .andExpect(jsonPath("$.content", Matchers.is("Custom class content with &lt;script&gt;evil&lt;/script&gt; code.")))
                .andExpect(jsonPath("$.title", Matchers.is("Custom class title with &lt;i&gt;italic&lt;/i&gt;.")));
    }
}