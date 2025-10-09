
# 📦 Smart Milk Factory Project -- 비전을 통한 우유 불량 검출 프로젝트
<img width="1620" height="613" alt="image" src="https://github.com/user-attachments/assets/303132d0-5272-456c-b259-810900425070" />
<img width="1620" height="556" alt="image" src="https://github.com/user-attachments/assets/2183915e-ff59-4580-8cd6-df2992cc8db6" />  

---

## 📑 목차
- [개발 배경](#개발-배경-불량-검출도-이젠-ai)
- [프로젝트 목표](#-프로젝트-목표)
- [시작 가이드](#-시작-가이드-smart-milk-factory)
- [기술 스텍](#-기술-스텍-smart-milk-factory)
- [주요 기능](#-주요-기능)
- [설계 문서](#-설계-문서)
- [화면 예시](#-화면-예시)
---


## 개발 배경: "불량 검출도 이젠 AI"
<img width="124" height="92" alt="image" src="https://github.com/user-attachments/assets/5b3d955c-b708-4e08-92e1-114dc8e6b64b" />

식품 산업에서 불량 제품은 소비자 신뢰를 떨어뜨리고 기업에 손실을 초래하는 중요한 문제입니다.  
특히 신선식품인 우유는 유통 과정에서 포장 손상이나 찌그러짐 등 다양한 불량이 발생할 수 있습니다.  
기존의 육안 검사 방식은 시간이 오래 걸리고 정확도가 낮아 대량 생산 환경에 적합하지 않습니다.  
이에 따라 AI와 컴퓨터 비전 기술을 활용해 불량을 실시간으로 탐지하고 자동화하는 스마트 밀크 프로젝트를 기획하게 되었습니다.



---


## 👨‍👩‍👧‍👦 팀 소개

- **김용석 (팀장, BE)** : 창고 관리 시스템 설계, DB 연동, 로직 구현, 3D UI 디자인  
- **이은지 (팀원, FE)** : 프론트엔드 & 웹 개발, 사용자 UI/UX 구현  
- **이연수 (팀원, BE)** : 대시보드 차트화 개발, 일정관리, 문서 작업, 프로젝트 PPT 제작  
- **이용오 (팀원, BE)** : 로그인/로그 관리, XSS 방지, JWT 인증 구현  
- **차누리 (팀원, BE)** : 웹 화면 구현, 하드웨어 제어, 라즈베리파이 + 컨베이어벨트 제어, 모바일 환경 구축




## 🛠 백엔드 공통 역할

- 데이터 수집부터 모델 학습, 검증까지 파이프라인 구현  
- 데이터 구축, 전처리 → 학습, 평가까지 일괄 수행  
- AI 개발의 전 단계를 자체적으로 완성  
- CVAT을 활용한 라벨링 및 데이터셋 구축


---


## 🎯 프로젝트 목표
 - AI 비전으로 우유 불량을 실시간·고정도 자동 검출  
 - 대시보드 알림으로 즉시 대응 ➜ 검사 효율·품질 안정성 향상  


###  정량 KPI
- 정확도 : **mAP50 ≥ 0.92, Precision ≥ 0.93, Recall ≥ 0.92**  
- 성능 : **처리속도 ≤ 200ms/frame, 처리량 ≥ 10 FPS**  


###  기능 목표
- 맛 분류 : 바나나 / 딸기 / 메로나  
- 불량 탐지 : 뚜껑 불량, 몸체 손상 탐지  
- 실시간 분석 및 대시보드 리포트 자동화  


### 데이터·모델 목표
- 클래스별 ≥ **2,000장**  
- **YOLOv8 기반 학습**  


###  시스템 목표
- **Spring Boot + Raspberry Pi (Flask 연동)**  
- **JWT 보안·권한 관리**

---

# 🚀 시작 가이드 (Smart Milk Factory)

## Requirements
For building and running the application you need:

- [Python 3.10+](https://www.python.org/downloads/release/python-3100/)  (YOLOv8 + Flask)  
- [Node.js 18+](https://nodejs.org/en/) & [Npm 9+](https://www.npmjs.com/)  (React 프론트엔드)  
- [Spring Boot 3.2+](https://spring.io/projects/spring-boot)  (Backend API 서버)  
- [MySQL 8.0+](https://dev.mysql.com/downloads/mysql/)  (Database)  

---

## Installation

```bash
$ git clone https://github.com/your-org/smf-project.git
$ cd smf-project
Backend (Spring Boot)
bash
코드 복사
$ cd smf-backend
$ ./mvnw clean install   # Maven 빌드
$ ./mvnw spring-boot:run # Spring Boot 실행
환경설정: application.yml에서 MySQL 연결 정보 입력

기본 포트: 8080

AI Microservice (Flask + YOLOv8)
bash
코드 복사
$ cd smf-ai
$ python -m venv venv
$ source venv/bin/activate  # Windows: venv\Scripts\activate
$ pip install -r requirements.txt
$ python app.py
모델 가중치 파일 best.pt → /weights 폴더에 위치

기본 포트: 5000

Frontend (React + Node.js)
bash
코드 복사
$ cd smf-frontend
$ npm install
$ npm run dev

API 연동: Spring Boot (http://localhost:8080), Flask (http://localhost:5000)

Database (MySQL)
sql
코드 복사
CREATE DATABASE smf;
smf DB 생성 후 schema.sql 실행

초기 데이터 필요 시 data.sql 참고

System Flow
Raspberry Pi → 우유병 이미지 캡처 → Flask AI 서버 전송

Flask (YOLOv8) → 불량 탐지 후 JSON 반환

Spring Boot → DB 저장 및 대시보드 API 제공

React Frontend → KPI 차트 & 3D 창고 시각화  
```
---


## 🐄 기술 스텍 (Smart Milk Factory)

## Environment
![VSCode](https://img.shields.io/badge/Visual%20Studio%20Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

## Config
![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white)



## Development
![Java](https://img.shields.io/badge/Java-007396?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![YOLOv8](https://img.shields.io/badge/YOLOv8-00FFFF?style=for-the-badge&logo=opencv&logoColor=black)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

## Communication & Collaboration
![Confluence](https://img.shields.io/badge/Confluence-172B4D?style=for-the-badge&logo=confluence&logoColor=white)
![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

---
## 📂 주요 기능

창고 관리 시스템 : DB 기반 로직 처리 + 3D UI 시각화

프론트엔드 : React 기반 UI/UX 개발

대시보드 : 실시간 차트, 일정 관리, 알림 기능

보안 : JWT 인증, XSS 방어

하드웨어 제어 : 라즈베리파이 + 컨베이어벨트, 모바일 환경

---
## 📁 설계 문서

<!-- 설계 문서: 화살표(▶) 클릭하면 펼쳐짐 -->
<details>
  <summary><b>📐 설계 문서 보기</b> 시퀀스 다이어그램, ERD, WBS, 요구사항 정의서, 클래스 다이어그램)</summary>

  <br>


  ### 🗄 요구사항 정의서 & WBS
 <img width="3551" height="1585" alt="image" src="https://github.com/user-attachments/assets/e21808f0-cba1-4d38-aa8b-74606165aad6" />
<img width="3551" height="1584" alt="image" src="https://github.com/user-attachments/assets/4b3d549f-1405-4616-a103-06d47bdb61b9" />

  ### 📚 ERD & 클래스 다이어그램
  <img width="1205" height="1367" alt="image" src="https://github.com/user-attachments/assets/8ee6d04e-085b-4f98-8e5a-12d4478cf2f9" />
 <img width="3551" height="1611" alt="image" src="https://github.com/user-attachments/assets/b3ec5112-8b86-4940-ac5c-f4b8bb81fe7c" />

  ### 🔧 시퀀스 다이어그램 (PlantUML / Mermaid)
  ```mermaid
  sequenceDiagram
    participant Pi as Raspberry Pi
    participant AI as Flask/YOLOv8
    participant BE as Spring Boot
    participant FE as React
    Pi->>AI: 이미지 업로드
    AI-->>BE: 탐지 결과 JSON
    BE-->>FE: 대시보드 업데이트
```
 ### 진행 절차
 <img width="1820" height="810" alt="image" src="https://github.com/user-attachments/assets/7305b19f-17e8-4a05-829a-480ae76f2235" />
</details>

## 🖼 화면 예시

<details>
  <summary><b>📊 대시보드 페이지</b></summary>
  <br/>
  <div align="center">
   <img width="1838" height="601" alt="image" src="https://github.com/user-attachments/assets/87550299-4282-4444-9cac-188a5c946fe0" />
  <img width="1789" height="590" alt="image" src="https://github.com/user-attachments/assets/9fb35e1c-a50f-41cf-8bcd-6d339de92f15" />

  </div>
  <br/>
  - 실시간 차트 및 납품 기록 표시
</details>


<details>
  <summary><b>📑 로그 페이지</b></summary>
  <br/>
  <div align="center">
    <img width="1166" height="660" alt="image" src="https://github.com/user-attachments/assets/701e2f40-f233-4b08-97cc-5c713252fc0d" />

  </div>
  <br/>
  - 불량 탐지 및 시스템 이벤트 기록  
  - 사용자 및 권한 로그 확인  
</details>

<details>
  <summary><b>🏭 창고 페이지</b></summary>
  <br/>
  <div align="center">
    <img width="1042" height="829" alt="image" src="https://github.com/user-attachments/assets/71bf2170-fa6c-456e-9f22-74e6955a6220" />
    <img width="962" height="778" alt="image" src="https://github.com/user-attachments/assets/92b45355-052c-492d-bc6a-e6936078647f" />
    <img width="895" height="745" alt="image" src="https://github.com/user-attachments/assets/4e2ce58c-0c98-420e-9c0e-b8a4eed6e046" />

  </div>
  <br/>
  - React-Three-Fiber 기반 3D 시각화  
  - A/B/C/D 구역 및 Defect Zone 표시  
</details>



<details>
  <summary><b>⚙️ 설정 페이지</b></summary>
  <br/>
  <div align="center">
    <img width="1797" height="788" alt="image" src="https://github.com/user-attachments/assets/268e732f-c1e9-4fd4-9b32-23ea18bceb47" />

  </div>
  <br/>
  - 계정 및 권한 관리  
  - 알림 정책 및 파라미터 설정  
</details>



<details>
  <summary><b>📱 모바일 웹 페이지</b></summary>
  <br/>
  <div align="center">
    <img width="1769" height="707" alt="image" src="https://github.com/user-attachments/assets/31892aac-b1ff-4715-8652-5e5b7cb134db" />

  </div>
  <br/>
  - 반응형 UI 지원  
  - 모바일 환경에서 주요 기능 확인 가능  
</details>
