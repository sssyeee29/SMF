package plant;

import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;

public class JasyptEncryptor {
    public static void main(String[] args) {
        StandardPBEStringEncryptor jasypt = new StandardPBEStringEncryptor();

        // 1. application.properties에 설정된 마스터 키와 동일한 키를 입력합니다.
        jasypt.setPassword("plants");
        jasypt.setAlgorithm("PBEWithMD5AndDES"); // Jasypt 기본 알고리즘

        // 2. 암호화하려는 실제 username과 password를 입력합니다.
        String plainUsername = "recycling"; // 예: sa
        String plainPassword = "1234"; // 예: 1234

        // 3. 암호화된 결과를 생성하여 출력합니다.
        String encryptedUsername = jasypt.encrypt(plainUsername);
        String encryptedPassword = jasypt.encrypt(plainPassword);

        System.out.println("==================================================");
        System.out.println("생성된 암호화 값을 아래와 같이 application.properties에 적용하세요.");
        System.out.println("spring.datasource.username=ENC(" + encryptedUsername + ")");
        System.out.println("spring.datasource.password=ENC(" + encryptedPassword + ")");
        System.out.println("==================================================");
    }

}