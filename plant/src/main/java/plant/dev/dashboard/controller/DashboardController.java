package plant.dev.dashboard.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import plant.dev.dashboard.service.DashboardService;
import plant.dev.dashboard.dto.DashboardDTO.*;

import java.util.List;

/*
 * 대시보드 API 컨트롤러
 * - Service 계층을 호출해 주/월/년(period) 단위로 집계된 대시보드 데이터를 반환
 * - 각 그래프 유형별로 별도 엔드포인트 제공(G1~G4)
 * - period 값이 이상하게 들어와도 Service에서 week/month/year로 정규화 처리
 *
 * 사용 예:
 *  - GET /api/dashboard/quality?period=month
 *  - GET /api/dashboard/delivery?period=week
 *  - GET /api/dashboard/defect-cause?period=year
 *  - GET /api/dashboard/product-delivery?period=month
 *
 * 주의:
 *  - 본 컨트롤러는 "표시 단위(주/월/년)"만 제어함.
 *  - 기간 '범위'(from/to)를 제한하려면 Mapper/XML에 WHERE 조건을 추가해야 함.
 *
 * @author : yeonsu
 * @fileName : DashboardController
 * @since : 250909
 */

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardController {

    private final DashboardService dashboardService;

    /** G1: 정상/불량 건수 (+불량률) */
    @GetMapping("/quality")
    public List<QualityTrendRow> getQuality(@RequestParam(defaultValue = "month") String period) {
        return dashboardService.getQualityTrend(period); // 서비스에서 week/month/year 정규화됨
    }

    /** G2: 납품 현황 (건수 + 수량) */
    @GetMapping("/delivery")
    public List<DeliveryComboRow> getDelivery(@RequestParam(defaultValue = "month") String period) {
        return dashboardService.getDeliveryStatus(period);
    }

    /** G3: 불량 원인 분석 (뚜껑 손상 vs 몸통 찌그러짐) */
    @GetMapping("/defect-cause")
    public List<DefectCauseRow> getDefectCause(@RequestParam(defaultValue = "month") String period) {
        return dashboardService.getDefectCause(period);
    }

    /** G4: 제품별 납품 현황 (바나나/딸기/메로나) */
    @GetMapping("/product-delivery")
    public List<ProductDeliveryRow> getProductDelivery(@RequestParam(defaultValue = "month") String period) {
        return dashboardService.getProductDelivery(period);
    }
}
