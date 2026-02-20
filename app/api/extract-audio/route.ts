import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, filename } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: '缺少视频URL' },
        { status: 400 }
      );
    }

    console.log('代理下载视频:', videoUrl);
    
    // 通过服务端代理下载，避免客户端 CORS 问题
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error('视频下载失败:', response.status, response.statusText);
      throw new Error(`无法获取视频文件: ${response.status}`);
    }

    const videoBuffer = await response.arrayBuffer();
    console.log('视频下载成功，大小:', videoBuffer.byteLength);
    
    // 返回视频文件给客户端，让客户端使用 ffmpeg.wasm 处理
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('音频提取失败:', error);
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { error: `音频提取失败: ${errorMsg}` },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

