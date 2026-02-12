import type { TranscriptLine } from "@/data/types";

/**
 * 解析双语 SRT 字幕文本
 *
 * 格式约定（每个字幕块）：
 *   序号
 *   HH:MM:SS,mmm --> HH:MM:SS,mmm
 *   English text
 *   中文翻译
 *
 * 块之间用空行分隔
 */
export function parseSRT(srtRaw: string): TranscriptLine[] {
  if (!srtRaw || !srtRaw.trim()) return [];

  const blocks = srtRaw.trim().split(/\n\s*\n/);
  const results: TranscriptLine[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    const id = parseInt(lines[0], 10);
    if (isNaN(id)) continue;

    const timeMatch = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (!timeMatch) continue;

    const start =
      parseInt(timeMatch[1]) * 3600 +
      parseInt(timeMatch[2]) * 60 +
      parseInt(timeMatch[3]) +
      parseInt(timeMatch[4]) / 1000;

    const end =
      parseInt(timeMatch[5]) * 3600 +
      parseInt(timeMatch[6]) * 60 +
      parseInt(timeMatch[7]) +
      parseInt(timeMatch[8]) / 1000;

    const en = lines[2] || '';
    const cn = lines.length >= 4 ? lines[3] : '';

    results.push({ id, start, end, en, cn });
  }

  return results;
}
