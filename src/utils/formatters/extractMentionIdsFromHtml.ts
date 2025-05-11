// utils/html.ts (hoặc trong service nếu dùng nội bộ)
import * as cheerio from 'cheerio';

export function extractMentionIdsFromHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const ids: string[] = [];

  $('.mymention').each((_, el) => {
    const id = $(el).attr('data-mention-id');
    if (id) ids.push(id);
  });

  return ids;
}
