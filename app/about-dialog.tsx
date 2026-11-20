'use client';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { sources } from '@/lib/manifest';
import { t } from '@/lib/i18n/messages';
import { GUIDE, GUIDE_ACCELERATION, REPOSITORY } from './links';

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export default function AboutDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="about-dialog">
        <DialogTitle>{t.about.title}</DialogTitle>
        <DialogDescription>{t.about.description}</DialogDescription>
        <p>{t.about.intro}</p>
        <h3>{t.about.modelsHeading}</h3>
        <p>
          <strong>{t.about.hardware}</strong> {t.about.hardwareText}
        </p>
        <p>
          <strong>{t.about.silicon}</strong> {t.about.siliconText}
        </p>
        <h3>{t.about.creditsHeading}</h3>
        <a className="about-source" href={GUIDE_ACCELERATION}>
          {t.about.acceleration} <ArrowUpRight size={15} />
        </a>
        <a className="about-source" href={GUIDE}>
          {t.about.guide}
          <ArrowUpRight size={15} />
        </a>
        {Object.entries(sources)
          .slice(0, 2)
          .map(([id, s]) => (
            <a
              className="about-source"
              key={id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
            >
              {s.name}
              <ArrowUpRight size={15} />
            </a>
          ))}
        <a
          className="about-source"
          href="https://github.com/ashemag/human-atlas"
          target="_blank"
          rel="noreferrer"
        >
          {t.about.inspiration}
          <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
        >
          {t.about.source}
          <ArrowUpRight size={15} />
        </a>
        <p className="about-foot">{t.about.foot}</p>
      </DialogContent>
    </Dialog>
  );
}
