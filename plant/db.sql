CREATE TABLE menu_tbl /* 메뉴테이블 */ (
	menu_name varchar(255) NOT NULL, /* 메뉴명 */
	menu_id varchar(8) NOT NULL, /* 메뉴아이디 */
	menu_url varchar(255) NOT NULL, /* 메뉴URL */
	menu_level varchar(2) NOT NULL, /* 메뉴레벨 */
	menu_prnt_id varchar(8) NOT NULL, /* 메뉴상위ID */
	menu_level_order int NOT NULL, /* 메뉴레벨순서 */
	menu_yn varchar(1) NULL, /* 메뉴사용유무 */
	CONSTRAINT menu_tbl_pk PRIMARY KEY (menu_id)
);

CREATE TABLE rol_tbl /* 롤테이블 */ (
	rol_grade varchar(50) NOT NULL, /* 롤등급 */
	rol_yn varchar(1) NULL, /* 롤사용유무 */
	CONSTRAINT rol_tbl_pk PRIMARY KEY (rol_grade)
);

CREATE TABLE menu_prms_tbl /* 메뉴권한테이블 */ (
	rol_grade varchar(50) NULL, /* 롤등급 */
	menu_id varchar(8) null, /* 메뉴아이디 */
	FOREIGN KEY (rol_grade) REFERENCES rol_tbl (rol_grade),
	FOREIGN KEY (menu_id) REFERENCES menu_tbl (menu_id)	
);

CREATE TABLE user_tbl /* 사용자테이블 */ (
	user_id varchar(20) NOT NULL, /* 사용자아이디 */
	user_pswr varchar(255) NOT NULL, /* 사용자패스워드 */
	user_name varchar(50) NOT NULL, /* 사용자명 */
	user_yn varchar(1) NULL, /* 사용자사용유무 */
	rol_grade varchar(50) null, /* 롤등급 */
	FOREIGN KEY (rol_grade) REFERENCES rol_tbl (rol_grade)
);

CREATE TABLE detection_log_tbl (
    input_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 촬영 시간
    product_code VARCHAR(50), -- 제품 코드
    product_result VARCHAR(20) NOT NULL, -- 검출 결과 (양품, 불량품, 보류)
    defect_type VARCHAR(100), -- 불량 유형
    confidence VARCHAR(100), -- 검출 확률
    user_id VARCHAR(20), -- 작업자 ID
    image_url VARCHAR(255) -- 제품 이미지 URL
);

ALTER TABLE user_tbl ADD COLUMN user_provider VARCHAR(50);
ALTER TABLE user_tbl ADD COLUMN user_provider_id VARCHAR(255);