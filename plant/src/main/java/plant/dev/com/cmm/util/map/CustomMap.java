// 다양한 타입의 값을 저장할 수 있는 커스텀 Map 구현체입니다.
package plant.dev.com.cmm.util.map;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import org.apache.commons.collections4.map.ListOrderedMap;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@JsonDeserialize(using = CustomMapJsonDeserializer.class)
public class CustomMap extends ListOrderedMap<String, Object> {

    private static final long serialVersionUID = 1L; // serialVersionUID 명시

    public CustomMap() {
        super();
    }

    public CustomMap(Map<String, ?> map) { // 제네릭 사용
        if (map != null) {
            this.putAll(map);
        }
    }

    /**
     * 대소문자 상관없이 키값을 가져오도록 함.
     * @param key
     * @return
     */
    @Override // Map의 get(Object key)를 오버라이드
    public Object get(Object key) {
        if (key == null) {
            return null;
        }
        String stringKey = String.valueOf(key);
        Object obj = super.get(stringKey);

        if (obj == null) {
            obj = super.get(stringKey.toLowerCase());

            if (obj == null) {
                obj = super.get(stringKey.toUpperCase());
            }
        }
        return obj;
    }

    /**
     * 해당 키의 대/소문자가 이미 있으면 삭제한 후 넣음. (중복 키 방지)
     * @param key
     * @param value
     * @return
     */
    @Override // Map의 put(K key, V value)를 오버라이드
    public Object put(String key, Object value) { // Map의 키가 String이므로 String으로 명시
        if ("undefined".equals(key)) {
            return null;
        }

        String lower = key.toLowerCase();
        String upper = key.toUpperCase();
        this.remove(lower); // 기존 소문자 키 제거
        this.remove(upper); // 기존 대문자 키 제거

        // Map의 특정 로직: 공백 1칸을 빈 문자열로 변경
        if (value instanceof String && " ".equals(value)) {
            value = "";
        }
        return super.put(key, value); // 원본 키로 저장
    }

    /**
     * 해당 키의 대/소문자가 이미 있으면 삭제한 후 넣음. (중복 키 방지)
     * putAll 시 사용되는 메서드
     */
    @Override // ListOrderedMap의 put(int index, K key, V value)를 오버라이드
    public Object put(int index, String key, Object value) {
        String lower = key.toLowerCase();
        String upper = key.toUpperCase();
        this.remove(lower);
        this.remove(upper);

        if (value instanceof String && " ".equals(value)) {
            value = "";
        }
        return super.put(index, key, value);
    }

    /**
     * Map 전체를 putAll 할 때 커스텀 put 로직 적용
     */
    @Override
    public void putAll(Map<? extends String, ?> map) { // 제네릭 명시
        for (Map.Entry<? extends String, ?> entry : map.entrySet()) {
            this.put(entry.getKey(), entry.getValue());
        }
    }

    // --- Map에 있던 유틸리티성 getter 메서드들을 CustomMap에도 추가 ---

    public String getString(String key) {
        return getString(key, "");
    }

    public String getString(String key, String def) {
        Object obj = this.get(key);
        String str = (obj == null) ? "" : String.valueOf(obj); // NPE 방지
        if (obj == null || "".equals(str)) {
            return def;
        } else {
            return str;
        }
    }

    public int getInt(String key) {
        return getInt(key, 0);
    }

    public int getInt(String key, int def) {
        Object obj = this.get(key);
        String str = (obj == null) ? "" : String.valueOf(obj);
        if (obj == null || "".equals(str)) {
            return def;
        } else {
            int idx = str.indexOf(".");
            if (idx != -1) {
                str = str.substring(0, idx);
            }
            try {
                return Integer.parseInt(str);
            } catch (NumberFormatException e) {
                return def; // 파싱 실패 시 기본값 반환
            }
        }
    }

    public double getDouble(String key) {
        return getDouble(key, 0.0);
    }

    public double getDouble(String key, double def) {
        Object obj = this.get(key);
        String str = (obj == null) ? "" : String.valueOf(obj);
        if (obj == null || "".equals(str)) {
            return def;
        } else {
            try {
                return Double.parseDouble(str);
            } catch (NumberFormatException e) {
                return def; // 파싱 실패 시 기본값 반환
            }
        }
    }

    public float getFloat(String key) {
        return getFloat(key, 0.0f);
    }

    public float getFloat(String key, float def) {
        Object obj = this.get(key);
        String str = (obj == null) ? "" : String.valueOf(obj);
        if (obj == null || "".equals(str)) {
            return def;
        } else {
            try {
                return Float.parseFloat(str);
            } catch (NumberFormatException e) {
                return def; // 파싱 실패 시 기본값 반환
            }
        }
    }

    public BigDecimal getBigDecimal(String key) {
        String value = getString(key);
        return value.isEmpty() ? BigDecimal.ZERO : new BigDecimal(value);
    }

    public List<CustomMap> getList(String key) {
        Object obj = this.get(key);
        if (!(obj instanceof List)) {
            return new ArrayList<>(); // List가 아니면 빈 리스트 반환
        }
        List<?> rawList = (List<?>) obj;
        List<CustomMap> newList = new ArrayList<>();
        for (Object item : rawList) {
            if (item instanceof Map) {
                newList.add(new CustomMap((Map<String, ?>) item));
            }
        }
        return newList;
    }

    public String[] getStringArray(String key) {
        Object obj = this.get(key);
        if (obj instanceof String[]) {
            return (String[]) obj;
        } else if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            return list.stream()
                    .map(String::valueOf)
                    .toArray(String[]::new);
        }
        return new String[0];
    }

    public int[] getIntArray(String key) {
        Object obj = this.get(key);
        if (obj instanceof int[]) {
            return (int[]) obj;
        } else if (obj instanceof String[]) {
            String[] arr = (String[]) obj;
            int[] newArr = new int[arr.length];
            for (int i = 0; i < arr.length; i++) {
                try {
                    newArr[i] = Integer.parseInt(arr[i]);
                } catch (NumberFormatException e) {
                    newArr[i] = 0; // 파싱 실패 시 0으로 처리
                }
            }
            return newArr;
        } else if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            return list.stream()
                    .mapToInt(o -> {
                        try {
                            return Integer.parseInt(String.valueOf(o));
                        } catch (NumberFormatException e) {
                            return 0;
                        }
                    })
                    .toArray();
        }
        return new int[0];
    }

    public CustomMap getMap(String key) {
        Object obj = this.get(key);
        if (obj instanceof Map) {
            return new CustomMap((Map<String, ?>) obj);
        }
        return new CustomMap(); // Map이 아니면 빈 CustomMap 반환
    }

    // toString() 메서드는 Gson 사용 없이 기본 Map.toString()을 사용하거나
    // @Override public String toString() { return super.toString(); } 으로 변경
    // 또는 Lombok @ToString 사용
    // Gson 의존성이 불필요하다면 제거
    @Override
    public String toString() {
        return super.toString(); // ListOrderedMap의 toString() 사용
    }

}
