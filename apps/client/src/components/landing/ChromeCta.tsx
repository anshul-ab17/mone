import Link from "next/link";
import styles from "./ChromeCta.module.css";

export interface ChromeCtaProps {
  href: string;
  label?: string;
}

export function ChromeCta({ href, label = "Launch App" }: ChromeCtaProps) {
  return (
    <Link href={href} className={styles.liquidBtn} data-testid="chrome-cta">
      <span className={styles.rim} aria-hidden />
      <span className={styles.glass} aria-hidden />
      <span className={styles.label}>{label}</span>

      <svg className={styles.filterDefs} aria-hidden>
        <defs>
          <filter id="cta-container-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
            <feComposite in="finalBlur" in2="finalBlur" operator="over" />
          </filter>
        </defs>
      </svg>
    </Link>
  );
}
