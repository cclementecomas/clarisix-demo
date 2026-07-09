import { STAGE_COLOR } from './tokens';
import { pct } from '../searchfunnel/format';

/** Four labeled funnel-share cells (Impr → Click → Basket → Purch), stage-coloured. */
export default function MiniWaterfall({ imp, click, basket, purch }: { imp: number; click: number; basket: number; purch: number }) {
  const cells: { key: keyof typeof STAGE_COLOR; label: string; v: number; tip: string }[] = [
    { key: 'impressions', label: 'Impr', v: imp, tip: `Impression share ${pct(imp)} — your impressions ÷ market impressions` },
    { key: 'clicks', label: 'Click', v: click, tip: `Click share ${pct(click)} — your clicks ÷ market clicks` },
    { key: 'baskets', label: 'Basket', v: basket, tip: `Basket-add share ${pct(basket)} — your basket adds ÷ market basket adds` },
    { key: 'purchases', label: 'Purch', v: purch, tip: `Purchase share ${pct(purch)} — your purchases ÷ market purchases` },
  ];
  return (
    <div className="inline-flex items-stretch gap-1">
      {cells.map((c) => (
        <div key={c.key} title={c.tip} className="flex flex-col items-center rounded-sm px-1.5 py-0.5 bg-gray-50 border border-gray-100 min-w-[38px] cursor-default">
          <span className="w-full h-0.5 rounded-full mb-0.5" style={{ backgroundColor: STAGE_COLOR[c.key] }} />
          <span className="text-[8px] font-semibold uppercase tracking-wide text-gray-400 leading-none">{c.label}</span>
          <span className="text-[10px] font-bold text-gray-800 tabular-nums leading-tight">{pct(c.v, 0)}</span>
        </div>
      ))}
    </div>
  );
}
