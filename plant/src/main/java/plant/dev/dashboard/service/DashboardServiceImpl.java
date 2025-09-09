package plant.dev.dashboard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plant.dev.dashboard.dto.DashboardDTO.DefectCauseRow;
import plant.dev.dashboard.dto.DashboardDTO.DeliveryComboRow;
import plant.dev.dashboard.dto.DashboardDTO.ProductDeliveryRow;
import plant.dev.dashboard.dto.DashboardDTO.QualityTrendRow;
import plant.dev.dashboard.mapper.DashboardMapper;

import java.util.List;
import java.util.Set;

/*
 * 대시보드 서비스 구현체
 * - periodType(week/month/year) 입력을 정규화하여 Mapper에 전달
 * - 읽기 전용 트랜잭션으로 성능/안정성 확보
 *
 * 사용 예) service.getQualityTrend("month")
 *
 * @author : yeonsu
 * @fileName : DashboardServiceImpl
 * @since : 250909
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 이 클래스 메소드들은 DB 읽기 전용으로 설정. 실수로 UPDATE/INSERT 되는걸 막음 
public class DashboardServiceImpl implements DashboardService {

    private final DashboardMapper dashboardMapper;

    // 허용 가능한 값 목록(상수) "week/month/year만 받으라는 뜻"
    private static final Set<String> ALLOWED_PERIODS = Set.of("week", "month", "year");

    /* 허용 외 값이 오면 month로 기본 처리 
     * 들어온 값이 null/공백/엉뚱한 값이면 "month"로 바꿔서 매퍼에 전달 = 입력방어막
     */
    private String normalize(String periodType) {
        if (periodType == null) return "month";
        String v = periodType.trim().toLowerCase();
        return ALLOWED_PERIODS.contains(v) ? v : "month";
    }

    @Override
    public List<QualityTrendRow> getQualityTrend(String periodType) {
        return dashboardMapper.selectQualityTrend(normalize(periodType));
    }

    @Override
    public List<DeliveryComboRow> getDeliveryStatus(String periodType) {
        return dashboardMapper.selectDeliveryStatus(normalize(periodType));
    }

    @Override
    public List<DefectCauseRow> getDefectCause(String periodType) {
        return dashboardMapper.selectDefectCause(normalize(periodType));
    }

    @Override
    public List<ProductDeliveryRow> getProductDelivery(String periodType) {
        return dashboardMapper.selectProductDelivery(normalize(periodType));
    }
}
