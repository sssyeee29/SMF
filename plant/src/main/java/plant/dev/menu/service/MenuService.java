// 메뉴 관련 비즈니스 로직을 정의하는 서비스 인터페이스입니다.
package plant.dev.menu.service;

import plant.com.cmm.exception.CustomException;
import plant.com.cmm.util.map.CustomMap;

import java.util.List;

public interface MenuService {
    public List<CustomMap> getMenusForCurrentUser() throws CustomException;
}
