package plant.dev.dashboard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plant.dev.dashboard.dto.DashboardDTO.DefectCauseRow;
import plant.dev.dashboard.dto.DashboardDTO.DeliveryComboRow;
import plant.dev.dashboard.dto.DashboardDTO.ProductDeliveryRow;
import plant.dev.dashboard.dto.DashboardDTO.QualityTrendRow;
import plant.dev.dashboard.mapper.DashboardMapper;

import java.util.*;
import java.util.stream.Collectors;

/*
 * 대시보드 서비스 구현체
 * - periodType(week/month/year)을 정규화해서 Mapper에 전달
 * - 연간(year)일 때만 2021~2024 더미 + 2025 라이브(DB) 병합 (동일 키는 라이브 우선)
 * - 읽기 전용 트랜잭션
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final DashboardMapper dashboardMapper;

    private static final Set<String> ALLOWED_PERIODS = Set.of("week", "month", "year");

    private String normalize(String periodType) {
        if (periodType == null) return "month";
        String v = periodType.trim().toLowerCase();
        return ALLOWED_PERIODS.contains(v) ? v : "month";
    }

    @Override
    public List<QualityTrendRow> getQualityTrend(String periodType, String startDate, String endDate) {
        return dashboardMapper.selectQualityTrend(normalize(periodType), startDate, endDate);
    }

    @Override
    public List<DeliveryComboRow> getDeliveryStatus(String periodType, String startDate, String endDate) {
        return dashboardMapper.selectDeliveryStatus(normalize(periodType), startDate, endDate);
    }

    @Override
    public List<DefectCauseRow> getDefectCause(String periodType, String startDate, String endDate) {
        return dashboardMapper.selectDefectCause(normalize(periodType), startDate, endDate);
    }

    @Override
    public List<ProductDeliveryRow> getProductDelivery(String periodType, String startDate, String endDate) {
        return dashboardMapper.selectProductDelivery(normalize(periodType), startDate, endDate);
    }
}