'use client';

import type { SocialBriefData } from '@/types/social-brief';

interface SocialBriefViewProps {
  data: SocialBriefData;
}

export function SocialBriefView({ data }: SocialBriefViewProps) {
  const { content_pillars, channels, hashtag_strategy, brandVoice } = data;

  return (
    <div className="space-y-8 text-[var(--text-secondary)]">
      {brandVoice && (
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Voix de marque
          </h3>
          <p className="text-[15px] leading-[1.7] whitespace-pre-wrap">{brandVoice}</p>
        </section>
      )}

      {content_pillars && content_pillars.length > 0 && (
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Piliers de contenu
          </h3>
          <div className="space-y-4">
            {content_pillars.map((pillar, i) => (
              <div
                key={i}
                className="rounded-lg p-4 border"
                style={{
                  borderColor: 'var(--accent-magenta)20',
                  background: 'var(--accent-magenta)08',
                }}
              >
                <h4 className="font-semibold text-[var(--text-primary)] text-sm mb-2">{pillar.title}</h4>
                <p className="text-[14px] leading-[1.6] mb-2">{pillar.description}</p>
                {pillar.contentIdeas && pillar.contentIdeas.length > 0 && (
                  <ul className="text-[13px] text-[var(--text-muted)] list-disc list-inside space-y-1">
                    {pillar.contentIdeas.map((idea, j) => (
                      <li key={j}>{idea}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {channels && channels.length > 0 && (
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Canaux
          </h3>
          <div className="space-y-3">
            {channels.map((ch, i) => (
              <div
                key={i}
                className="rounded-lg p-3 border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]"
              >
                <h4 className="font-semibold text-[var(--text-primary)] text-sm capitalize">{ch.channel}</h4>
                {ch.objectives && ch.objectives.length > 0 && (
                  <p className="text-[13px] mt-1">
                    <span className="text-[var(--text-muted)]">Objectifs : </span>
                    {ch.objectives.join(', ')}
                  </p>
                )}
                {ch.tone && (
                  <p className="text-[13px] mt-0.5">
                    <span className="text-[var(--text-muted)]">Tonalité : </span>
                    {ch.tone}
                  </p>
                )}
                {ch.postingFrequency && (
                  <p className="text-[13px] mt-0.5">
                    <span className="text-[var(--text-muted)]">Fréquence : </span>
                    {ch.postingFrequency}
                  </p>
                )}
                {ch.contentSuggestions && ch.contentSuggestions.length > 0 && (
                  <ul className="text-[12px] text-[var(--text-muted)] mt-2 list-disc list-inside space-y-0.5">
                    {ch.contentSuggestions.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {hashtag_strategy && (
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Stratégie hashtags
          </h3>
          <p className="text-[15px] leading-[1.7] whitespace-pre-wrap">{hashtag_strategy}</p>
        </section>
      )}
    </div>
  );
}
