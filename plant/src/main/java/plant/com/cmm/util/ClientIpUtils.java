package plant.com.cmm.util;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ClientIpUtils {

    public static String getClientIp(HttpServletRequest request) {
        String[] headersToCheck = {
                "X-Forwarded-For",
                "x-real-ip",
                "x-original-forwarded-for",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_X_FORWARDED_FOR",
                "HTTP_X_FORWARDED",
                "HTTP_X_CLUSTER_CLIENT_IP",
                "HTTP_CLIENT_IP",
                "HTTP_FORWARDED_FOR",
                "HTTP_FORWARDED",
                "HTTP_VIA"
        };

        for (String header : headersToCheck) {
            String ipList = request.getHeader(header);
            if (ipList != null && !ipList.isEmpty() && !"unknown".equalsIgnoreCase(ipList)) {
                String[] ips = ipList.split(",");
                for (String ip : ips) {
                    ip = ip.trim();
                    if (isValidIPv4(ip)) {
                        return ip;
                    }
                }
            }
        }

        // fallback
        String remoteAddr = request.getRemoteAddr();
        if (isValidIPv4(remoteAddr)) {
            return remoteAddr;
        }

        return null;
    }

    private static boolean isValidIPv4(String ip) {
        if (ip == null || ip.isEmpty()) return false;
        String[] parts = ip.split("\\.");
        if (parts.length != 4) return false;

        for (String part : parts) {
            try {
                int num = Integer.parseInt(part);
                if (num < 0 || num > 255) return false;
            } catch (NumberFormatException e) {
                return false;
            }
        }

        return true;
    }
}
