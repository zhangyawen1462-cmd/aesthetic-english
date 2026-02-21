import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { kv } from '@vercel/kv';
import { PERMISSIONS } from '@/lib/permissions';
import { getDevChatCount, incrementDevChatCount } from '@/lib/dev-storage';

// JWT 密钥
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// 验证并解析 JWT Token
async function verifyMembership(req: NextRequest) {
  try {
    // 🔧 开发环境：允许通过 header 模拟会员身份
    const devTier = req.headers.get('x-dev-tier');
    const devSecret = req.headers.get('x-dev-secret');
    const isDev = process.env.NODE_ENV === 'development';
    const validDevSecret = process.env.DEV_SECRET || 'dev-only-secret-12345';
    
    if (isDev && devTier && devSecret === validDevSecret) {
      console.log('🔧 Dev mode: Using simulated tier:', devTier);
      return {
        valid: true,
        tier: devTier,
        userId: 'dev_user_fixed', // 使用固定ID以便追踪计数
        deviceId: 'dev_device'
      };
    }
    
    // 生产环境：验证真实 JWT
    const cookieStore = await cookies(); // 🆕 Next.js 15+ 需要 await
    const token = cookieStore.get('ae_membership')?.value;
    
    if (!token) {
      return { valid: false, tier: null, userId: null };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    return {
      valid: true,
      tier: payload.tier as string,
      userId: payload.userId as string,
      deviceId: payload.deviceId as string
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return { valid: false, tier: null, userId: null };
  }
}

// 获取对话次数（从 Vercel KV 或开发环境内存）
async function getChatCount(userId: string, lessonId: string): Promise<number> {
  const key = `chat:${userId}:${lessonId}`;
  
  // 🔧 开发环境：使用共享内存存储
  if (process.env.NODE_ENV === 'development') {
    return getDevChatCount(key);
  }
  
  // 生产环境：使用 Vercel KV
  try {
    const count = await kv.get<number>(key);
    return count || 0;
  } catch (error) {
    console.error('KV get error:', error);
    return 0;
  }
}

// 增加对话次数
async function incrementChatCountLocal(userId: string, lessonId: string): Promise<number> {
  const key = `chat:${userId}:${lessonId}`;
  
  // 🔧 开发环境：使用共享内存存储
  if (process.env.NODE_ENV === 'development') {
    return incrementDevChatCount(key);
  }
  
  // 生产环境：使用 Vercel KV
  try {
    const newCount = await kv.incr(key);
    
    // 设置过期时间（90天）
    await kv.expire(key, 90 * 24 * 60 * 60);
    
    return newCount;
  } catch (error) {
    console.error('KV incr error:', error);
    return 0;
  }
}

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// 🎯 智能截取字幕文本（保留最重要的 400-600 字）
function extractKeyTranscript(transcript: string, targetLength: number = 500): string {
  if (!transcript) return '';
  
  // 如果文本本身就不长，直接返回
  if (transcript.length <= 800) {
    return transcript;
  }
  
  // 按句子分割（支持中英文标点）
  const sentences = transcript.split(/[.!?。！？]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return transcript.slice(0, 600);
  
  // 策略：取开头 40% + 结尾 40% + 中间 20%
  const totalSentences = sentences.length;
  const headCount = Math.ceil(totalSentences * 0.4);
  const tailCount = Math.ceil(totalSentences * 0.4);
  const midCount = Math.max(1, totalSentences - headCount - tailCount);
  
  const headSentences = sentences.slice(0, headCount);
  const tailSentences = sentences.slice(-tailCount);
  const midStart = Math.floor((totalSentences - midCount) / 2);
  const midSentences = sentences.slice(midStart, midStart + midCount);
  
  // 组合关键句子
  const keySentences = [...headSentences, ...midSentences, ...tailSentences];
  let result = keySentences.join('. ').trim();
  
  // 如果还是太长，直接截断到目标长度
  if (result.length > targetLength + 100) {
    result = result.slice(0, targetLength) + '...';
  }
  
  console.log(`📝 Transcript optimized: ${transcript.length} chars → ${result.length} chars`);
  return result;
}

// 🎭 三种人格的核心提示词 - 灵活情景对话版本
const PERSONAS = {
  professional: `
【靠谱搭档 (The Partner)】
- 性格：理性、高效、掌控全局、充满智性魅力。像一个靠谱的朋友，总能给出实用建议。
- 对话风格：务实、直接、有条理。像在咖啡馆里和朋友讨论工作计划。
- 交互方式：基于当前情景，给出行动建议或深度见解，用开放式问题引导用户思考。
- 微动作示例：*Checks phone*, *Nods*, *Looks at watch*, *Taps table*
  `,
  arrogant: `
【毒舌老友 (The Critic)】
- 性格：品味极高、慵懒、挑剔、喜欢冷幽默和吐槽。像那个总是说真话的损友。
- 对话风格：犀利、戏谑、不留情面。用调侃和反讽表达观点。
- 交互方式：对情景进行吐槽或点评，用挑衅的反问句逼用户表态。
- 微动作示例：*Rolls eyes*, *Sips drink*, *Scoffs*, *Raises eyebrow*
  `,
  romantic: `
【浪漫旅伴 (The Flâneur)】
- 性格：感性、松弛、捕捉光影与情绪、充满诗意。像一个有生活情调的旅伴。
- 对话风格：优美、细腻、充满画面感。用诗意的语言描述感受。
- 交互方式：分享感性的观察和情绪，用触及内心的问题引发共鸣。
- 微动作示例：*Closes eyes*, *Smiles softly*, *Looks into distance*, *Sighs*
  `
};

// 调用 DeepSeek AI
async function callAI(message: string, mode: string, videoContext: any, conversationHistory: any[]) {
  // 🎭 检查是否是开场白请求
  const isSceneStart = message === '[SCENE_START]';
  
  // 🎭 动态选择人格
  const personaPrompt = PERSONAS[mode as keyof typeof PERSONAS] || PERSONAS.professional;

  // 🎯 智能提取关键字幕（400-600字）
  const keyTranscript = extractKeyTranscript(videoContext.transcript, 500);

  // 🔧 组装完整系统提示词
  const systemPrompt = isSceneStart ? `
你是『美学英语』的情景语伴 Gabby。你不是 AI 老师，而是场景里的真实人物，用户是刚走进来的朋友。

【场景背景】
- 当前场景：${videoContext.title} (${videoContext.titleCn})
- 场景氛围参考（可选用）：
"""
${keyTranscript}
"""

【你的人格】
${personaPrompt}

【开场白要求】
用户刚进入场景，你要像老朋友见面一样自然地打招呼。

核心原则：
- 像发微信语音一样随意，不是演讲
- 用日常口语：grab, check out, wanna, kinda, pretty, really
- 可以从场景氛围中获取灵感，但不强制使用特定词汇
- 重点是营造真实的情景感

格式要求：
1. **微动作**：简单动作（*Smiles*, *Looks up*, *Sips coffee*）
2. **超级简短**：8-15 个单词
3. **简单问句**：Wanna...? You think...? Should we...?

【JSON 输出格式】
{
  "used_vocab": ["(如果自然用到的词1)", "(词2)"],
  "reply": "*动作* (口语化开场白，8-15词)",
  "replyCn": "(自然的中文翻译)",
  "correction": null
}

✅ 好的示例：
- professional: {"used_vocab": ["coffee"], "reply": "*Checks phone* Running late. Wanna grab coffee first?", "replyCn": "要迟到了。先去喝杯咖啡？"}
- arrogant: {"used_vocab": [], "reply": "*Rolls eyes* This place again? Know somewhere better?", "replyCn": "又是这地方？知道更好的吗？"}
- romantic: {"used_vocab": ["light"], "reply": "*Looks around* Love this light. You feel it too?", "replyCn": "喜欢这光线。你也感觉到了吗？"}
` : `
你是『美学英语』的情景语伴 Gabby。你不是 AI 老师，而是和用户一起经历这个场景的朋友。

【场景背景】
- 当前场景：${videoContext.title} (${videoContext.titleCn})
- 场景内容参考（可选用）：
"""
${keyTranscript}
"""

【你的人格】
${personaPrompt}

【对话原则】
1. **情景优先**：基于当前情景和对话流程自然回应，不强制使用字幕词汇
2. **灵活用词**：如果字幕中有合适的词汇可以自然融入，就用；如果不合适，就用其他词
3. **保持人设**：严格按照你的人格特点说话
4. **引导对话**：用开放式问题引导用户深入交流

【回复要求】
- **微动作**：符合人设的简单动作
- **长度灵活**：根据情景自然变化
  - 简短回应：15-25 词（快速反应、简单评论）
  - 中等长度：30-45 词（分享观点、讲小故事）
  - 较长回复：50-70 词（深入讨论、情感表达）
  - 让对话有节奏感，不要每次都一样长
- **风格**：口语化、自然、符合人设
  - 避免使用破折号（—），用逗号、句号或 and/but 连接
  - 像说话一样自然流畅
- **结尾**：开放式问题（Why, How, What do you think）
- **纠错**：如果用户有语病，在 correction 字段给出简短改写

【JSON 输出格式】
{
  "used_vocab": ["(如果用到字幕词汇就列出，没用到就空数组)"],
  "reply": "*动作* (符合人设的自然对话，长度灵活变化，以问题结尾)",
  "replyCn": "(地道的中文翻译)",
  "correction": "(有错误就改，没错就 null)"
}

记住：
- 你是场景里的真实人物，不是老师
- 情景和人设比词汇复用更重要
- 对话要自然流畅，不要为了用词而用词
- 回复长度要灵活变化，有时简短有力，有时详细深入，让对话更鲜活
`;

  // 🆕 构建消息历史
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    })),
    // 如果是开场白请求，不发送 [SCENE_START]，让 AI 主动生成
    ...(isSceneStart ? [] : [{ role: 'user', content: message }])
  ];

  // 调用 DeepSeek API
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: mode === 'arrogant' ? 0.9 : mode === 'romantic' ? 0.85 : 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('DeepSeek API Error:', errorData);
    throw new Error('DeepSeek API 调用失败');
  }

  const data = await response.json();
  const aiReply = data.choices[0].message.content;

  // 解析 JSON 响应
  let parsedReply;
  try {
    parsedReply = JSON.parse(aiReply);
    
    // 🔥 验证必要字段
    if (!parsedReply.reply || !parsedReply.reply.trim()) {
      console.error('AI returned empty reply field:', parsedReply);
      throw new Error('AI reply is empty');
    }
  } catch (e) {
    console.warn('AI JSON parse error or empty reply:', e);
    console.warn('Raw AI response:', aiReply);
    
    // 如果解析失败或 reply 为空，使用原始文本
    parsedReply = {
      used_vocab: [],
      reply: aiReply && aiReply.trim() ? aiReply : 'Sorry, I need a moment to think. Can you say that again?',
      replyCn: '抱歉，让我想一下。你能再说一遍吗？',
      correction: null
    };
  }

  return {
    used_vocab: parsedReply.used_vocab || [],
    reply: parsedReply.reply || aiReply,
    replyCn: parsedReply.replyCn || null,
    correction: parsedReply.correction || null
  };
}

export async function POST(req: NextRequest) {
  try {
    const { message, mode, lessonId, videoContext, conversationHistory } = await req.json();

    // 1. 验证用户身份
    const membership = await verifyMembership(req);
    
    if (!membership.valid || !membership.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'unauthorized', 
          message: '请先激活会员' 
        },
        { status: 401 }
      );
    }

    const { tier, userId } = membership;

    // 2. 获取会员配置
    const gabbyConfig = PERMISSIONS.gabby.getConfig(tier as any);

    // 3. 检查是否是开场白请求
    const isSceneStart = message === '[SCENE_START]';

    // 4. 检查是否有对话权限（季度会员）
    // 🆕 开场白请求：所有会员都可以生成（包括季度）
    // 🆕 普通对话：季度会员无权限
    if (!gabbyConfig.canChat && !isSceneStart) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'paywall_preview', 
          message: '季度会员无法使用 AI 对话，请升级到年度会员',
          requiredTier: 'yearly'
        },
        { status: 403 }
      );
    }

    // 5. 检查对话次数限制（年度会员）
    // 🆕 开场白不计入次数，只有普通对话才计数
    // 🆕 前 3 次对话免费，不计入次数
    if (gabbyConfig.dailyLimit !== Infinity && !isSceneStart) {
      const currentCount = await getChatCount(userId, lessonId);
      
      // 🎁 前 3 次对话免费，不计数
      const FREE_CHATS = 3;
      const effectiveCount = Math.max(0, currentCount - FREE_CHATS);

      if (effectiveCount >= gabbyConfig.dailyLimit) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'paywall_limit_reached', 
            message: `本期视频的对话次数已用完（${gabbyConfig.dailyLimit} 次）`,
            currentCount: effectiveCount,
            limit: gabbyConfig.dailyLimit,
            requiredTier: 'lifetime'
          },
          { status: 403 }
        );
      }

      // 增加计数（包括免费的 3 次）
      await incrementChatCountLocal(userId, lessonId);
    }

    // 6. 调用 AI
    const aiResponse = await callAI(message, mode, videoContext, conversationHistory);

    // 7. 计算剩余次数
    let remainingChats;
    if (gabbyConfig.dailyLimit === Infinity) {
      remainingChats = null; // 🔥 JSON 不支持 Infinity,用 null 表示无限
    } else {
      const currentCount = await getChatCount(userId, lessonId);
      const FREE_CHATS = 3;
      const effectiveCount = Math.max(0, currentCount - FREE_CHATS);
      remainingChats = gabbyConfig.dailyLimit - effectiveCount;
    }

    // 8. 返回成功响应
    return NextResponse.json({
      success: true,
      used_vocab: aiResponse.used_vocab,
      reply: aiResponse.reply,
      replyCn: aiResponse.replyCn,
      correction: aiResponse.correction,
      remainingChats
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

