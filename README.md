# ⛽ 서울지역 유가 통계 대시보드 (오피넷 자동 갱신)

한국석유공사 **오피넷(Opinet)**의 서울지역 보통휘발유, 자동차용경유, 자동차부탄(LPG) 월간 평균 판매가격을 시각화하고, 매월 1일 새로운 월 데이터를 자동으로 갱신하는 웹 대시보드입니다.

---

## 🚀 Vercel(버셀)로 1분 만에 배포하기 (추천 ⭐)

Vercel을 이용하면 무료로 고유 URL(`https://내프로젝트.vercel.app`)이 생성되어 회사 동료나 다른 사람들에게 바로 공유할 수 있습니다.

### 방법 1. GitHub 연동 배포 (가장 추천 - 매월 1일 자동 반영)
1. GitHub에 새 저장소(`fuel-dashboard`)를 생성하고 코드를 올립니다:
   ```bash
   cd C:\Users\User\.gemini\antigravity-ide\scratch\fuel-dashboard
   git init
   git add .
   git commit -m "Deploy to Vercel"
   git branch -M main
   git remote add origin https://github.com/{내깃허브아이디}/fuel-dashboard.git
   git push -u origin main
   ```
2. **[Vercel 대시보드](https://vercel.com/dashboard)** 접속 후 **[Add New...] > [Project]** 클릭
3. 방금 올린 `fuel-dashboard` 저장소를 선택하고 **[Deploy]** 클릭
4. **배포 완료!**
   - 발급된 `https://{프로젝트명}.vercel.app` 주소를 동료들에게 공유하세요.
   - 매월 1일 GitHub Actions가 `data.json`을 자동 갱신하면 **Vercel이 이를 감지하여 몇 초 만에 자동으로 최신 데이터로 재배포**됩니다.

---

### 방법 2. Vercel CLI로 즉시 배포 (GitHub 없이 컴퓨터에서 바로 배포)
```bash
# Vercel CLI 실행
npx vercel
```
화면의 안내에 따라 엔터 몇 번만 치면 즉시 공용 배포 URL이 생성됩니다.

---

## ✨ 주요 기능

1. **매월 1일 완전 자동 갱신 (서버 비용 0원)**
   - 매월 1일 오피넷에서 전월 데이터를 자동 수집 및 누적 업데이트
2. **인터랙티브 유가 차트 & KPI 요약**
   - 보통휘발유, 경유, 부탄 월간 변동 추이 차트 및 전월 대비 등락폭(▲/▼)
3. **게시판 1-클릭 복사 모달**
   - 사내 게시판용 본문형, 마크다운 표, 일반 텍스트 원클릭 복사
4. **월별 상세 통계표 및 검색/CSV 저장**
   - 연도별 필터링, 검색, 엑셀 호환 CSV 다운로드 지원
5. **다크 모드 / 라이트 모드 & 모바일/PC 반응형 지원**

---

## 📁 파일 구조

```
fuel-dashboard/
├── .github/
│   └── workflows/
│       └── auto_update.yml  # 매월 1일 자동 실행 CI/CD 워크플로우
├── vercel.json              # Vercel 배포 설정 파일
├── index.html               # 대시보드 웹페이지
├── style.css                # 모던 글래스모피즘 스타일시트
├── app.js                   # 차트 및 인터랙션 로직
├── data.json                # 2024~2026 오피넷 월간 유가 데이터베이스
├── update_data.py           # 오피넷 최신 유가 자동 수집 스크립트
└── README.md                # 배포 가이드
```
