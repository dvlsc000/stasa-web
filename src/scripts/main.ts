import { ScrollTrigger, initScroll, $ } from './ctx';
import { initThreads, signatureTween } from './thread';
import { runPreloader } from './preloader';
import { heroIntro, heroDiorama } from './hero';
import { initFlounces } from './flounce';
import { initWalk } from './walk';
import { initSalon } from './salon';
import { initPlaybill } from './playbill';
import { initCursor } from './cursor';
import { initEyes } from './eyes';
import { initPlate } from './plate';
import { initForm } from './form';
import { initLang, restoreLangPos } from './lang';

initScroll();

// the header steps aside while you read down the page and comes back when you scroll up
{
  let last = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (Math.abs(y - last) < 6) return;
    document.body.classList.toggle('is-reading', y > last && y > innerHeight * 0.7);
    last = y;
  }, { passive: true });
}
initCursor();
initLang();
initPlate();

if (document.body.classList.contains('home')) {
  const intro = heroIntro();
  intro?.pause();
  heroDiorama();
  initFlounces();
  initWalk();
  initSalon();
  initPlaybill();
  initThreads();
  initEyes();
  initForm();

  // the closing signature: the thread signs her name as you reach the end
  const sig = $<SVGSVGElement>('.commissions__sign .signature');
  if (sig && !document.documentElement.classList.contains('is-reduced')) {
    signatureTween(sig, { scrollTrigger: { trigger: sig, start: 'top 85%', end: 'bottom 55%', scrub: 0.8 } });
  }

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
  restoreLangPos();
  runPreloader().then(() => intro?.play());
} else {
  initEyes();
}
