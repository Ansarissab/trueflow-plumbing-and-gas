/**
 * Quote form — transcribed from the live site's own bundle
 * (public/_astro/PlumbProcess.…B-8Onm6k.js) so the new homepage talks to the
 * exact same worker contract:
 *
 *   POST https://moralservice-form-worker.lachlan-8db.workers.dev/submit
 *   - with photos:        FormData + submission_id (uuid) + page (path)
 *   - without photos:     URLSearchParams + page (path)
 *   - Turnstile rendered lazily (sitekey/size read from .cf-turnstile data
 *     attributes), token polled before send; missing token → "verify" failure.
 *   - friendly inline validation on the four required fields (novalidate is
 *     set from JS only, so JS-off visitors keep the native required checks).
 *   - success → gtag form_submit_success → inline success card replaces the
 *     form. The /thank-you page remains deployed for the live mirror flow.
 *   - failure → gtag form_submit_fail {fail_mode: 'send'} → data-fail-send note
 *
 * Also replicates the live homepage's trade preselect: buttons carrying
 * [data-preselect-service] set the service select before jumping to the form.
 */

const ENDPOINT = 'https://moralservice-form-worker.lachlan-8db.workers.dev/submit';

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
]);

/** Same messages as the live site — shown next to the file input. */
function photoError(files: FileList | File[]): string | null {
  if (files.length > 5) {
    return `That's ${files.length} photos — the limit is 5. Pick your best 5 and try again.`;
  }
  for (const file of files) {
    if (file.size > 10_485_760) {
      return `"${file.name}" is over 10 MB. Most phone photos are fine — this one may be a screen recording or export.`;
    }
    if (file.type && !ALLOWED_TYPES.has(file.type.toLowerCase())) {
      return `"${file.name}" isn't a photo we can accept (JPEG, PNG, WebP or iPhone HEIC only).`;
    }
  }
  return null;
}

function gtagEvent(event: string, params: Record<string, string> = {}) {
  window.gtag?.('event', event, params as never);
}

/* ---------------------------------------------------------------- Turnstile */

let turnstileLoad: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  return (
    turnstileLoad ||
    (turnstileLoad = new Promise<void>((resolve, reject) => {
      if (window.turnstile) return resolve();
      window.__ktTurnstileReady = () => resolve();
      const s = document.createElement('script');
      s.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__ktTurnstileReady';
      s.async = true;
      s.defer = true;
      s.onerror = () => reject(new Error('turnstile-load-failed'));
      document.head.appendChild(s);
    }))
  );
}

async function renderTurnstile(form: HTMLFormElement): Promise<void> {
  const box = form.querySelector<HTMLElement>('.cf-turnstile');
  if (!box || 'ktRendered' in box.dataset) return;
  box.dataset.ktRendered = 'true';
  try {
    await loadTurnstile();
    window.turnstile?.render(box, {
      sitekey: box.dataset.sitekey,
      size: box.dataset.size as 'normal' | 'flexible' | undefined,
    });
  } catch {
    // Let the submit path poll for the token; if it never arrives the visitor
    // gets the "verify" failure message, same as the live site's behaviour.
    delete box.dataset.ktRendered;
  }
}

/* ------------------------------------------------------------------- Wiring */

function wireForm(form: HTMLFormElement): void {
  if (form.dataset.wired) return;
  form.dataset.wired = 'true';

  const failNote = form.querySelector<HTMLElement>('[data-form-fail]');
  const fileInput = form.querySelector<HTMLInputElement>('input[type="file"][name="photos"]');
  const photoErrorMsg = form.querySelector<HTMLElement>('[data-photo-error]');
  const photoChosenMsg = form.querySelector<HTMLElement>('[data-photo-chosen]');

  /* Friendly inline validation. Rules only take over from JS — `noValidate`
     is set here so markup-driven native validation still protects JS-off. */
  form.noValidate = true;

  const fieldError = (el: HTMLInputElement | HTMLTextAreaElement, msg: string | null): void => {
    const err = el.closest<HTMLElement>('.field')?.querySelector<HTMLElement>('[data-error]');
    if (err) {
      err.textContent = msg ?? '';
      err.hidden = !msg;
    }
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };

  const rules = ([
    ['name', (v: string) => v.trim().length >= 2, 'Tell us your name so we know who to call back.'],
    [
      'phone',
      (v: string) => /^[+()\d\-.\s]{8,16}$/.test(v.trim()),
      "That number looks a little short — add your best contact number, e.g. 0400 000 000.",
    ],
    ['suburb', (v: string) => v.trim().length >= 2, 'Which suburb are you in? It helps us plan the visit.'],
    [
      'message',
      (v: string) => v.trim().length >= 5,
      'One quick line about the problem — \u201Ctap leaking under the sink\u201D is plenty.',
    ],
  ] as const)
    .map(([name, ok, msg]) => {
      const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
      return input ? { input, ok, msg } : null;
    })
    .filter((r) => r !== null) as { input: HTMLInputElement | HTMLTextAreaElement; ok: (v: string) => boolean; msg: string }[];

  // Errors clear themselves as soon as the field becomes valid while typing.
  rules.forEach(({ input, ok }) => {
    input.addEventListener('input', () => {
      if (ok(input.value) && input.getAttribute('aria-invalid') === 'true') fieldError(input, null);
    });
  });

  const setPhotoError = (message: string | null): void => {
    if (!photoErrorMsg) return;
    photoErrorMsg.textContent = message ?? '';
    photoErrorMsg.hidden = !message;
  };

  const setPhotoChosen = (message: string | null): void => {
    if (!photoChosenMsg) return;
    photoChosenMsg.textContent = message ?? '';
    photoChosenMsg.hidden = !message;
  };

  fileInput?.addEventListener('change', () => {
    const problem = fileInput.files ? photoError(fileInput.files) : null;
    if (problem) {
      setPhotoError(problem);
      setPhotoChosen(null);
      fileInput.value = '';
      return;
    }
    const count = fileInput.files?.length ?? 0;
    if (count === 1) setPhotoChosen(`1 photo attached — ${fileInput.files?.[0].name}`);
    else if (count > 1) setPhotoChosen(`${count} photos attached`);
    else setPhotoChosen(null);
    setPhotoError(null);
  });

  // Turnstile is fetched on the visitor's first interaction with the form —
  // no third-party script on page load.
  const wake = (): void => void renderTurnstile(form);
  form.addEventListener('focusin', wake);
  form.addEventListener('pointerdown', wake);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if ('submitting' in form.dataset) return;
    form.dataset.submitting = 'true';

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type=submit]');
    const originalLabel = submitBtn?.textContent ?? '';
    const unbusy = (): void => {
      delete form.dataset.submitting;
      if (submitBtn) {
        submitBtn.disabled = false;
        if (originalLabel) submitBtn.textContent = originalLabel;
      }
    };
    if (submitBtn) submitBtn.disabled = true;

    // Friendly validation first — no spinner, no Turnstile wait when the
    // visitor can fix a field instead.
    let firstBad: HTMLInputElement | HTMLTextAreaElement | null = null;
    for (const { input, ok, msg } of rules) {
      const good = ok(input.value);
      fieldError(input, good ? null : msg);
      if (!good && !firstBad) firstBad = input;
    }
    if (firstBad) {
      unbusy();
      firstBad.focus();
      firstBad.scrollIntoView({
        block: 'center',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
      return;
    }

    const showFail = (failMode: 'send' | 'verify'): void => {
      gtagEvent('form_submit_fail', { fail_mode: failMode });
      if (!failNote) return;
      const failSend = failNote.querySelector<HTMLElement>('[data-fail-send]');
      const failVerify = failNote.querySelector<HTMLElement>('[data-fail-verify]');
      if (failSend) failSend.hidden = failMode !== 'send';
      if (failVerify) failVerify.hidden = failMode !== 'verify';
      failNote.hidden = false;
    };

    if (submitBtn) submitBtn.textContent = 'Sending…';

    // Make sure the widget exists, then poll briefly for its token.
    const widget = form.querySelector<HTMLElement>('.cf-turnstile');
    const token = (): string => form.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? '';

    if (widget) await renderTurnstile(form);

    if (widget && !token()) {
      const deadline = Date.now() + 10_000;
      while (!token() && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    if (widget && !token()) {
      showFail('verify');
      unbusy();
      return;
    }

    // Payload mirrors the live worker contract exactly.
    const data = new FormData(form);
    data.set('page', window.location.pathname);

    const hasPhotos = !!fileInput?.files && fileInput?.files.length > 0;
    let body: BodyInit;
    if (hasPhotos) {
      const problem = fileInput?.files ? photoError(fileInput.files) : null;
      if (problem) {
        setPhotoError(problem);
        unbusy();
        return;
      }
      data.set('submission_id', crypto.randomUUID());
      body = data;
    } else {
      data.delete('photos');
      body = new URLSearchParams(data as unknown as Record<string, string>);
    }

    try {
      const response = await fetch(ENDPOINT, { method: 'POST', body });
      if (!response.ok) throw new Error(String(response.status));
      gtagEvent('form_submit_success', { transport_type: 'beacon' });

      // Success replaces the form in place (worker contract unchanged).
      const success = form.querySelector<HTMLElement>('[data-qf-success]');
      if (success) {
        success.hidden = false;
        form.classList.add('is-sent');
        success.focus({ preventScroll: true });
      }
      unbusy();
    } catch {
      showFail('send');
      unbusy();
      if (widget) window.turnstile?.reset(widget);
    }
  });
}

/* ------------------------------------------------------- Trade preselect */

function wirePreselect(): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-preselect-service]').forEach((link) => {
    link.addEventListener('click', () => {
      const want = link.getAttribute('data-preselect-service');
      const select = document.querySelector<HTMLSelectElement>('#quote select[name="service"]');
      if (!select || !want) return;
      const match = Array.prototype.find.call(select.options, (o: HTMLOptionElement) =>
        o.value === want || o.textContent?.trim() === want
      ) as HTMLOptionElement | undefined;
      if (!match) return;
      select.value = match.value || (match.textContent ?? '').trim();
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-quote-form]').forEach(wireForm);
wirePreselect();

/* ------------------------------------------------------------------- types */

/* Window augmentation for the two live-site globals this script talks to
   (Turnstile widget API and the analytics gtag). Declared inline in
   `declare global` so there is no intermediate interface circle. */
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey?: string; size?: 'normal' | 'flexible' }) => unknown;
      reset: (el?: HTMLElement) => void;
    };
    __ktTurnstileReady?: () => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export {};
