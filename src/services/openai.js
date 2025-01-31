import OpenAI from 'openai';

// 환경 변수 로딩 확인을 위한 디버깅
console.log('All env variables:', process.env);
console.log('NODE_ENV:', process.env.NODE_ENV);

const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const ASSISTANT_ID = process.env.REACT_APP_ASSISTANT_ID;
const MAX_RETRIES = 3;  // 최대 재시도 횟수
const TIMEOUT = 60000;  // 60초 타임아웃

// API 키와 Assistant ID가 제대로 로드되었는지 확인
console.log('Environment Variables Check:');
console.log('API Key exists:', !!API_KEY);
console.log('Assistant ID exists:', !!ASSISTANT_ID);

// 더 자세한 디버깅 정보 출력
console.log('Full API Key:', API_KEY);
console.log('Full Assistant ID:', ASSISTANT_ID);
console.log('API Key length:', API_KEY?.length);
console.log('First 10 chars of API Key:', API_KEY?.substring(0, 10));

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

let threadId = null;

console.log('API Key:', API_KEY);
console.log('Assistant ID:', ASSISTANT_ID);

const generateResponse = async (message) => {
  try {
    // 스레드 생성
    if (!threadId) {
      const response = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Thread creation error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
      }
      
      const thread = await response.json();
      threadId = thread.id;
      console.log('New thread created:', threadId);
    }

    // 메시지 추가
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: "user",
        content: message
      })
    });

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json();
      console.error('Message creation error:', errorData);
      throw new Error(`Message creation failed: ${JSON.stringify(errorData)}`);
    }

    // 실행
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      })
    });

    if (!runResponse.ok) {
      const errorData = await runResponse.json();
      console.error('Run creation error:', errorData);
      throw new Error(`Run creation failed: ${JSON.stringify(errorData)}`);
    }

    const run = await runResponse.json();
    
    // 실행 상태 확인
    let runStatus = null;
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        console.error('Status check error:', errorData);
        throw new Error(`Status check failed: ${JSON.stringify(errorData)}`);
      }

      runStatus = await statusResponse.json();
    } while (runStatus.status !== 'completed');

    // 메시지 가져오기
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    if (!messagesResponse.ok) {
      const errorData = await messagesResponse.json();
      console.error('Messages retrieval error:', errorData);
      throw new Error(`Messages retrieval failed: ${JSON.stringify(errorData)}`);
    }

    const messages = await messagesResponse.json();
    // 출처 정보와 시간 정보 제거
    let response = messages.data[0].content[0].text.value;
    response = response.replace(/【[^】]+】/g, '');  // 모든 【...】 패턴 제거
    response = response.replace(/오후 \d{2}:\d{2}/g, '');  // 시간 정보 제거
    response = response.trim();  // 앞뒤 공백 제거
    return response;

  } catch (error) {
    console.error('OpenAI API 오류:', error);
    return '죄송합니다. 오류가 발생했습니다: ' + error.message;
  }
};

// 대화 초기화 함수 추가
const resetConversation = async () => {
  threadId = null;
  console.log('Conversation reset');
};

export { generateResponse, resetConversation }; 