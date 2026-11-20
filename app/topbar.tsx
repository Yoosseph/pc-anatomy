'use client';
import {
  BookOpen,
  Cpu,
  Info,
  Layers3,
  MessageSquare,
  Search,
} from 'lucide-react';
import { t } from '@/lib/i18n/messages';
import { GUIDE, REPOSITORY } from './links';
import LanguagePicker from './language-picker';

/** GitHub's mark (Octicons, MIT). lucide-react no longer ships brand icons. */
function GitHubMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

type Props = {
  layers: boolean;
  onReset: () => void;
  onToggleLayers: () => void;
  onSearch: () => void;
  onAbout: () => void;
  onFeedback: () => void;
};

export default function Topbar({
  layers,
  onReset,
  onToggleLayers,
  onSearch,
  onAbout,
  onFeedback,
}: Props) {
  return (
    <header className="topbar">
      <button className="brand" onClick={onReset} aria-label={t.topbar.reset}>
        <span className="brand-icon">
          <Cpu size={21} />
        </span>
        <span>PC Anatomy</span>
      </button>
      <a
        className="byline"
        href={REPOSITORY}
        target="_blank"
        rel="noreferrer"
        title={t.topbar.github}
      >
        <GitHubMark size={13} />
        <span className="byline-text">
          <span className="byline-prefix">{t.topbar.createdBy} </span>
          <strong>Yoseph</strong>
        </span>
      </a>
      <div className="header-actions">
        {/* First and filled: the one control in the bar that is about the
            site rather than the hardware, so it should be found without
            looking for it. */}
        <button
          className="chip chip-accent feedback-button"
          onClick={onFeedback}
          title={t.topbar.feedbackTitle}
        >
          <MessageSquare size={15} />
          {/* One of the two is hidden at a time, so the button's name is
              always the label that is showing. */}
          <span className="label-full">{t.topbar.feedback}</span>
          <span className="label-short">{t.topbar.feedbackShort}</span>
        </button>
        <a className="chip guide-link" href={GUIDE} title={t.topbar.guideTitle}>
          <BookOpen size={15} />
          <span>{t.topbar.guide}</span>
        </a>
        <button
          className="mobile-layers"
          onClick={onToggleLayers}
          aria-label={t.topbar.toggleSystems}
          aria-expanded={layers}
        >
          <Layers3 size={19} />
        </button>
        <button
          className="search-button"
          aria-label={t.topbar.findComponent}
          onClick={onSearch}
        >
          <Search size={16} />
          <span>{t.topbar.search}</span>
          <kbd>/</kbd>
        </button>
        <button
          className="chip info-button"
          aria-label={t.topbar.aboutLabel}
          title={t.topbar.aboutTitle}
          onClick={onAbout}
        >
          <Info size={16} />
          <span>{t.topbar.about}</span>
        </button>
        <LanguagePicker />
      </div>
    </header>
  );
}
