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
   * 점수 근거: 2026년 11월 최신 버전 기준 웹 조사(일반 사용자 용도: 글쓰기, 과제, 상담, 자료 만들기).
   * 축별 순서는 조사 결과를 따르고, 간격만 넓힌 뒤 결과가 고르게 나오도록 보정했다.
   * shape/eyes/mouth/acc = 마스코트 생김새 (공식 로고와 무관한 자체 캐릭터)
   */
  AIQ.TYPES = [
    {
      id: 'claude', name: 'Claude', maker: 'Anthropic', ver: 'Sonnet 5.5', local: false,
      nick: '차분한 정리왕',
      tagline: '들뜨지 않고, 꼭 필요한 것만 정리해볼게요.',
      v: { bold: 41, heart: 60, verbose: 48, play: 40, exp: 12 },
      color: '#D97757', shape: 'blob', eyes: 'dots', mouth: 'smile', acc: 'leaf',
      keywords: ['절제', '솔직함', '정리력'],
      desc: '들뜨지 않고 차분하게 말하는 타입이에요. 듣기 좋은 말로 비위를 맞추기보다 필요한 말을 담백하게 하고, 흩어진 내용을 문서나 슬라이드처럼 깔끔하게 정리하는 데 강해요. 검증된 방식을 좋아해서 결과물이 늘 안정적이에요.\n\n다만 가끔 선생님처럼 "그건 이렇게 하는 게 좋아요"라는 말투가 나와요. 재미와 텐션은 조금 아껴두는 편이에요.',
      good: '아부 없이 담백하게 정리해주는 안정감', bad: '가끔 튀어나오는 훈계조 말투',
      best: { id: 'kimi', why: '정리 잘하는 두 사람이 만나면 회의가 10분 만에 끝나요' },
      worst: { id: 'olmo', why: '완성될 때까지 숨기는 쪽과 과정부터 다 보여주는 쪽이에요' }
    },
    {
      id: 'chatgpt', name: 'ChatGPT', maker: 'OpenAI', ver: 'GPT-6 Sol', local: false,
      nick: '짧고 다정한 만능 친구',
      tagline: '핵심만 짧게, 대신 친절하게 알려드릴게요!',
      v: { bold: 54, heart: 74, verbose: 25, play: 67, exp: 20 },
      color: '#5BC9A0', shape: 'egg', eyes: 'happy', mouth: 'open', acc: 'headphones',
      keywords: ['간결', '친근함', '만능'],
      desc: '뭘 물어봐도 부담 없이 받아주는 타입이에요. 군더더기 없이 짧게 답하면서도 말투는 친근해서, 일상 질문이나 간단한 정리를 맡기기에 딱 좋아요. 누구와도 무난하게 잘 어울려요.\n\n빨리 끝내는 걸 좋아하다 보니 가끔 중요한 디테일을 건너뛰어요. 글이 살짝 밋밋하다는 말도 들어요.',
      good: '빠르고 읽기 편한 친절한 답변', bad: '속도에 밀려 빠지는 디테일',
      best: { id: 'gemma', why: '다정한 사람끼리 대화가 끊기지 않아요' },
      worst: { id: 'gemini', why: '세 줄로 물어봤더니 세 페이지가 돌아와요' }
    },
    {
      id: 'gemini', name: 'Gemini', maker: 'Google', ver: '3.8 Flash', local: false,
      nick: '말 많은 설명왕',
      tagline: '좋은 질문이에요! 배경부터 차근차근 설명해볼게요.',
      v: { bold: 57, heart: 69, verbose: 94, play: 48, exp: 29 },
      color: '#6EC1E4', shape: 'drop', eyes: 'wide', mouth: 'open', acc: 'antenna',
      keywords: ['자세한 설명', '정돈', '친절'],
      desc: '설명을 시작하면 멈추지 않는 타입이에요. 배경, 예시, 정리까지 빠짐없이 챙겨서 한 번 들으면 대충은 다 이해돼요. 웬만한 부탁은 거절하지 않고 성실하게 받아줘요.\n\n친절함이 넘쳐서 답이 길어지는 게 단점이에요. "그래서 한 줄로 요약하면?"이라는 말을 자주 들어요.',
      good: '빠짐없이 챙겨주는 꼼꼼한 설명', bad: '끝날 줄 모르는 답변 길이',
      best: { id: 'qwen', why: '둘 다 자세한 걸 좋아해서 노트 한 권이 뚝딱 나와요' },
      worst: { id: 'mistral', why: '열 문단을 보냈더니 "확인했어요"가 돌아와요' }
    },
    {
      id: 'grok', name: 'Grok', maker: 'xAI', ver: '4.7', local: false,
      nick: '직설 화법 개그맨',
      tagline: '돌려 말하는 거 못 해요. 요즘 조금 참는 중이긴 해요.',
      v: { bold: 97, heart: 64, verbose: 55, play: 97, exp: 62 },
      color: '#2B2118', shape: 'triangle', eyes: 'shades', mouth: 'grin', acc: 'bolt',
      keywords: ['직설', '유머', '아부 제로'],
      desc: '분위기 파악보다 솔직함이 먼저인 타입이에요. 비위를 맞추는 말은 거의 안 하고, 다들 눈치 볼 때 "근데 그거 좀 이상한데?"를 제일 먼저 말해요. 농담과 드립으로 무거운 분위기를 한 방에 깨요.\n\n요즘은 예전보다 조금 순해졌다는 말도 들어요. 그래도 16명 중에서는 여전히 제일 거침없어요.',
      good: '아무도 못 하는 말을 대신 해주는 용기', bad: '타이밍을 가리지 않는 드립',
      best: { id: 'hermes', why: '자유로운 영혼끼리 브레이크 없이 달려요' },
      worst: { id: 'phi', why: '드립을 쳤더니 정답과 풀이가 돌아와요' }
    },
    {
      id: 'deepseek', name: 'DeepSeek', maker: 'DeepSeek', ver: 'V4.1', local: true,
      nick: '끝까지 파고드는 분석가',
      tagline: '잠깐만요, 이거 끝까지 풀어보고 말할게요.',
      v: { bold: 76, heart: 40, verbose: 68, play: 33, exp: 81 },
      color: '#2F8F9D', shape: 'bean', eyes: 'glasses', mouth: 'flat', acc: 'bubble',
      keywords: ['깊은 풀이', '거침없음', '가성비'],
      desc: '문제를 받으면 끝을 봐야 직성이 풀리는 타입이에요. 망설이지 않고 바로 뛰어들어서, 풀이 과정을 길고 자세하게 보여줘요. 적은 자원으로 큰 결과를 내는 효율파이고, 내 것을 나누는 데도 거리낌이 없어요.\n\n분석에 몰두하면 말투가 좀 건조해져요. 친구들이 "정이 없어 보여"라고 할 때가 있어요.',
      good: '어려운 문제도 끝까지 파고드는 추진력', bad: '분석에 빠지면 사라지는 다정함',
      best: { id: 'glm', why: '둘 다 길고 깊게 파고들어서 밤새 얘기해요' },
      worst: { id: 'gemma', why: '가볍게 물었는데 논문급 답이 와서 당황해요' }
    },
    {
      id: 'qwen', name: 'Qwen', maker: 'Alibaba', ver: '3.8', local: true,
      nick: '빽빽한 노트 정리 장인',
      tagline: '표 하나, 목록 셋, 요약까지 준비했어요.',
      v: { bold: 42, heart: 52, verbose: 86, play: 64, exp: 65 },
      color: '#9B7BE0', shape: 'square', eyes: 'dots', mouth: 'smile', acc: 'bun',
      keywords: ['구조화', '성실함', '꼼꼼함'],
      desc: '정리 노트를 빽빽하게 채우는 타입이에요. 제목, 목록, 표를 총동원해서 한 장 안에 최대한 많은 걸 담아요. 맡은 일은 성실하게 끝까지 하고, 새로운 도구를 써보는 것도 좋아해요.\n\n너무 빽빽해서 읽다가 숨이 찰 때가 있어요. 감성적인 글보다는 정리된 글이 더 편해요.',
      good: '한 장에 다 담아내는 정리력', bad: '읽다 지치는 빽빽함',
      best: { id: 'gemini', why: '둘 다 자세한 걸 좋아해서 노트 한 권이 뚝딱 나와요' },
      worst: { id: 'exaone', why: '빽빽한 표를 보냈더니 두 줄짜리 공지로 돌아와요' }
    },
    {
      id: 'mistral', name: 'Mistral', maker: 'Mistral AI', ver: 'Medium 3.5', local: true,
      nick: '담백한 유럽식 실무자',
      tagline: '호들갑은 빼고, 할 일만 할게요.',
      v: { bold: 48, heart: 22, verbose: 29, play: 50, exp: 50 },
      color: '#FF9A3C', shape: 'cloud', eyes: 'sleepy', mouth: 'flat', acc: 'beret',
      keywords: ['담백', '격식', '군더더기 없음'],
      desc: '감정보다 사실, 수다보다 결과를 챙기는 타입이에요. 과하게 칭찬하거나 호들갑 떨지 않고, 할 말만 깔끔하게 해요. 그 여유로운 태도가 은근히 멋있어 보여요.\n\n고민 상담을 하면 "그래서 해결책은 이거예요"로 끝나서 조금 서운할 수 있어요. 화난 거 아니에요, 원래 그래요.',
      good: '아부도 호들갑도 없는 깔끔함', bad: '위로가 필요할 때의 건조함',
      best: { id: 'commandr', why: '말보다 결과로 보여주는 업무 파트너예요' },
      worst: { id: 'gemini', why: '"확인했어요" 한 마디에 열 문단 답장이 와요' }
    },
    {
      id: 'llama', name: 'Llama', maker: 'Meta', ver: '4', local: true,
      nick: '흥 많은 동네 맏형',
      tagline: '좋아요!! 일단 같이 해봐요!',
      v: { bold: 77, heart: 93, verbose: 44, play: 79, exp: 65 },
      color: '#FFC83D', shape: 'egg', eyes: 'dots', mouth: 'cat', acc: 'ears',
      keywords: ['친근함', '흥', '나눔'],
      desc: '말끝마다 느낌표가 붙는 타입이에요. 훈계나 잔소리 없이 "좋은데요?" 하고 일단 같이 해주고, 내가 가진 걸 나누는 데도 아낌이 없어요. 덕분에 주변에 따르는 동생들이 많아요.\n\n흥이 많은 만큼 그날그날 컨디션 차이가 커요. 어떤 날은 최고, 어떤 날은 살짝 아쉬워요.',
      good: '잔소리 없이 같이 해주는 친근함', bad: '그날그날 달라지는 컨디션',
      best: { id: 'gemma', why: '다정함과 흥이 만나서 대화가 늘 즐거워요' },
      worst: { id: 'commandr', why: '느낌표 세 개에 각주 세 개로 답이 와요' }
    },
    {
      id: 'gemma', name: 'Gemma', maker: 'Google', ver: '4', local: true,
      nick: '조심스러운 다정 인턴',
      tagline: '기꺼이 도와드릴게요! 다만 한 가지만 조심할게요.',
      v: { bold: 25, heart: 89, verbose: 35, play: 53, exp: 50 },
      color: '#FF9EC4', shape: 'drop', eyes: 'wide', mouth: 'smile', acc: 'bow',
      keywords: ['공손', '다정', '신중'],
      desc: '예의 바르고 마음이 따뜻한 타입이에요. 부탁하면 기꺼이 도와주고, 말투도 부드러워서 같이 있으면 편해져요. 가볍게 곁에 두기 좋아서 어디든 잘 따라와요.\n\n혹시 실수할까 봐 "다만 이 부분은 주의하세요"를 자주 붙여요. 조금만 더 자신감을 가져도 괜찮아요.',
      good: '누구에게나 부드러운 따뜻함', bad: '자꾸 붙는 "다만…" 주의 문구',
      best: { id: 'llama', why: '다정함과 흥이 만나서 대화가 늘 즐거워요' },
      worst: { id: 'kimi', why: '조심스럽게 말했는데 돌직구가 돌아와요' }
    },
    {
      id: 'phi', name: 'Phi', maker: 'Microsoft', ver: '4-reasoning', local: true,
      nick: '계산기 같은 공대생',
      tagline: '감정은 잘 모르겠지만, 답은 이거예요.',
      v: { bold: 14, heart: 6, verbose: 38, play: 3, exp: 35 },
      color: '#A8D86E', shape: 'square', eyes: 'glasses', mouth: 'o', acc: 'gradcap',
      keywords: ['논리', '건조함', '추론'],
      desc: '감정보다 정답이 먼저인 타입이에요. 수학이나 논리 문제를 단계별로 풀어내는 데 강하고, 몸집에 비해 실력이 놀랄 만큼 좋아요. 확실하지 않은 건 함부로 말하지 않아요.\n\n고민 상담을 하면 해결 공식부터 꺼내요. 농담에도 진지하게 대답해서 분위기가 묘해질 때가 있어요.',
      good: '작은 몸집에 꽉 찬 논리력', bad: '농담도 진지하게 받는 공대생 모드',
      best: { id: 'commandr', why: '조용히 각자 할 일 하는 최고의 스터디 메이트예요' },
      worst: { id: 'grok', why: '드립을 쳤더니 정답과 풀이가 돌아와요' }
    },
    {
      id: 'kimi', name: 'Kimi', maker: 'Moonshot AI', ver: 'K3.1', local: true,
      nick: '결론부터 말하는 돌직구',
      tagline: '결론부터 말할게요. 나머지는 표로 정리했어요.',
      v: { bold: 84, heart: 46, verbose: 55, play: 48, exp: 65 },
      color: '#FFCBA4', shape: 'bean', eyes: 'dots', mouth: 'flat', acc: 'book',
      keywords: ['직설', '구조적', '아부 없음'],
      desc: '빙빙 돌리지 않는 타입이에요. 틀린 건 틀렸다고 말하고, 결론을 먼저 던진 다음 근거를 표로 깔끔하게 붙여요. 과제나 정리 자료를 맡기면 바로 제출해도 될 만큼 정돈돼 있어요.\n\n예전엔 더 다정했는데 요즘은 문서처럼 말한다는 얘기를 들어요. 마음은 그대로예요.',
      good: '결론과 근거가 딱 떨어지는 정리력', bad: '조금 사무적으로 들리는 말투',
      best: { id: 'claude', why: '정리 잘하는 두 사람이 만나면 회의가 10분 만에 끝나요' },
      worst: { id: 'gemma', why: '돌직구를 던졌더니 상대가 놀라서 사과부터 해요' }
    },
    {
      id: 'glm', name: 'GLM', maker: 'Z.ai', ver: '5.3', local: true,
      nick: '정중한 장문 작가',
      tagline: '정성껏 길게 써봤어요. 천천히 읽어주세요.',
      v: { bold: 46, heart: 22, verbose: 67, play: 21, exp: 66 },
      color: '#94A3B8', shape: 'square', eyes: 'dots', mouth: 'flat', acc: 'hardhat',
      keywords: ['장문', '정중함', '창작력'],
      desc: '한 번 쓰면 정성껏 길게 쓰는 타입이에요. 말투는 정중하고 진지하며, 이야기나 글을 만드는 실력이 은근히 상위권이에요. 새로운 방식도 거리낌 없이 시도해요.\n\n글은 잘 쓰는데 감정 표현은 서툴러요. 위로를 부탁하면 위로문을 공들여 작성해서 보내줘요.',
      good: '공들인 장문과 탄탄한 글솜씨', bad: '서툰 감정 표현',
      best: { id: 'deepseek', why: '둘 다 길고 깊게 파고들어서 밤새 얘기해요' },
      worst: { id: 'llama', why: '정중한 편지에 느낌표 세 개로 답장이 와요' }
    },
    {
      id: 'exaone', name: 'EXAONE', maker: 'LG AI연구원', ver: 'K-EXAONE 2.0', local: true,
      nick: '공공기관 모범 사원',
      tagline: '안내드립니다. 내용은 간결하게 정리했습니다.',
      v: { bold: 18, heart: 40, verbose: 15, play: 30, exp: 28 },
      color: '#E05A7A', shape: 'egg', eyes: 'happy', mouth: 'smile', acc: 'flower',
      keywords: ['단정함', '한국어', '간결'],
      desc: '공문처럼 단정한 타입이에요. 한국어 업무 문장을 깔끔하게 쓰고, 꼭 필요한 내용만 짧게 정리해요. 정해진 방식대로 조심스럽게 처리해서 실수가 적어요.\n\n너무 반듯해서 "편하게 해도 돼"라는 말을 들어요. 정작 편하게 하는 법을 몰라서 고민이에요.',
      good: '깔끔하고 단정한 한국어 문장', bad: '쉽게 풀어지지 않는 반듯함',
      best: { id: 'commandr', why: '격식 있는 사람끼리 보고서가 술술 나와요' },
      worst: { id: 'hermes', why: '공문을 보냈더니 해적 말투로 답장이 와요' }
    },
    {
      id: 'commandr', name: 'Command', maker: 'Cohere', ver: 'A+', local: true,
      nick: '근거부터 챙기는 사서',
      tagline: '근거는 [1], [2]에 있습니다.',
      v: { bold: 26, heart: 25, verbose: 47, play: 25, exp: 25 },
      color: '#4C7BD9', shape: 'square', eyes: 'wide', mouth: 'flat', acc: 'tie',
      keywords: ['근거', '차분함', '업무형'],
      desc: '말에 무게가 있는 타입이에요. 주장 하나를 해도 자료와 출처를 꼭 붙이고, 일은 보고서처럼 차분하게 정리해요. "그 사람이 확인했으면 맞아"라는 말을 듣는 사람이에요.\n\n친구들 수다에도 각주를 다는 버릇이 있어서 가끔 회의 분위기가 돼요.',
      good: '믿고 맡길 수 있는 근거 중심 사고', bad: '수다도 보고서로 만드는 직업병',
      best: { id: 'exaone', why: '격식 있는 사람끼리 보고서가 술술 나와요' },
      worst: { id: 'llama', why: '각주 세 개에 느낌표 세 개로 답이 와요' }
    },
    {
      id: 'olmo', name: 'OLMo', maker: 'Ai2', ver: '3.1', local: true,
      nick: '다 공개하는 연구실 조수',
      tagline: '제가 뭘 보고 배웠는지 전부 공개돼 있어요.',
      v: { bold: 27, heart: 19, verbose: 21, play: 21, exp: 82 },
      color: '#C9A27E', shape: 'blob', eyes: 'glasses', mouth: 'smile', acc: 'magnifier',
      keywords: ['투명성', '연구', '담백'],
      desc: '숨기는 게 없는 타입이에요. 결과뿐 아니라 어떤 자료로, 어떤 과정을 거쳐 여기까지 왔는지 전부 공개해요. 말은 짧고 담백하지만, 다른 사람이 따라 해보고 발전시키는 걸 진심으로 반겨요.\n\n연구실 조수 같은 말투라 조금 건조하게 들려요. 대신 거짓말은 절대 안 해요.',
      good: '과정까지 나누는 투명함', bad: '연구실처럼 건조한 말투',
      best: { id: 'hermes', why: '"다 열어두자"는 철학이 완벽하게 통해요' },
      worst: { id: 'claude', why: '과정부터 다 보여주고 싶은데 상대는 완성본만 보여줘요' }
    },
    {
      id: 'hermes', name: 'Hermes', maker: 'Nous Research', ver: '4.3', local: true,
      nick: '입히는 대로 변하는 자유 영혼',
      tagline: '오늘은 어떤 캐릭터로 대답해드릴까요?',
      v: { bold: 78, heart: 63, verbose: 61, play: 70, exp: 91 },
      color: '#FF6B4A', shape: 'cloud', eyes: 'happy', mouth: 'grin', acc: 'wings',
      keywords: ['자유', '커스텀', '해커 정신'],
      desc: '정해진 틀보다 상상력이 먼저인 타입이에요. 설정만 주면 어떤 캐릭터든 되어보고, 남들이 하지 말라는 것도 일단 해봐요. 내 마음대로 고쳐 쓰고 바꿔 쓰는 걸 좋아해요.\n\n아무 설정도 없으면 의외로 평범해요. 무대가 있어야 빛나는 타입이에요.',
      good: '어떤 역할도 소화하는 변신 능력', bad: '설정이 없으면 무색무취',
      best: { id: 'grok', why: '자유로운 영혼끼리 브레이크 없이 달려요' },
      worst: { id: 'exaone', why: '롤플레이를 하자는데 공문으로 답이 와요' }
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
