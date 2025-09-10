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
 * - period 값은 Service에서 정규화 (week/month/year)
 * - 추가: 기간 범위 필터(startDate, endDate) 지원
 *
 * 사용 예:
 *  - GET /api/dashboard/quality?period=month&startDate=2023-01-01&endDate=2023-06-30
 *  - GET /api/dashboard/delivery?period=week&startDate=2024-01-01&endDate=2024-03-31
 *  - GET /api/dashboard/defect-cause?period=year&startDate=2021-01-01&endDate=2025-12-31
 *  - GET /api/dashboard/product-delivery?period=month&startDate=2025-01-01&endDate=2025-09-30
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
    public List<QualityTrendRow> getQuality(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        return dashboardService.getQualityTrend(period, startDate, endDate);
    }

    /** G2: 납품 현황 (건수 + 수량) */
    @GetMapping("/delivery")
    public List<DeliveryComboRow> getDelivery(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        return dashboardService.getDeliveryStatus(period, startDate, endDate);
    }

    /** G3: 불량 원인 분석 (뚜껑 손상 vs 몸통 찌그러짐) */
    @GetMapping("/defect-cause")
    public List<DefectCauseRow> getDefectCause(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        return dashboardService.getDefectCause(period, startDate, endDate);
    }

    /** G4: 제품별 납품 현황 (바나나/딸기/메로나) */
    @GetMapping("/product-delivery")
    public List<ProductDeliveryRow> getProductDelivery(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        return dashboardService.getProductDelivery(period, startDate, endDate);
    }
}
