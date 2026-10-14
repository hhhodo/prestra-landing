# PRESTRA — 정밀 제조 랜딩페이지

Figma(ABBG_AI-BM, node 1286:2)를 제조업 콘텐츠로 재구성한 원페이지 랜딩.

## Variant memo
typo=loud / image=high / color=dominant / image-radius=soft / card-radius=soft / button-radius=round / border=hairline / button-style=solid+outline / fw=500/400 / spacing=space-11

## Layout
| Section | Container | Split |
|---|---|---|
| Header | full-bleed | pill nav |
| Hero | full-bleed | 6×4 반원 패턴 + 라벨 |
| Direct | full-bleed | 5-7 |
| Custom | wide | 3-3-3-3 (반원 아치) |
| Statement | full-bleed | 중앙 + 오프셋 이미지 |
| Network | wide + full-bleed map | 헤더 + 반원 도트 월드맵 (인라인 SVG, 1260 dots) |
| Impact | full-bleed | 7-5 |
| Newsroom | wide | 8-4 |
| Footer | default | 4-8 |

## Notes
- Global Network 맵: 이미지 없이 인라인 SVG `<use>` 로 도트마다 직접 그림. 히어로의 반원 3종(우·하·상)을 열 순서(3n+1/3n+2/3n)대로 적용, 하이라이트 도트만 #54b3ff.
- 히어로: 100vh 풀스크린, 3행 고정·열 수는 화면비에 맞춰 JS가 계산(1920×1080 → 7열). 로드 시 점→반원 확대(열/행 스태거), 스크롤 초반 1/3 구간에서 반원→점 축소, 점은 완전히 사라지고, 이후 Direct → Custom 패널이 가로로 이동하는 핀 스크롤(≥1025px). 1024px 이하는 세로 스택.
- 그 외 상세 애니메이션(텍스트 분해 등)은 후속 작업.
- 뉴스룸 슬라이드 도트는 치트시트 금지 규칙(pagination)에 따라 제외.
- 이미지: `assets/images/` (Figma에서 추출, jpg 변환).
- 히어로 마우스 오버: 커서가 올라간 칸의 반원만 원으로 변함 (색 변화 없음, hover 지원 기기만).
- 스티키: 가로 핀 구간은 화면마다 멈춤 구간을 두고(히어로 → 홀드 → Direct 홀드 → Custom 홀드), Impact는 400vh 스티키 스테이지(≥1025px).
- Custom 아치 호버: 반원 → 원으로 변하면서 이미지 확대.
- 커스텀 커서: 파란 원(#54b3ff) + 이동 궤적 라인(3px, 불투명 100%, 꼬리가 뾰족하게 가늘어지며 0.45초에 걸쳐 사라짐). hover 지원 기기에서만 동작, reduced-motion이면 궤적 생략.
- Statement: 500vh 스크롤 스테이지(스티키). 스크롤 진행도에 따라 가운데 카피 4종이 교체되고, 이미지 4장이 스크롤에 맞춰 차례로 화면 아래에서 위로 쭉 올라가 사라짐. (이미지 3·4는 기존 에셋 재사용)
- Network: 라벨·CTA 제거(타이틀+본문만). 맵은 반원 도트를 셀 크기 그대로 맞붙여(여백 없음) 타일링, 호버 시 해당 도트만 원으로 변환. 한국·미국 하이라이트 도트를 점선 아크 2개로 연결하고 화살표가 서로 반대 방향으로 이동, 두 점에는 펄스 링.
- Network 맵 수정: 파란 도트 2개만 반원 유지, 나머지는 78% 크기의 원(도트 간 여백). 호버 시 원이 살짝 커짐.
- Impact: 스티키 상태에서 스크롤하면 배경 블러(50→0px)가 풀리고, 좌상단 리스트 라인이 하나씩 채워진 뒤 다음 화면으로 이동. 버튼 제거, 배경은 hero-nuts.jpg.
- Impact 재구성: 3개 화면(협력사 상생/지역사회/지속가능성). 각 화면마다 블러가 풀리고 해당 라인이 채워지면 다음 화면으로 전환. 배경은 고해상도 원본(2400px)만 사용. 2번째 화면은 1번 이미지를 크롭/확대한 것이라 교체용 고해상도 사진이 있으면 impact-partner 대신 넣을 것.
