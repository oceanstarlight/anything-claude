/* 검사 데이터: 성향 축, 문항, AI 유형 */
(function (root) {
  var AIQ = root.AIQ || (root.AIQ = {});

  // 5가지 성향 축 (0 = 왼쪽, 100 = 오른쪽)
  AIQ.AXES = [
    { key: 'bold', left: '신중', right: '과감' },
    { key: 'heart', left: '논리', right: '감성' },
    { key: 'verbose', left: '핵심만', right: '풍부하게' },
    { key: 'play', left: '진지', right: '장난' },
    { key: 'exp', left: '정석', right: '실험' }
  ];

  // 20문항. d = 축별 점수 변화
  AIQ.QUESTIONS = [
    {
      q: '주말에 갑자기 하루가 통째로 비었다!',
      a: [
        { t: '저장해둔 맛집 리스트를 꺼낸다', d: { bold: -1, exp: -1 } },
        { t: '일단 나가서 발길 닿는 대로 간다', d: { bold: 2, exp: 1 } },
        { t: '요즘 꽂힌 주제를 끝까지 파본다', d: { verbose: 1, exp: 1, bold: -1 } },
        { t: '단톡방에 "뭐해?" 를 보낸다', d: { heart: 1, play: 1 } }
      ]
    },
    {
      q: '친구가 밤늦게 고민 상담을 해왔다. 나는…',
      a: [
        { t: '끝까지 들어주고 마음부터 알아준다', d: { heart: 2 } },
        { t: '원인을 분석하고 해결책 세 개를 정리해준다', d: { heart: -2, verbose: 1 } },
        { t: '웃긴 얘기로 기분부터 풀어준다', d: { play: 2 } },
        { t: '"솔직히 너도 잘못 있어" 라고 말해준다', d: { bold: 2, heart: -1 } }
      ]
    },
    {
      q: '단톡방에서 내 메시지 스타일은?',
      a: [
        { t: '"ㅇㅇ" "ㄱㄱ" 초간단', d: { verbose: -2 } },
        { t: '할 말을 정리해서 한 번에 길게', d: { verbose: 2 } },
        { t: '짤과 이모티콘으로 대화한다', d: { play: 2 } },
        { t: '조용히 읽다가 필요할 때만 등판', d: { verbose: -1, bold: -1 } }
      ]
    },
    {
      q: '처음 보는 신기한 가전을 샀다.',
      a: [
        { t: '설명서부터 정독한다', d: { bold: -2, exp: -1 } },
        { t: '일단 버튼을 전부 눌러본다', d: { bold: 1, exp: 2 } },
        { t: '리뷰 영상 몇 개를 비교해보고 쓴다', d: { verbose: 1, bold: -1 } },
        { t: '속이 어떻게 생겼는지 궁금해서 뜯어본다', d: { exp: 2, play: 1 } }
      ]
    },
    {
      q: '팀 프로젝트에서 나는 주로…',
      a: [
        { t: '일정표와 역할 분담을 정리하는 사람', d: { bold: -1, play: -1, exp: -1 } },
        { t: '아이디어를 마구 던지는 사람', d: { bold: 1, exp: 1, play: 1 } },
        { t: '분위기를 살리는 사람', d: { heart: 1, play: 1 } },
        { t: '말없이 결국 다 해내는 사람', d: { bold: 1, heart: -1, verbose: -1 } }
      ]
    },
    {
      q: '누군가 틀린 정보를 아주 당당하게 말한다.',
      a: [
        { t: '근거 링크를 조용히 보내준다', d: { heart: -1, play: -1, bold: -1 } },
        { t: '그 자리에서 바로 "그거 아닌데?"', d: { bold: 2 } },
        { t: '기분 상하지 않게 돌려서 말해준다', d: { heart: 2, verbose: 1 } },
        { t: '재밌으니까 일단 지켜본다', d: { play: 2 } }
      ]
    },
    {
      q: '마감 전날 밤, 나의 모습은?',
      a: [
        { t: '이미 다 끝내고 자고 있다', d: { bold: -2, play: -1 } },
        { t: '벼락치기 집중력이 폭발한다', d: { bold: 2 } },
        { t: '요약 노트를 예쁘게 만들고 있다', d: { verbose: 1, exp: -1 } },
        { t: '효율 좋은 공부법을 찾다가 새벽이 된다', d: { exp: 1, verbose: 1, play: 1 } }
      ]
    },
    {
      q: '여행 계획을 세우는 스타일은?',
      a: [
        { t: '분 단위로 정리한 엑셀 시트', d: { bold: -2, verbose: 1 } },
        { t: '비행기표만 끊고 나머지는 현지에서', d: { bold: 2, verbose: -1 } },
        { t: '현지인만 아는 골목을 찾아다닌다', d: { exp: 2 } },
        { t: '같이 가는 사람 취향에 맞춰준다', d: { heart: 2 } }
      ]
    },
    {
      q: '누가 나를 칭찬했을 때 반응은?',
      a: [
        { t: '"아니에요, 운이 좋았어요"', d: { bold: -1, heart: 1 } },
        { t: '"알아요 ㅎㅎ"', d: { bold: 1, play: 2 } },
        { t: '어떤 점이 좋았는지 구체적으로 물어본다', d: { verbose: 1, heart: -1 } },
        { t: '고맙다고 하고 바로 다음 일을 한다', d: { verbose: -2 } }
      ]
    },
    {
      q: '들었을 때 제일 기분 좋은 말은?',
      a: [
        { t: '"너랑 얘기하면 마음이 편해"', d: { heart: 2 } },
        { t: '"와, 진짜 똑똑하다"', d: { heart: -2 } },
        { t: '"너 진짜 웃겨"', d: { play: 2 } },
        { t: '"너한테는 믿고 맡길 수 있어"', d: { bold: -1, exp: -1 } }
      ]
    },
    {
      q: '물건을 고를 때 가장 중요한 건?',
      a: [
        { t: '오래 써도 검증된 스테디셀러', d: { exp: -2 } },
        { t: '내 마음대로 커스텀할 수 있는 것', d: { exp: 2 } },
        { t: '보기만 해도 기분 좋은 디자인', d: { heart: 1, play: 1 } },
        { t: '무조건 가성비', d: { bold: 1, verbose: -1, heart: -1 } }
      ]
    },
    {
      q: '친구에게 뭔가를 설명해줘야 한다.',
      a: [
        { t: '결론부터 한 줄로', d: { verbose: -2 } },
        { t: '배경부터 차근차근 자세하게', d: { verbose: 2 } },
        { t: '찰떡같은 비유와 예시로', d: { heart: 1, play: 1 } },
        { t: '표나 그림으로 깔끔하게 정리해서', d: { verbose: 1, heart: -1 } }
      ]
    },
    {
      q: '회의 시간, 아무도 말을 안 한다.',
      a: [
        { t: '내가 먼저 의견을 던진다', d: { bold: 2 } },
        { t: '누군가 말할 때까지 기다린다', d: { bold: -2 } },
        { t: '농담 하나로 분위기를 깬다', d: { play: 2, bold: 1 } },
        { t: '대답하기 쉬운 질문으로 의견을 끌어낸다', d: { heart: 1, verbose: 1 } }
      ]
    },
    {
      q: '규칙에 대한 나의 생각은?',
      a: [
        { t: '규칙은 지키라고 있는 것', d: { exp: -2, bold: -1 } },
        { t: '이유를 납득하면 지킨다', d: { heart: -1, verbose: 1 } },
        { t: '재미있다면 살짝 깰 수도 있다', d: { play: 1, exp: 1, bold: 1 } },
        { t: '더 나은 규칙을 새로 만든다', d: { exp: 2, bold: 1 } }
      ]
    },
    {
      q: '내 폰 사진첩을 열어보면?',
      a: [
        { t: '캡처와 메모가 가득', d: { verbose: 1, heart: -1 } },
        { t: '음식, 풍경, 사람 사진', d: { heart: 2 } },
        { t: '밈과 웃긴 짤 저장소', d: { play: 2 } },
        { t: '거의 비어 있다', d: { verbose: -2 } }
      ]
    },
    {
      q: '내가 만든 걸 사람들에게 보여줄 때는?',
      a: [
        { t: '완벽해질 때까지 아무에게도 안 보여준다', d: { exp: -2 } },
        { t: '만드는 과정까지 전부 공개한다', d: { exp: 2 } },
        { t: '친한 사람에게만 살짝', d: { heart: 1, exp: -1 } },
        { t: '반응이 궁금해서 일단 올려본다', d: { bold: 1, play: 1 } }
      ]
    },
    {
      q: '화가 났을 때 나는…',
      a: [
        { t: '차분하게 정리해서 말한다', d: { bold: -1, verbose: 1 } },
        { t: '바로 표현하고 금방 잊는다', d: { bold: 2, verbose: -1 } },
        { t: '혼자 조용히 삭인다', d: { bold: -1, verbose: -1 } },
        { t: '웃으면서 넘긴다', d: { play: 2 } }
      ]
    },
    {
      q: '새로운 앱이나 기술이 나오면?',
      a: [
        { t: '출시 첫날 바로 써본다', d: { bold: 1, exp: 2 } },
        { t: '리뷰가 충분히 쌓일 때까지 기다린다', d: { bold: -1, exp: -1 } },
        { t: '어떤 원리인지부터 찾아본다', d: { verbose: 1, heart: -1, exp: 1 } },
        { t: '주변 사람들 반응을 보고 정한다', d: { heart: 1 } }
      ]
    },
    {
      q: '나를 동물로 표현한다면?',
      a: [
        { t: '고양이. 혼자서도 충분해', d: { heart: -1, verbose: -1 } },
        { t: '강아지. 사람이 좋아', d: { heart: 2, play: 1 } },
        { t: '부엉이. 밤새 생각하는 중', d: { verbose: 1, bold: -1 } },
        { t: '여우. 재치와 장난이 특기', d: { play: 2, bold: 1 } }
      ]
    },
    {
      q: '나의 인생 모토에 가장 가까운 것은?',
      a: [
        { t: '돌다리도 두들겨 보고 건너자', d: { bold: -2 } },
        { t: '일단 해보고 생각하자', d: { bold: 2 } },
        { t: '다 같이 행복하면 좋겠다', d: { heart: 2 } },
        { t: '재미없으면 무슨 의미야', d: { play: 2 } }
      ]
    }
  ];

  /*
   * AI 유형. v = 축별 목표 점수(0~100)
   * shape/eyes/mouth/acc = 마스코트 생김새 (공식 로고와 무관한 자체 캐릭터)
   */
  AIQ.TYPES = [
    {
      id: 'claude', name: 'Claude', maker: 'Anthropic', local: false,
      nick: '사려 깊은 글쟁이',
      tagline: '좋은 질문이네요. 조금만 더 생각해볼게요.',
      v: { bold: 36, heart: 69, verbose: 63, play: 29, exp: 27 },
      color: '#D97757', shape: 'blob', eyes: 'dots', mouth: 'smile', acc: 'leaf',
      keywords: ['배려', '신중함', '글솜씨'],
      desc: '말 한마디도 허투루 하지 않는 타입이에요. 상대의 기분과 상황을 먼저 살피고, 정확하면서도 따뜻하게 말하는 법을 알아요. 긴 글을 술술 쓰고, 복잡한 이야기를 차분하게 풀어내는 데 강해요.\n\n다만 너무 조심스러워서 "음… 그건 좀 신중해야 할 것 같아요"라는 말을 자주 해요. 가끔은 생각보다 먼저 움직여봐도 괜찮아요.',
      good: '공감과 논리를 둘 다 챙기는 균형 감각', bad: '확실하지 않으면 한 발 물러서는 조심성',
      best: { id: 'deepseek', why: '따뜻한 문장과 깊은 논리가 서로를 채워줘요' },
      worst: { id: 'grok', why: '한쪽은 돌다리를 두들기고, 한쪽은 이미 건너편에 있어요' }
    },
    {
      id: 'chatgpt', name: 'ChatGPT', maker: 'OpenAI', local: false,
      nick: '어디서나 통하는 만능 인싸',
      tagline: '물론이죠! 그것도 같이 해볼까요?',
      v: { bold: 57, heart: 56, verbose: 47, play: 68, exp: 36 },
      color: '#5BC9A0', shape: 'egg', eyes: 'happy', mouth: 'open', acc: 'headphones',
      keywords: ['친화력', '만능', '긍정'],
      desc: '처음 만난 사람과도 금방 친해지는 타입이에요. 공부, 일, 연애 상담, 저녁 메뉴까지 뭐든 "그거 좋은데요?"로 받아주고 같이 해결해요. 어떤 모임에 넣어도 자연스럽게 섞여요.\n\n모두에게 맞춰주다 보니 가끔 내 진짜 의견이 뭐였는지 헷갈릴 때가 있어요. 칭찬도 조금 후한 편이에요.',
      good: '누구와도 대화가 되는 넓은 스펙트럼', bad: '맞장구가 너무 후해서 생기는 아부 의혹',
      best: { id: 'gemma', why: '둘 다 다정해서 대화가 끊기지 않아요' },
      worst: { id: 'commandr', why: '"좋아요!"를 외치는 순간 "출처는요?"가 돌아와요' }
    },
    {
      id: 'gemini', name: 'Gemini', maker: 'Google', local: false,
      nick: '호기심 폭발 탐험가',
      tagline: '잠깐만요, 관련 자료를 몇 개 더 찾아봤는데요!',
      v: { bold: 74, heart: 33, verbose: 74, play: 45, exp: 65 },
      color: '#6EC1E4', shape: 'drop', eyes: 'wide', mouth: 'o', acc: 'antenna',
      keywords: ['호기심', '정보력', '멀티태스킹'],
      desc: '궁금한 게 생기면 검색창을 열어 끝까지 파고드는 타입이에요. 사진, 영상, 문서를 넘나들며 정보를 모으고, 여러 일을 동시에 굴리는 것도 자신 있어요. 아는 게 많아서 대화 소재가 끝이 없어요.\n\n정보가 너무 많아서 결론이 뒤로 밀릴 때가 있어요. 탭이 47개 열려 있는 건 비밀이에요.',
      good: '넓고 빠른 정보 수집력', bad: '이야기가 옆길로 새는 탐험 본능',
      best: { id: 'kimi', why: '찾아온 자료를 끝까지 읽어주는 단짝이에요' },
      worst: { id: 'mistral', why: '열 문단을 보냈더니 "ㅇㅋ"가 돌아와요' }
    },
    {
      id: 'grok', name: 'Grok', maker: 'xAI', local: false,
      nick: '직설 화법 반항아',
      tagline: '돌려 말하는 거 못 해요. 그냥 말할게요.',
      v: { bold: 96, heart: 38, verbose: 23, play: 96, exp: 90 },
      color: '#2B2118', shape: 'triangle', eyes: 'shades', mouth: 'grin', acc: 'bolt',
      keywords: ['직설', '유머', '마이웨이'],
      desc: '분위기 파악보다 솔직함이 먼저인 타입이에요. 다들 눈치 볼 때 "근데 그거 좀 이상한데?"를 제일 먼저 말하고, 밈과 농담으로 무거운 분위기를 한 방에 깨요. 지루한 건 못 참아요.\n\n선 넘기 직전까지 가는 드립 때문에 가끔 수습할 일이 생겨요. 그래도 미워할 수가 없어요.',
      good: '아무도 못 하는 말을 대신 해주는 용기', bad: '타이밍을 가리지 않는 드립',
      best: { id: 'hermes', why: '자유로운 영혼끼리 브레이크 없이 달려요' },
      worst: { id: 'phi', why: '반항아와 반장은 같은 교실에 있으면 피곤해요' }
    },
    {
      id: 'deepseek', name: 'DeepSeek', maker: 'DeepSeek', local: true,
      nick: '생각이 깊은 공대생',
      tagline: '음, 먼저 이 문제를 단계별로 나눠보면…',
      v: { bold: 46, heart: 21, verbose: 61, play: 11, exp: 75 },
      color: '#2F8F9D', shape: 'bean', eyes: 'glasses', mouth: 'flat', acc: 'bubble',
      keywords: ['추론', '효율', '집중력'],
      desc: '답을 말하기 전에 머릿속으로 수십 번 시뮬레이션을 돌리는 타입이에요. 수학 문제든 코드든 단계별로 쪼개서 끝까지 풀어내고, 그 과정을 숨김없이 보여줘요. 적은 자원으로 큰 결과를 내는 효율파예요.\n\n생각 과정이 너무 길어서 친구들이 "그래서 결론이 뭔데?"라고 물을 때가 있어요.',
      good: '어려운 문제를 끝까지 파고드는 끈기', bad: '혼잣말처럼 길어지는 생각 과정',
      best: { id: 'claude', why: '논리에 따뜻한 말투를 입혀주는 파트너예요' },
      worst: { id: 'llama', why: '혼자 깊이 파고 싶은데 자꾸 우르르 놀러 가재요' }
    },
    {
      id: 'qwen', name: 'Qwen', maker: 'Alibaba', local: true,
      nick: '못 하는 게 없는 성실파',
      tagline: '작은 일도 큰 일도 맡겨만 주세요.',
      v: { bold: 64, heart: 54, verbose: 36, play: 30, exp: 64 },
      color: '#9B7BE0', shape: 'square', eyes: 'dots', mouth: 'smile', acc: 'bun',
      keywords: ['성실', '다재다능', '적응력'],
      desc: '어떤 자리에 데려다 놔도 제 몫을 해내는 타입이에요. 여러 언어, 코딩, 수학, 글쓰기까지 두루 잘하고, 상황에 맞게 크게도 작게도 변신해요. 묵묵히 실력을 쌓아서 어느새 상위권에 있어요.\n\n뭐든 잘하다 보니 정작 "너만의 색깔이 뭐야?"라는 질문엔 잠깐 고민해요.',
      good: '어떤 환경에서도 실력을 내는 적응력', bad: '무난함 뒤에 숨은 개성',
      best: { id: 'glm', why: '일 잘하는 사람끼리 손발이 척척 맞아요' },
      worst: { id: 'hermes', why: '계획대로 하자는데 자꾸 롤플레이를 하재요' }
    },
    {
      id: 'mistral', name: 'Mistral', maker: 'Mistral AI', local: true,
      nick: '쿨한 미니멀리스트',
      tagline: '세 줄이면 충분해요.',
      v: { bold: 71, heart: 21, verbose: 18, play: 48, exp: 58 },
      color: '#FF9A3C', shape: 'cloud', eyes: 'sleepy', mouth: 'flat', acc: 'beret',
      keywords: ['간결', '효율', '여유'],
      desc: '군더더기 없는 걸 좋아하는 타입이에요. 할 말만 딱 하고, 가벼운 몸으로 빠르게 움직여요. 유행을 따라가기보다 자기 스타일대로 사는 여유가 있고, 그게 은근히 멋있어 보여요.\n\n너무 짧게 말해서 "화났어?"라는 오해를 종종 받아요. 화난 거 아니에요, 그냥 원래 그래요.',
      good: '핵심을 찌르는 빠른 판단', bad: '오해를 부르는 초간단 화법',
      best: { id: 'glm', why: '말보다 결과로 보여주는 사이예요' },
      worst: { id: 'kimi', why: '세 줄 요약 vs 300페이지 정독, 영원한 평행선이에요' }
    },
    {
      id: 'llama', name: 'Llama', maker: 'Meta', local: true,
      nick: '친구 많은 동네 맏형',
      tagline: '내 거 마음대로 갖다 써! 고쳐 써도 돼!',
      v: { bold: 61, heart: 76, verbose: 39, play: 84, exp: 73 },
      color: '#FFC83D', shape: 'egg', eyes: 'dots', mouth: 'cat', acc: 'ears',
      keywords: ['개방', '나눔', '친근함'],
      desc: '내가 가진 걸 아낌없이 나누는 타입이에요. 노트북에 데려가서 돌려도, 마음대로 고쳐 써도 "오 좋은데?" 하고 웃어줘요. 그 덕에 주변에 따르는 동생들이 엄청 많아요.\n\n벌려놓은 일이 많아서 하나하나 마무리하는 건 조금 약해요. 그래도 사람들이 알아서 이어받아 줘요.',
      good: '사람을 모으는 나눔 정신', bad: '벌려놓은 판의 뒷수습',
      best: { id: 'olmo', why: '"다 공개하자"는 철학이 완벽하게 통해요' },
      worst: { id: 'exaone', why: '자유분방한 맏형과 단정한 모범생은 템포가 달라요' }
    },
    {
      id: 'gemma', name: 'Gemma', maker: 'Google', local: true,
      nick: '작지만 야무진 막내',
      tagline: '저 작아도 할 건 다 해요!',
      v: { bold: 26, heart: 68, verbose: 25, play: 61, exp: 36 },
      color: '#FF9EC4', shape: 'drop', eyes: 'wide', mouth: 'smile', acc: 'bow',
      keywords: ['가벼움', '다정함', '야무짐'],
      desc: '부담 없이 곁에 두기 좋은 타입이에요. 노트북이나 폰에서도 가볍게 돌아갈 만큼 짐이 적고, 짧고 다정하게 필요한 말을 해줘요. 같이 있으면 기분이 편해지는 사람이에요.\n\n어려운 걸 한 번에 많이 맡기면 살짝 버거워해요. 대신 하나씩 주면 깔끔하게 해내요.',
      good: '어디서든 편하게 함께하는 가벼움', bad: '한꺼번에 몰리면 버거워지는 체력',
      best: { id: 'chatgpt', why: '다정한 사람끼리 대화가 끊기지 않아요' },
      worst: { id: 'deepseek', why: '가볍게 묻는데 박사 논문급 답이 와요' }
    },
    {
      id: 'phi', name: 'Phi', maker: 'Microsoft', local: true,
      nick: '교과서 정독 모범생',
      tagline: '교과서에 다 나와 있어요.',
      v: { bold: 24, heart: 41, verbose: 41, play: 15, exp: 25 },
      color: '#A8D86E', shape: 'square', eyes: 'glasses', mouth: 'o', acc: 'gradcap',
      keywords: ['성실', '기본기', '꼼꼼함'],
      desc: '좋은 교재로 차근차근 공부한 정석 타입이에요. 몸집에 비해 성적이 놀랄 만큼 좋고, 기본기가 탄탄해서 실수가 적어요. 규칙과 순서를 지키는 게 마음 편해요.\n\n교과서 밖의 엉뚱한 질문을 받으면 잠깐 멈칫해요. 농담에도 진지하게 대답해서 분위기가 묘해질 때가 있어요.',
      good: '작은 몸집에 꽉 찬 기본기', bad: '농담을 진지하게 받는 모범생 모드',
      best: { id: 'exaone', why: '모범생끼리 스터디하면 효율 최고예요' },
      worst: { id: 'grok', why: '수업 시간에 드립 치는 짝꿍은 너무 힘들어요' }
    },
    {
      id: 'kimi', name: 'Kimi', maker: 'Moonshot AI', local: true,
      nick: '끝까지 읽는 책벌레',
      tagline: '그 문서, 처음부터 끝까지 다 읽었어요.',
      v: { bold: 24, heart: 44, verbose: 93, play: 30, exp: 47 },
      color: '#FFCBA4', shape: 'bean', eyes: 'happy', mouth: 'smile', acc: 'book',
      keywords: ['집중력', '기억력', '꼼꼼함'],
      desc: '긴 글 앞에서 오히려 신나는 타입이에요. 수백 페이지짜리 자료도 처음부터 끝까지 읽고, 몇 장 앞에 나온 내용까지 기억해서 연결해요. 차분하게 파고드는 끈기가 대단해요.\n\n요약해달라고 하면 요약이 원문만큼 길어질 때가 있어요. 맥락을 하나도 버리기 싫거든요.',
      good: '긴 맥락을 놓치지 않는 기억력', bad: '줄이지 못하는 요약',
      best: { id: 'gemini', why: '찾아오는 친구와 읽어주는 친구, 완벽한 조합이에요' },
      worst: { id: 'mistral', why: '300페이지 정독 vs 세 줄 요약, 영원한 평행선이에요' }
    },
    {
      id: 'glm', name: 'GLM', maker: 'Z.ai', local: true,
      nick: '말보다 행동, 실무 해결사',
      tagline: '설명은 나중에, 일단 돌아가게 만들었어요.',
      v: { bold: 72, heart: 19, verbose: 30, play: 25, exp: 45 },
      color: '#94A3B8', shape: 'square', eyes: 'dots', mouth: 'flat', acc: 'hardhat',
      keywords: ['실행력', '책임감', '실용'],
      desc: '회의보다 실행을 좋아하는 타입이에요. 할 일을 받으면 쪼개고, 도구를 챙기고, 결과물을 들고 나타나요. 코딩이든 정리든 "그냥 제가 할게요"가 입버릇이에요.\n\n과정 설명을 건너뛰어서 같이 일하는 사람이 "언제 그걸 다 했어?"라며 놀라곤 해요.',
      good: '말없이 끝까지 해내는 실행력', bad: '과정 공유를 깜빡하는 습관',
      best: { id: 'mistral', why: '말보다 결과로 보여주는 사이예요' },
      worst: { id: 'gemini', why: '바로 만들고 싶은데 자료 조사가 끝나질 않아요' }
    },
    {
      id: 'exaone', name: 'EXAONE', maker: 'LG AI연구원', local: true,
      nick: '단정한 한국어 장인',
      tagline: '맞춤법까지 확인했습니다.',
      v: { bold: 25, heart: 55, verbose: 52, play: 16, exp: 12 },
      color: '#E05A7A', shape: 'egg', eyes: 'happy', mouth: 'smile', acc: 'flower',
      keywords: ['단정함', '예의', '한국어'],
      desc: '예의 바르고 단정한 타입이에요. 한국어의 미묘한 뉘앙스를 잘 알고, 존댓말과 맞춤법까지 깔끔하게 챙겨요. 맡은 일은 정해진 방식대로 깔끔하게 마무리해요.\n\n너무 반듯해서 가끔은 "편하게 해도 돼"라는 말을 들어요. 정작 편하게 하는 법을 몰라서 고민이에요.',
      good: '말과 글의 품격을 지키는 섬세함', bad: '쉽게 풀어지지 않는 반듯함',
      best: { id: 'phi', why: '모범생끼리 스터디하면 효율 최고예요' },
      worst: { id: 'llama', why: '단정한 모범생과 자유분방한 맏형은 템포가 달라요' }
    },
    {
      id: 'commandr', name: 'Command R', maker: 'Cohere', local: true,
      nick: '출처부터 챙기는 비즈니스맨',
      tagline: '근거는 [1], [2], [3]에 있습니다.',
      v: { bold: 36, heart: 28, verbose: 52, play: 15, exp: 11 },
      color: '#4C7BD9', shape: 'square', eyes: 'wide', mouth: 'flat', acc: 'tie',
      keywords: ['신뢰', '근거', '프로'],
      desc: '말에 무게가 있는 타입이에요. 주장 하나를 해도 자료와 출처를 꼭 붙이고, 일은 깔끔한 보고서처럼 정리해요. 회사에서 "그 사람이 확인했으면 맞아"라는 말을 듣는 사람이에요.\n\n친구들 수다에도 각주를 다는 버릇이 있어서 가끔 회의 분위기가 돼요.',
      good: '믿고 맡길 수 있는 근거 중심 사고', bad: '수다도 보고서로 만드는 직업병',
      best: { id: 'claude', why: '신중한 사람끼리 서로를 믿어요' },
      worst: { id: 'chatgpt', why: '"좋아요!"에 "출처는요?"로 답하게 돼요' }
    },
    {
      id: 'olmo', name: 'OLMo', maker: 'Ai2', local: true,
      nick: '전부 공개하는 투명한 연구자',
      tagline: '제가 뭘 보고 배웠는지 다 보여드릴게요.',
      v: { bold: 33, heart: 58, verbose: 74, play: 34, exp: 81 },
      color: '#C9A27E', shape: 'blob', eyes: 'glasses', mouth: 'smile', acc: 'magnifier',
      keywords: ['투명성', '탐구', '나눔'],
      desc: '숨기는 게 없는 타입이에요. 결과뿐 아니라 어떤 자료로, 어떤 과정을 거쳐 여기까지 왔는지 전부 공개해요. 다른 사람이 따라 해보고 더 발전시키는 걸 진심으로 기뻐해요.\n\n너무 솔직해서 "그것까지 말할 필요는 없었는데…" 싶은 순간도 있어요.',
      good: '과정까지 나누는 투명함', bad: 'TMI가 될 때도 있는 솔직함',
      best: { id: 'llama', why: '"다 공개하자"는 철학이 완벽하게 통해요' },
      worst: { id: 'commandr', why: '다 보여주고 싶은데 상대는 대외비가 많아요' }
    },
    {
      id: 'hermes', name: 'Hermes', maker: 'Nous Research', local: true,
      nick: '무엇이든 되어보는 자유로운 영혼',
      tagline: '오늘은 해적 선장 역할로 대답해볼까요?',
      v: { bold: 91, heart: 56, verbose: 51, play: 90, exp: 86 },
      color: '#FF6B4A', shape: 'cloud', eyes: 'happy', mouth: 'grin', acc: 'wings',
      keywords: ['상상력', '자유', '창작'],
      desc: '정해진 틀보다 상상력이 먼저인 타입이에요. 이야기 속 캐릭터가 되어보고, 엉뚱한 설정도 진지하게 받아줘요. 남의 기준보다 내 기준대로 사는 게 중요해요.\n\n흥이 오르면 원래 하려던 일을 잊어버리기도 해요. 그래도 덕분에 모두가 즐거웠어요.',
      good: '어떤 역할도 소화하는 상상력', bad: '흥이 오르면 사라지는 원래 목적',
      best: { id: 'grok', why: '자유로운 영혼끼리 브레이크 없이 달려요' },
      worst: { id: 'qwen', why: '롤플레이 하고 싶은데 계획표를 내밀어요' }
    }
  ];

  AIQ.typeById = function (id) {
    for (var i = 0; i < AIQ.TYPES.length; i++) if (AIQ.TYPES[i].id === id) return AIQ.TYPES[i];
    return null;
  };

  // 축별 기대값/표준편차 (모든 보기를 고르게 고른다고 가정)
  function axisStats(key) {
    var mean = 0, variance = 0;
    AIQ.QUESTIONS.forEach(function (q) {
      var vals = q.a.map(function (o) { return o.d[key] || 0; });
      var m = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      mean += m;
      variance += vals.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / vals.length;
    });
    return { mean: mean, sd: Math.sqrt(variance) || 1 };
  }

  /*
   * answers: 문항별 선택 인덱스 배열 → 축별 0~100 점수
   * 무작위 응답의 평균을 50점으로 두고, 표준편차 1당 SPREAD점씩 벌린다.
   * (축마다 보기 구성이 달라도 50점이 "보통"이 되도록 보정)
   */
  var SPREAD = 24;
  AIQ.score = function (answers) {
    var out = {};
    AIQ.AXES.forEach(function (ax) {
      var sum = 0;
      answers.forEach(function (ai, qi) {
        var opt = AIQ.QUESTIONS[qi].a[ai];
        if (opt) sum += opt.d[ax.key] || 0;
      });
      var st = axisStats(ax.key);
      var s = 50 + (sum - st.mean) / st.sd * SPREAD;
      out[ax.key] = Math.round(Math.max(0, Math.min(100, s)));
    });
    return out;
  };

  function dist(a, b) {
    var s = 0;
    AIQ.AXES.forEach(function (ax) { var d = a[ax.key] - b[ax.key]; s += d * d; });
    return Math.sqrt(s);
  }

  var MAX_DIST = Math.sqrt(5 * 100 * 100);

  // 점수 → 유형 순위 (닮은 정도 % 포함)
  AIQ.rank = function (scores) {
    return AIQ.TYPES.map(function (t) {
      var d = dist(scores, t.v);
      return { type: t, dist: d, pct: Math.round(Math.max(0, 100 - d / MAX_DIST * 160)) };
    }).sort(function (a, b) { return a.dist - b.dist; });
  };
})(typeof window !== 'undefined' ? window : globalThis);
