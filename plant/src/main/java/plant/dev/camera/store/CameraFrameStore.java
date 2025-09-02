package plant.dev.camera.store;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;


/*
 * 카메라 프레임 저장소
 * - 최신 카메라 프레임(이미지 데이터)와 메타데이터를 메모리에 저장
 * - 여러 스레드에서 안전하게 읽고 쓸 수 있도록 AtomicReference 사용
 * ?? 메타데이터란? 이미지 자체 외에, 부가적인 정보를 담는 자료
 *
 * [역할]
 * - AIWorker/Python 등에서 업데이트한 마지막 프레임/메타를 보관
 * - CameraController에서 React 등 클라이언트 요청 시 전달
 *
 * [주의]
 * - 현재는 JPEG 형식으로 인코딩된 바이트 배열을 저장하지만,
 *   변수명은 포맷에 구애받지 않도록 lastFrame으로 명명
 * - 비즈니스 로직(불량 판정, 이미지 처리 등)은 다른 서비스/스레드에서 수행
 *
 * @author : yeonsu
 * @fileName : CameraFrameStore
 * @since : 250902
*/

@Component // 스프링 빈으로 등록
public class CameraFrameStore {

    // 마지막 프레임(JPEG등 이미지 데이터) 저장하는 변수
    private final AtomicReference<byte[]> lastFrame = new AtomicReference<>();

    // 마지막 메타데이터를 저장하는 변수 (불량 여부, score, timestamp 등)
    private final AtomicReference<Map<String, Object>> lastMeta = new AtomicReference<>();

    /*
    * 새로운 프레임과 메타데이터를 저장하는 메소드
    * @param frame : 최신 프레임 (이미지 바이트 배열)
    * @param meta : 최신 메타데이터 (예: 불량 여부, score, timestamp 등)
    */
    public void update(byte[] frame, Map<String, Object> meta) {
        // frame이 null이 아니고 길이가 0보다 크면 저장
        if (frame != null && frame.length > 0) lastFrame.set(frame);

        // 메타데이터가 null이 아니면 저장
        if (meta != null) lastMeta.set(meta);
    }

    /*
    * 최신 프레임 이미지를 반환
    * @return 이미지 바이트 배열 (없으면 null)
    */
    public byte[] getLastFrame() { return lastFrame.get(); }

    /*
    * 최신 메타데이터를 반환
    * @return Map 형식의 메타데이터 (없으면 null)
    */
    public Map<String, Object> getLastMeta() { return lastMeta.get(); }
}
