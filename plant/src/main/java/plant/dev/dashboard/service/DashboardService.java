package plant.dev.dashboard.service;

import plant.dev.dashboard.dto.DashboardDTO.DeliveryComboRow;
import plant.dev.dashboard.dto.DashboardDTO.ProductDeliveryRow;
import plant.dev.dashboard.dto.DashboardDTO.QualityTrendRow;
import plant.dev.dashboard.dto.DashboardDTO.DefectCauseRow;

import java.util.List;

/*
 * 대시보드 서비스 인터페이스
 * - 주/월/년(periodType)에 따른 집계 데이터 조회
 * - Mapper 호출을 추상화하여 Controller에서 사용하기 쉽게 제공
 *
 * @author : yeonsu
 * @fileName : DashboardService
 * @since : 250909
 */
public interface DashboardService {

    /** G1: 정상/불량 건수(불량률 포함) */
    List<QualityTrendRow> getQualityTrend(String periodType);

    /** G2: 납품 현황(건수 + 수량) */
    List<DeliveryComboRow> getDeliveryStatus(String periodType);

    /** G3: 불량 원인 분석(뚜껑 손상 vs 몸통 찌그러짐) */
    List<DefectCauseRow> getDefectCause(String periodType);

    /** G4: 제품별 납품 현황(바나나/딸기/메로나) */
    List<ProductDeliveryRow> getProductDelivery(String periodType);
}
