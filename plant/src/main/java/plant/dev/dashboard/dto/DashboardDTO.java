package plant.dev.dashboard.dto;

/*
 * 대시보드 응답 DTO 모음
 * - MyBatis 매핑 결과를 담는 데이터 전송 객체(Record) 정의
 * - 각 그래프 유형별로 필요한 필드만 포함
 * - SQL alias와 동일한 필드명으로 선언해야 자동 매핑 가능
 *
 * @author : yeonsu
 * @fileName : DashboardDTO
 * @since : 250909
 */

public final class DashboardDTO {

    // G1. 정상/불량 건수 (불량률 포함)
    public record QualityTrendRow(
            String period,      // 집계 구간 (예: 2025-08)
            long normal,        // 정상 건수
            long defect,        // 불량 건수
            double defectRatePct // 불량률 (%)
    ) {}

    // G2. 납품 현황 (납품 건수 + 납품 수량)
    public record DeliveryComboRow(
            String period,        // 집계 구간
            long deliveredCount,  // 납품 건수 (행 수)
            long deliveredQty     // 납품 수량 합계
    ) {}

    // G3. 불량 원인 분석 (뚜껑 손상 vs 몸통 손상)
    public record DefectCauseRow(
            String period,     // 집계 구간
            String causeCode,  // 불량 원인 코드 (Damage-A, Damage-B)
            long defectCount,  // 원인별 불량 건수
            double sharePct    // 해당 원인의 비중(%), 필요 없으면 0 또는 제외 가능
    ) {}

    public record DefectCausePivotRow(
            String period,     // 집계 구간
            long capDamage,    // 뚜껑 손상 건수
            long bodyDamage    // 몸통 손상 건수
    ) {}


    // G4. 제품별 납품 현황 (바나나/딸기/메로나)
    public record ProductDeliveryRow(
            String period,        // 집계 구간
            String productName,   // 제품명 (바나나, 딸기, 메로나)
            String productCode,   // 제품코드 (옵션: BAN001 등)
            long deliveredCount,  // 납품 건수
            long deliveredQty     // 납품 수량
    ) {}
}
