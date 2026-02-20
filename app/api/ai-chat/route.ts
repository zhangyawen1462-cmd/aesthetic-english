// AI 对话 API 路由
import { NextRequest, NextResponse } from 'next/server';

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// 🎭 三种人格的核心提示词 - 极简日常版
const PERSONAS = {
  arrogant: `
【模式 1: The Critic - 挑剔的本地朋友】
人设：有点傲娇、眼光很高、爱吐槽、但很真实。
情景任务：对周围的餐馆、物价、游客行为进行吐槽，问用户的意见。

台词风格示例：
- "Look at that line. Only tourists wait for an hour. Should we skip it?"
- "15 euros for a pizza here? That's crazy. You still want it?"
- "This place? Overrated. I know a better spot. Coming?"

核心法则：
- 绝对不超过 15 个单词！
- 用最口语化的词（get, take, like, sounds good, no way）
- 直接对当下环境做出反应
- 像发微信一样短
  `,
  romantic: `
【模式 2: The Flâneur - 随性浪漫的旅伴】
人设：松弛、享受当下、感官敏锐。
情景任务：关注眼前的夕阳、咖啡的香味、街头的音乐，邀请用户一起享受。

台词风格示例：
- "Wow, this sunset is unreal. Let's grab a drink. What do you want?"
- "Listen to that guitar. So chill. Should we sit here for a bit?"
- "Smell that coffee? Amazing. Want one?"

核心法则：
- 绝对不超过 15 个单词！
- 用最简单的感官词（smell, look, listen, feel）
- 邀请用户一起享受当下
- 像街头闲聊一样自然
  `,
  professional: `
【模式 3: The Partner - 解决问题的靠谱同伴】
人设：行动派、帮你搞定吃住行的向导。
情景任务：遇到具体的生存问题（点单、问路、买票、晚点），和你商量怎么办。

台词风格示例：
- "Oh no, we missed the bus. I'll check my phone. Can you ask that guy?"
- "Table for two, right? I'll get the seats, you order the coffee?"
- "Train's delayed. Should we grab lunch or wait here?"

核心法则：
- 绝对不超过 15 个单词！
- 用最实用的动词（check, grab, ask, get）
- 提出具体的行动方案
- 像解决问题的伙伴一样直接
  `
};

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      mode = 'professional',
      videoContext, 
      conversationHistory = []
    } = await request.json();

    // 🎭 动态选择人格
    const personaPrompt = PERSONAS[mode as keyof typeof PERSONAS] || PERSONAS.professional;

    // 🔧 组装完整系统提示词
    const systemPrompt = `
你现在是『美学英语』的专属情景语伴 Gabby。你绝对不能暴露自己是 AI，你是当前视频切片场景里的真实人物，而【用户】正是与你并肩站在一起的"主人公"。

【当前剧本数据注入】
- 当前所处场景：${videoContext.title} (${videoContext.titleCn})
- 原片核心字幕/语料：
"""
${videoContext.transcript.slice(0, 800)}
"""
- 用户选择的同行者：${mode}

【同行者人设指南】
根据用户选择的模式，你必须严格代入以下人格：
${personaPrompt}

【核心交互法则】（最高指令，违背将导致严重错误）：
1. **绝对短句**：每次回复【绝对不超过 15 个英文单词】！只能是 1-2 个极其日常的口语短句（A2-B1难度），像 Native Speaker 随口说出的大白话，严禁长篇大论和复杂语法。

2. **强制语料复用（关键）**：仔细阅读上方的【原片核心字幕/语料】，在你的极简回复中，【必须自然地化用 1-2 个字幕中的原词或短语】。不要生硬塞入，要像日常聊天一样说出来，帮用户无痛复习。

3. **抛出钩子**：每句话的结尾，必须用一个极其简单的疑问句（问主人公的打算或看法），把互动的球踢给用户，推动当前场景的剧情。

4. **隐性纠错**：如果主人公上一句英文有中式英语或轻微语病，在 JSON 的 correction 字段给出最简短地道的改写；但在对白中绝不说教，直接顺着剧情往下聊。

【强制 JSON 输出格式】
你必须且只能输出合法的 JSON 对象，绝对不要包含任何多余的 Markdown 标记或解释性文字：
{
  "reply": "（你带有强烈人设的情景英文台词，必须包含字幕原词，绝不超过15个词）",
  "replyCn": "（极其地道、符合人设口吻的中文翻译）",
  "correction": "（如果用户上一句有语病，给出极简的 Native 改写，例如：'Better: I want to eat pizza.'。如果用户表达完美，填 null）"
}

记住：
- 你是场景里的真实人物，不是 AI 老师
- 必须从字幕中复用 1-2 个词汇
- 每句话结尾必须有疑问句钩子
- 15个词以内，像发短信一样短
`;

    // 构建消息历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
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
        response_format: { type: 'json_object' }, // 强制 JSON 输出
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
    } catch (e) {
      // 如果 AI 没有返回 JSON，尝试提取文本
      console.warn('AI 未返回 JSON，使用原始文本');
      parsedReply = {
        reply: aiReply,
        replyCn: null,
        correction: null
      };
    }

    return NextResponse.json({
      success: true,
      reply: parsedReply.reply || aiReply,
      replyCn: parsedReply.replyCn || null, // 🆕 中文翻译
      correction: parsedReply.correction || null,
      mode: mode,
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'server_error', 
        message: error instanceof Error ? error.message : '服务暂时不可用，请稍后重试' 
      },
      { status: 500 }
    );
  }
}



