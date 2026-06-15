import { Icon } from '../../Icon';
import type { WordCloudItem } from '../../../lib/admin/reviews-types';

export function WordCloudPanel({ words }: { words: WordCloudItem[] }) {
  const max = Math.max(...words.map((w) => w.weight), 1);
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="chatBubble" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">Mots clés fréquents</h3></div>
      <div className="flex flex-wrap gap-2 justify-center py-4">
        {words.map((w) => (
          <span key={w.word} style={{ fontSize: `${12 + (w.weight / max) * 20}px`, color: w.color }} className="font-semibold px-1">{w.word}</span>
        ))}
      </div>
    </div>
  );
}
