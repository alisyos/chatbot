import OpenAI from 'openai';

const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const ASSISTANT_ID = process.env.REACT_APP_ASSISTANT_ID;
const MAX_RETRIES = 3;  // 최대 재시도 횟수
const TIMEOUT = 60000;  // 60초 타임아웃

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

let threadId = null;

console.log('API Key:', API_KEY);
console.log('Assistant ID:', ASSISTANT_ID);

const generateResponse = async (message) => {
  try {
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      console.log('New thread created:', threadId);
    }

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message
    });

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID
    });

    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    let retries = 0;
    let startTime = Date.now();
    
    while (runStatus.status !== 'completed') {
      // 상태 확인 간격을 동적으로 조정
      const delay = runStatus.status === 'in_progress' ? 1000 : 2000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      
      // 오류 상태 처리
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
        if (retries < MAX_RETRIES) {
          console.log(`Retrying... Attempt ${retries + 1} of ${MAX_RETRIES}`);
          retries++;
          // 새로운 실행 시작
          const newRun = await openai.beta.threads.runs.create(threadId, {
            assistant_id: ASSISTANT_ID
          });
          run.id = newRun.id;
          runStatus = newRun;
          continue;
        }
        throw new Error(`Assistant run ${runStatus.status}`);
      }

      // 타임아웃 체크
      if (Date.now() - startTime > TIMEOUT) {
        throw new Error('Response timeout');
      }

      // requires_action 상태 처리
      if (runStatus.status === 'requires_action') {
        // 필요한 경우 여기에 추가 작업 처리 로직 구현
        console.log('Action required:', runStatus.required_action);
      }
    }

    // 완료된 메시지 가져오기
    const messages = await openai.beta.threads.messages.list(threadId);
    
    if (!messages.data.length || !messages.data[0].content.length) {
      throw new Error('Empty response received');
    }

    const lastMessage = messages.data[0];
    let response = lastMessage.content[0].text.value;

    // 출처 정보 제거
    response = response.replace(/【[^】]*】/g, '');
    
    // 끝에 있을 수 있는 마침표 확인 및 추가
    if (!response.endsWith('.') && !response.endsWith('?') && !response.endsWith('!')) {
      response = response + '.';
    }

    // 응답이 특정 문구로 끝나는지 확인
    if (response.endsWith('조금만 기다려 주세요.') || 
        response.endsWith('잠시만 기다려주세요.')) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return await generateResponse('이어서 답변해 주세요.');
    }

    return response;

  } catch (error) {
    console.error('OpenAI API 오류:', error);
    return '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.';
  }
};

// 대화 초기화 함수 추가
const resetConversation = async () => {
  threadId = null;
  console.log('Conversation reset');
};

export { generateResponse, resetConversation }; 