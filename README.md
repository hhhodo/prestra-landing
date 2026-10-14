# PRESTRA — 정밀 제조 랜딩페이지

Figma(ABBG_AI-BM, node 1286:2)를 제조업 콘텐츠로 재구성한 원페이지 랜딩.

## Variant memo
typo=loud / image=high / color=dominant / image-radius=soft / card-radius=soft / button-radius=round / border=hairline / button-style=solid+outline / fw=600/400 / spacing=space-11

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
- 상세 애니메이션(히어로 3-state 전환, 텍스트 분해 등)은 후속 작업. 현재는 마퀴/리빌만.
- 뉴스룸 슬라이드 도트는 치트시트 금지 규칙(pagination)에 따라 제외.
- 이미지: `assets/images/` (Figma에서 추출, jpg 변환).
