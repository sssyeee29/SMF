package plant.dev.dashboard.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import plant.dev.dashboard.dto.DashboardDTO.*;

import java.util.List;

@Mapper
public interface DashboardMapper {

    // G1 정상/불량 건수
    List<QualityTrendRow> selectQualityTrend(
            @Param("periodType") String periodType,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate
    );

    // G2 납품 현황
    List<DeliveryComboRow> selectDeliveryStatus(
            @Param("periodType") String periodType,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate
    );

    // G3 불량 원인 분석
    List<DefectCauseRow> selectDefectCause(
            @Param("periodType") String periodType,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate
    );

    // G4 제품별 납품 현황
    List<ProductDeliveryRow> selectProductDelivery(
            @Param("periodType") String periodType,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate
    );
}
