'use client';
import { useState, type SubmitEvent } from 'react';
import { ArrowUpRight, LoaderCircle, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CONTACT_ENDPOINT, NEW_ISSUE } from './links';
import {
  EMPTY_DRAFT,
  KIND_LABELS,
  KINDS,
  LIMITS,
  payload,
  send,
  type Context,
  type Draft,
  type Kind,
  type Outcome,
} from './feedback';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Read at the moment of sending, so it is what the reader sees then. */
  context: () => Context;
};

type Status = 'idle' | 'sending' | Outcome;

const PROBLEMS: Partial<Record<Status, string>> = {
  invalid:
    'Something in the form could not be accepted. Check the message is between 10 and 5000 characters and the email address is complete.',
  rate_limited:
    'That is a lot of messages in a short time. Please wait a few minutes and try again.',
  failed:
    'The message could not be sent. Check your connection and try again; what you wrote is still here.',
};

/**
 * A message to the maintainer. The form posts to `api/contact.ts`, which holds
 * the mail credentials; nothing here knows where the message ends up.
 *
 * The dialog stays mounted once opened, so the draft survives closing it.
 * Only a sent message clears it.
 */
export default function FeedbackDialog({ open, onOpenChange, context }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<Status>('idle');
  const [replyTo, setReplyTo] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const change = (next: boolean) => {
    if (!next && status === 'sent') {
      setDraft(EMPTY_DRAFT);
      setStatus('idle');
    } else if (!next && status !== 'sending') {
      setStatus('idle');
    }
    onOpenChange(next);
  };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    const outcome = await send(CONTACT_ENDPOINT, payload(draft, context()));
    if (outcome === 'sent') {
      setReplyTo(draft.email.trim() !== '');
      setDraft(EMPTY_DRAFT);
    }
    setStatus(outcome);
  };

  const length = draft.message.trim().length;
  const problem = PROBLEMS[status];

  return (
    <Dialog open={open} onOpenChange={change} modal>
      <DialogContent className="about-dialog feedback-dialog">
        <DialogTitle>Send feedback</DialogTitle>
        <DialogDescription>
          Spotted a mistake, have an idea, or want to work together on PC
          Anatomy? Tell me here.
        </DialogDescription>
        {status === 'sent' ? (
          <div className="feedback-done">
            <output>
              Thank you, your message was sent.
              {replyTo && ' I will reply to the address you gave.'}
            </output>
            <button
              type="button"
              className="feedback-submit"
              onClick={() => setStatus('idle')}
            >
              Send another
            </button>
          </div>
        ) : status === 'unavailable' ? (
          <div className="feedback-done" role="alert">
            <p>
              The feedback form is not available on this copy of the site. You
              can open an issue on GitHub instead; what you wrote is kept here
              so you can copy it across.
            </p>
            <a
              className="feedback-submit"
              href={NEW_ISSUE}
              target="_blank"
              rel="noreferrer"
            >
              Open a GitHub issue
              <ArrowUpRight size={15} />
            </a>
            <button
              type="button"
              className="feedback-back"
              onClick={() => setStatus('idle')}
            >
              Back to the form
            </button>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={submit}>
            <fieldset className="feedback-kinds">
              <legend>What is it about?</legend>
              {KINDS.map((kind) => (
                <label key={kind}>
                  <input
                    type="radio"
                    name="kind"
                    value={kind}
                    checked={draft.kind === kind}
                    onChange={() => set('kind', kind as Kind)}
                  />
                  <span>{KIND_LABELS[kind]}</span>
                </label>
              ))}
            </fieldset>
            <div className="feedback-row">
              <label>
                <span>
                  Name <small>optional</small>
                </span>
                <input
                  name="name"
                  value={draft.name}
                  onChange={(e) => set('name', e.target.value)}
                  maxLength={LIMITS.name}
                  autoComplete="name"
                />
              </label>
              <label>
                <span>
                  Email <small>optional, so I can reply</small>
                </span>
                <input
                  name="email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => set('email', e.target.value)}
                  maxLength={LIMITS.email}
                  autoComplete="email"
                />
              </label>
            </div>
            <div className="feedback-message">
              <label>
                <span>Message</span>
                <textarea
                  name="message"
                  value={draft.message}
                  onChange={(e) => set('message', e.target.value)}
                  required
                  minLength={LIMITS.messageMin}
                  maxLength={LIMITS.messageMax}
                  rows={5}
                  aria-describedby="feedback-count"
                />
              </label>
              <small id="feedback-count" className="feedback-count">
                {length < LIMITS.messageMin
                  ? `At least ${LIMITS.messageMin} characters`
                  : `${length} / ${LIMITS.messageMax}`}
              </small>
            </div>
            {/* Off screen and out of the tab order: people never see it, bots
                fill it in, and the server drops anything that has it set. */}
            <div className="feedback-trap" aria-hidden="true">
              <label>
                Website
                <input
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={draft.website}
                  onChange={(e) => set('website', e.target.value)}
                />
              </label>
            </div>
            <p className="feedback-note">
              The address of this page, what you have selected and the interface
              language are sent along with your message. Your message is emailed
              to the PC Anatomy maintainer and only used to reply to you.
            </p>
            {problem && (
              <p className="feedback-error" role="alert">
                {problem}
              </p>
            )}
            <button
              className="feedback-submit"
              type="submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? (
                <LoaderCircle size={15} className="feedback-spin" />
              ) : (
                <Send size={15} />
              )}
              {status === 'sending' ? 'Sending…' : 'Send'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
