// 메뉴 관련 비즈니스 로직을 구현하는 서비스 클래스입니다.
package plant.dev.menu.service.impl;

import jakarta.annotation.Resource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import plant.com.cmm.dao.AbstractDAO;
import plant.com.cmm.exception.CustomException;
import plant.com.cmm.util.map.CustomMap;
import plant.dev.auth.dto.UserDto;
import plant.dev.menu.service.MenuService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service("MenuService")
public class MenuServiceImpl implements MenuService {

    @Resource(name = "abstractDAO")
    private AbstractDAO abstractDAO;

    @Override
    public List<CustomMap> getMenusForCurrentUser() throws CustomException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String rolGrade = "ANONYMOUS"; // 기본은 비로그인 사용자

        // JWT를 통해 인증된 사용자인지 확인
        if (authentication != null && authentication.getPrincipal() instanceof UserDto) {
            UserDto userDto = (UserDto) authentication.getPrincipal();
            rolGrade = userDto.getRolGrade();
        }
        // 1. MyBatis를 통해 DB에서 플랫한 메뉴 리스트를 가져옵니다.
        //    이때 SQL은 요청하신대로 id, label, path 등의 별칭(alias)을 사용해야 합니다.
        List<CustomMap> flatMenuList = abstractDAO.selectList("menuDAO.findMenusByRole", rolGrade);

        // 2. 계층 구조로 변환하는 로직
        return buildMenuHierarchy(flatMenuList);
        //return abstractDAO.selectList("menuDAO.findMenusByRole", rolGrade);
    }

    /**
     * 플랫한 메뉴 리스트를 계층 구조로 변환합니다.
     * @param flatList DB에서 조회한 원본 메뉴 리스트
     * @return 계층적으로 구성된 메뉴 리스트
     */
    private List<CustomMap> buildMenuHierarchy(List<CustomMap> flatList) {
        // 최종적으로 반환할 계층형 메뉴 리스트 (최상위 메뉴들만 담김)
        List<CustomMap> hierarchicalMenus = new ArrayList<>();
        // 메뉴 ID를 키로 사용하여 메뉴 객체를 빠르게 찾기 위한 맵
        Map<String, CustomMap> menuMap = new HashMap<>();

        // 3. 모든 메뉴를 맵에 넣고, 자식 메뉴를 담을 'children' 리스트를 초기화합니다.
        for (CustomMap menu : flatList) {
            menu.put("children", new ArrayList<CustomMap>()); // 자식 리스트 추가
            menuMap.put(menu.getString("id"), menu);
        }

        // 4. 각 메뉴를 순회하며 부모-자식 관계를 설정합니다.
        for (CustomMap menu : flatList) {
            String parentId = menu.getString("prnt_id");

            // 부모 ID가 존재하고, 해당 부모가 맵에 있으면 자식으로 추가합니다.
            if (parentId != null && menuMap.containsKey(parentId)) {
                CustomMap parentMenu = menuMap.get(parentId);
                // 부모의 'children' 리스트를 가져와 현재 메뉴를 추가합니다.
                ((List<CustomMap>) parentMenu.get("children")).add(menu);
            } else {
                // 부모가 없으면 최상위 메뉴이므로 최종 리스트에 추가합니다.
                hierarchicalMenus.add(menu);
            }
        }

        return hierarchicalMenus;
    }
}
