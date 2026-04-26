'use client';

import { useState } from 'react';
import { ReviewPanel } from './ReviewPanel';

export function AssetCardClient({ asset }: { asset: any }) {
  const [reviewOpen, setReviewOpen] = useState(false);

  const hasScript = !!asset.script_path;
  const hasVideo = !!asset.video_path;
  const isRendering = asset.status === 'rendering';
  const isFailed = asset.status === 'failed';

  return (
    <div className="bg-surface border border-line rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-xs text-sub uppercase tracking-wider">{asset.type ?? '—'}</div>
          <div className="text-sm font-semibold">{asset.insight_id ?? '—'}</div>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            asset.status === 'ready' ? 'bg-cyan/10 text-cyan' :
            isRendering ? 'bg-yellow-500/10 text-yellow-400' :
            isFailed ? 'bg-red-500/10 text-red-400' : 'bg-line text-sub'
          }`}>
            {asset.status}
          </span>
          {asset.brand_id && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-bg border border-line text-b-${asset.brand_id}`}>
              {asset.brand_id}
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-sub mb-3">{asset.created_at}</div>

      {hasVideo && (
        <video
          controls
          src={`/api/crm/file?p=${encodeURIComponent(asset.video_path)}`}
          className="w-full rounded mb-2 bg-bg"
        />
      )}
      {asset.audio_path && !hasVideo && (
        <audio
          controls
          src={`/api/crm/file?p=${encodeURIComponent(asset.audio_path)}`}
          className="w-full mb-2"
        />
      )}

      <div className="flex gap-2 text-xs flex-wrap mb-2">
        {asset.script_path  && <a href={`/api/crm/file?p=${encodeURIComponent(asset.script_path)}`}  className="text-cyan" target="_blank">Script</a>}
        {asset.caption_path && <a href={`/api/crm/file?p=${encodeURIComponent(asset.caption_path)}`} className="text-cyan" target="_blank">Caption</a>}
        {asset.audio_path   && <a href={`/api/crm/file?p=${encodeURIComponent(asset.audio_path)}`}   className="text-cyan" target="_blank">Audio</a>}
        {hasVideo           && <a href={`/api/crm/file?p=${encodeURIComponent(asset.video_path)}`}   className="text-cyan" target="_blank">Video</a>}
      </div>

      {hasScript && !hasVideo && !isRendering && (
        <button
          onClick={() => setReviewOpen((v) => !v)}
          className="w-full bg-indigo hover:opacity-90 text-white px-4 py-2 rounded-md text-sm font-semibold"
        >
          {reviewOpen ? 'Close review' : (isFailed ? 'Review & retry' : 'Review & Render Video')}
        </button>
      )}

      {hasScript && hasVideo && (
        <button
          onClick={() => setReviewOpen((v) => !v)}
          className="w-full border border-line hover:border-sub text-sub hover:text-ink px-4 py-2 rounded-md text-sm font-medium"
        >
          {reviewOpen ? 'Close review' : 'Edit script & re-render'}
        </button>
      )}

      {reviewOpen && <ReviewPanel assetId={asset.id} onClose={() => setReviewOpen(false)} />}

      {asset.error && (
        <div className="text-red-400 text-xs mt-2">Error: {asset.error}</div>
      )}
    </div>
  );
}
