package plant.dev.com.cmm.web;


import org.springframework.beans.propertyeditors.CustomDateEditor;
import org.springframework.beans.propertyeditors.StringTrimmerEditor;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.InitBinder;

import java.text.SimpleDateFormat;
import java.util.Date;

// WebDataBinder를 초기화하여 커스텀 바인딩을 지원하는 클래스입니다.
@ControllerAdvice
public class BindingInitializer  {
    @InitBinder // 데이터 바인딩 설정을 초기화하는 메서드
    public void initBinder(WebDataBinder binder) {

        // 1. 문자열(String) 타입에 대한 처리
        //    - 모든 요청 파라미터의 앞뒤 공백을 자동으로 제거합니다.
        //    - false 옵션: 공백만으로 이루어진 문자열("")을 null로 변환하지 않습니다.
        binder.registerCustomEditor(String.class, new StringTrimmerEditor(false));

        // 2. 날짜(Date) 타입에 대한 처리
        //    - "yyyy-MM-dd" 형식의 문자열을 java.util.Date 객체로 변환합니다.
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        dateFormat.setLenient(false); // 엄격한 날짜 형식 검사 (예: 2025-02-30 허용 안 함)

        //    - false 옵션: 빈 문자열("")을 null로 변환합니다.
        binder.registerCustomEditor(Date.class, new CustomDateEditor(dateFormat, true));
    }
}
