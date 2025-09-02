// 메뉴 관련 요청을 처리하는 컨트롤러입니다.
package plant.dev.menu.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import plant.com.cmm.util.map.CustomMap;
import plant.com.cmm.util.map.DtoToCustomMapConverter;
import plant.dev.menu.service.MenuService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class MenuController{
    private final MenuService menuService;
    private final DtoToCustomMapConverter converter;

    @GetMapping("/menus")
    public ResponseEntity<List<CustomMap>> getMenus() {
        List<CustomMap> menus = menuService.getMenusForCurrentUser();
        return ResponseEntity.ok(menus);
    }

}

/*

aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: {userId=null, userPswr=null, userName=<img src='x' onerror='alert("공격")'>, rolGrade=null, userYn=null, userProvider=null, userProviderId=null}
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: {userId=null, userPswr=null, userName=<img src='x'  ''>, rolGrade=null, userYn=null, userProvider=null, userProviderId=null}
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: {userId=null, userPswr=null, userName=<img src='x' onerror='alert("공격")'>, rolGrade=null, userYn=null, userProvider=null, userProviderId=null}
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb: UserDto(userId=null, userPswr=null, userName=<img src='x' onerror='alert("공격")'>, rolGrade=null, userYn=null, userProvider=null, userProviderId=null)
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb: UserDto(userId=null, userPswr=null, userName=<img src='x'  ''>, rolGrade=null, userYn=null, userProvider=null, userProviderId=null)



    @GetMapping("/xss-test2")
    public ResponseEntity<String> getssxss(@RequestParam("ddd") String ddd) {
        log.debug("getMenus ddd: {}", ddd);
        List<CustomMap> menus = new ArrayList<>();
        CustomMap a = new CustomMap();

        UserDto aa = new UserDto();
        aa.setUserName(ddd);

        a = converter.convertDtoToCustomMap(aa);
        log.debug("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: {}", a.toString());

        UserDto bb = new UserDto();
        bb = converter.convertCustomMapToDto(a,UserDto.class);


        log.debug("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb: {}", bb.toString());

        menus.add(a);
        return ResponseEntity.ok(a.toString());
    }

    @GetMapping("/xss-test")
    public ResponseEntity<String> getxss(@RequestParam("ddd") String ddd) throws Exception { // JsonProcessingException 처리를 위해 throws 추가
        log.debug("입력받은 원본 데이터: {}", ddd);

        // --- 1. XSS 방어 로직이 적용된 ObjectMapper를 이 메서드 안에서 직접 생성합니다. ---
        ObjectMapper secureMapper = new ObjectMapper();

        // Serializer 모듈 등록 (eval, onclick 등 패턴 필터링)
        SimpleModule xssModule = new SimpleModule();
        xssModule.addSerializer(String.class, new XssSanitizerSerializer());
        secureMapper.registerModule(xssModule);

        // CharacterEscapes 등록 (<, > 등 특수문자 치환)
        secureMapper.getFactory().setCharacterEscapes(new HtmlCharacterEscapes());
        // --------------------------------------------------------------------------------

        // 2. 컨트롤러에서 반환할 객체를 만듭니다.
        List<CustomMap> menus = new ArrayList<>();
        CustomMap a = new CustomMap();
        a.put("ddd", ddd);
        menus.add(a);

        // 3. 우리가 만든 'secureMapper'를 사용해 객체를 직접 JSON 문자열로 변환합니다.
        String jsonResponse = secureMapper.writeValueAsString(menus);
        log.debug("XSS 방어 처리 후 JSON: {}", jsonResponse);

        // 4. 변환된 JSON 문자열을 그대로 반환합니다.
        //    이렇게 하면 Spring의 복잡한 HttpMessageConverter 설정을 완전히 우회하여 결과를 보장할 수 있습니다.
        final HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        return new ResponseEntity<>(jsonResponse, headers, HttpStatus.OK);
    }
*/
