THE DWELLER'S GUIDE TO THE DESIRE — 사이트 원본 파일 (2026.11.24 기준)

구성
- index.html          메인 페이지
- assets/app.js       도면 클라우드·상세페이지 본체
- assets/trend.js     실시간 검색어 화면, 날짜별 아카이브, 상세페이지 추가 기능
- assets/theme.css    전체 디자인 수정분 / trend.css, intro.css, index.css 기본 스타일
- assets/intro.js     첫 화면 인트로
- assets/drive-plans.js, plans.json   도면 목록 데이터(검색어·욕망·세계관·기사)
- assets/process.json                DETAILS 과정 기록(01 사회 분석 → 02 세계관 → 03 공간 설계)
- assets/plans/*.jpg                 평면도 이미지 357장
- assets/fonts/                      DepartureMono 폰트(라이선스 포함)

여는 법
index.html을 더블클릭하면 일부 기능(모듈 스크립트, 과정 기록 불러오기)이 막힙니다.
폴더 안에서 간단한 로컬 서버로 여세요. 예) 터미널에서
  python3 -m http.server 8000
실행 후 브라우저로 http://localhost:8000 접속.
