// Art-directed halftone pictures used when a story or episode has no photo yet.
// Set `plate` (picture) and `tone` (colourway) on a story to choose one.

const DK = "#0E0D0B", BL = "#1E3BFF";
export const TONES = { ink: [DK, "#F2EDE3"], cream: ["#E9E1D2", DK], blue: [BL, "#F2EDE3"], bone: ["#FAF8F3", DK] };
const H = (f, dense) => `url(#ht${f === DK ? "d" : "l"}${dense ? "" : "2"})`;
const Hx = (f, dense) => `url(#ht${f === DK ? "l" : "d"}${dense ? "" : "2"})`;
const rnd = (seed) => { let s = seed; return () => (s = s * 16807 % 2147483647) / 2147483647; };

const SUB = {
  bridge(f, g) {
    let h = "";
    for (let i = 1; i < 20; i++) { const t = i / 20, x = 300 + 400 * t, y = 340 * (1 - t) ** 2 + 2 * 620 * t * (1 - t) + 340 * t * t; h += `<line x1="${x}" y1="${y}" x2="${x}" y2="600"/>`; }
    return `<circle cx="660" cy="300" r="95" fill="${H(f)}"/><path d="M0 560L230 590L300 650L330 1000L0 1000Z M1000 560L770 590L700 650L670 1000L1000 1000Z" fill="${H(f, 1)}"/><g stroke="${f}" stroke-width="3">${h}</g><path d="M300 340Q500 620 700 340" stroke="${f}" stroke-width="9" fill="none"/><path d="M300 354Q500 634 700 354" stroke="${f}" stroke-width="5" fill="none"/><rect x="240" y="320" width="60" height="330" fill="${f}"/><rect x="700" y="320" width="60" height="330" fill="${f}"/><rect x="256" y="420" width="28" height="150" rx="14" fill="${g}"/><rect x="716" y="420" width="28" height="150" rx="14" fill="${g}"/><rect x="240" y="596" width="520" height="12" fill="${f}"/>`;
  },
  cranes(f) {
    const c = (x, s) => `<g transform="translate(${x} 700) scale(${s})" stroke="${f}" stroke-width="10" fill="none"><path d="M-45 0L0-190L45 0M-25-90H25M0-190V-300M0-210L240-360M0-300L240-360M0-210L-90-190M0-300L-90-190"/><rect x="-28" y="-250" width="56" height="50" fill="${f}"/><line x1="200" y1="-335" x2="200" y2="-200" stroke-width="3"/></g>`;
    return `<circle cx="300" cy="340" r="70" fill="${H(f)}"/>${c(160, .9)}${c(470, 1.12)}${c(790, .8)}<rect y="700" width="1000" height="300" fill="${H(f)}"/><rect y="696" width="1000" height="8" fill="${f}"/>`;
  },
  vinyl(f, g) {
    let r = "";
    for (let i = 130; i < 375; i += 9) r += `<circle cx="540" cy="500" r="${i}"/>`;
    return `<circle cx="540" cy="500" r="380" fill="${f}"/><g fill="none" stroke="${g}" stroke-opacity=".22" stroke-width="1.5">${r}</g><path d="M300 270A340 340 0 0 1 700 220" stroke="${g}" stroke-opacity=".3" stroke-width="40" fill="none"/><circle cx="540" cy="500" r="115" fill="${BL}"/><circle cx="540" cy="500" r="12" fill="${g}"/><path d="M930 120L800 420L740 470" stroke="#B9B3A6" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="930" cy="120" r="34" fill="#B9B3A6"/>`;
  },
  figure(f, g) {
    return `<path d="M120 1000C150 800 300 700 500 690C700 700 850 800 880 1000Z" fill="${f}"/><ellipse cx="500" cy="470" rx="195" ry="235" fill="${H(f, 1)}"/><ellipse cx="500" cy="470" rx="195" ry="235" fill="none" stroke="${f}" stroke-width="6"/><ellipse cx="512" cy="500" rx="105" ry="150" fill="${g}"/><ellipse cx="548" cy="520" rx="62" ry="118" fill="${H(f)}"/><path d="M470 660L455 820M552 660L567 820" stroke="${g}" stroke-width="7" stroke-linecap="round"/>`;
  },
  blocks(f, g) {
    const R = rnd(11);
    let w = "";
    for (let r = 0; r < 16; r++) for (let c = 0; c < 7; c++) w += `<rect x="${326 + c * 52}" y="${190 + r * 50}" width="30" height="28" fill="${R() < .28 ? "#F2C14E" : g}"/>`;
    return `<rect x="740" y="420" width="220" height="580" fill="${H(f, 1)}"/><rect x="40" y="520" width="200" height="480" fill="${H(f)}"/><rect x="300" y="160" width="400" height="840" fill="${f}"/>${w}`;
  },
  crowd(f) {
    const R = rnd(5);
    let p = "";
    for (let i = 0; i < 14; i++) {
      const x = i * 78 - 10 + R() * 30, y = 600 + R() * 70, r = 40 + R() * 14;
      p += `<circle cx="${x}" cy="${y}" r="${r}"/><rect x="${x - r * 1.6}" y="${y + r * .8}" width="${r * 3.2}" height="420" rx="${r}"/>`;
      if (i % 4 === 1) p += `<rect x="${x + r}" y="${y - 210}" width="22" height="250" rx="11" transform="rotate(14 ${x + r} ${y})"/>`;
    }
    return `<polygon points="430,0 570,0 920,1000 80,1000" fill="${f}" opacity=".16"/><polygon points="480,0 520,0 650,1000 350,1000" fill="${f}" opacity=".22"/><g fill="${DK}">${p}</g>`;
  },
  wall() {
    return `<rect width="1000" height="1000" fill="url(#brk)"/><path d="M260 300C300 200 520 180 640 250C760 320 780 470 700 560C640 630 520 640 430 610C330 580 220 420 260 300Z" fill="${BL}"/><g fill="${BL}"><rect x="330" y="560" width="18" height="200" rx="9"/><rect x="450" y="600" width="18" height="290" rx="9"/><rect x="565" y="600" width="16" height="130" rx="8"/><rect x="655" y="540" width="20" height="340" rx="10"/></g><path d="M300 420C360 350 400 470 460 400S560 350 610 440S690 380 720 350" stroke="${DK}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  },
  phone(f, g) {
    const R = rnd(3);
    let b = "";
    for (let i = 0; i < 22; i++) { const h = 30 + R() * 220; b += `<rect x="${392 + i * 10}" y="${470 - h / 2}" width="6" height="${h}" rx="3"/>`; }
    return `<rect x="350" y="120" width="300" height="760" rx="48" fill="${f}"/><rect x="368" y="150" width="264" height="700" rx="30" fill="${g}"/><g fill="${f}">${b}</g><circle cx="500" cy="740" r="36" fill="none" stroke="${f}" stroke-width="6"/><circle cx="500" cy="740" r="24" fill="#FF4A1C"/><rect x="60" y="0" width="160" height="1000" fill="${H(f)}"/>`;
  },
  sneaker(f, g) {
    const laces = [0, 1, 2, 3, 4].map((i) => `<line x1="${470 + i * 26}" y1="${470 - i * 14}" x2="${500 + i * 26}" y2="${500 - i * 14}" stroke="${g}" stroke-width="6" stroke-linecap="round"/>`).join("");
    return `<g transform="translate(0 -50)"><ellipse cx="500" cy="720" rx="380" ry="26" fill="${H(f)}"/><path d="M150 650C150 690 170 705 210 705H830C860 705 870 690 865 650Z" fill="${f}"/><rect x="160" y="632" width="700" height="26" rx="13" fill="${g}" stroke="${f}" stroke-width="6"/><path d="M175 632C185 520 290 470 410 462L560 395C625 372 705 395 762 465C805 520 842 580 852 632Z" fill="${f}"/><path d="M300 600C380 560 520 540 700 520C740 560 770 600 780 628H300Z" fill="${Hx(f, 1)}"/><path d="M640 418C700 410 750 440 790 500" stroke="${g}" stroke-width="5" fill="none"/>${laces}<rect x="160" y="500" width="40" height="120" rx="12" fill="${Hx(f)}"/></g>`;
  },
  frame(f, g) {
    const corners = [[230, 290], [770, 290], [230, 710], [770, 710]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="28" fill="${f}"/>`).join("");
    return `<path d="M500 200L330 290M500 200L670 290" stroke="${f}" stroke-width="4" fill="none"/><circle cx="500" cy="200" r="10" fill="${f}"/><rect x="230" y="290" width="540" height="420" fill="none" stroke="${f}" stroke-width="42"/><rect x="272" y="332" width="456" height="336" fill="none" stroke="${f}" stroke-width="5"/><rect x="290" y="350" width="420" height="300" fill="${H(f)}" opacity=".55"/>${corners}<rect x="810" y="620" width="100" height="60" fill="${f}"/><rect x="824" y="636" width="64" height="6" fill="${g}"/><rect x="824" y="652" width="44" height="6" fill="${g}"/><rect y="860" width="1000" height="140" fill="${H(f, 1)}"/>`;
  },
  film(f, g) {
    let holes = "", frames = "";
    for (let x = -120; x < 1140; x += 60) holes += `<rect x="${x}" y="402" width="30" height="22" rx="4"/><rect x="${x}" y="576" width="30" height="22" rx="4"/>`;
    for (let i = 0; i < 5; i++) frames += `<rect x="${-80 + i * 240}" y="440" width="210" height="120" fill="${i === 2 ? BL : H(g, i % 2)}"/>`;
    return `<circle cx="760" cy="260" r="170" fill="${H(f)}"/><g transform="rotate(-12 500 500)"><rect x="-200" y="385" width="1400" height="230" fill="${f}"/><g fill="${g}">${holes}</g>${frames}</g>`;
  },
  lens(f, g) {
    let hx = "";
    for (let k = 0; k < 6; k++) { const a = (k * 60 + 15) * Math.PI / 180; hx += `${(500 + 120 * Math.cos(a)).toFixed(1)},${(500 + 120 * Math.sin(a)).toFixed(1)} `; }
    return `<circle cx="500" cy="500" r="400" fill="${f}"/><circle cx="500" cy="500" r="330" fill="${g}"/><circle cx="500" cy="500" r="300" fill="${H(f, 1)}"/><circle cx="500" cy="500" r="230" fill="${f}"/><polygon points="${hx.trim()}" fill="${BL}"/><circle cx="455" cy="455" r="26" fill="${g}" opacity=".85"/>`;
  }
};
export const PLATES = Object.keys(SUB);

export function plate(kind, tone) {
  const k = SUB[kind] ? kind : "vinyl";
  const [g, f] = TONES[tone] || TONES.ink;
  return `<svg class="art" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="1000" height="1000" fill="${g}"/>${SUB[k](f, g)}</svg><svg class="gr" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><rect width="1000" height="1000" filter="url(#grain)"/></svg>`;
}

export const PLATE_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .4 0"/></filter>
<pattern id="htd" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx="6" cy="6" r="4.1" fill="#0E0D0B"/></pattern>
<pattern id="htd2" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx="6" cy="6" r="2" fill="#0E0D0B"/></pattern>
<pattern id="htl" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx="6" cy="6" r="4.1" fill="#F2EDE3"/></pattern>
<pattern id="htl2" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx="6" cy="6" r="2" fill="#F2EDE3"/></pattern>
<pattern id="brk" width="120" height="60" patternUnits="userSpaceOnUse"><path d="M0 1H120M0 31H120M1 0V30M61 30V60" stroke="#0E0D0B" stroke-opacity=".22" stroke-width="3" fill="none"/></pattern>
</defs></svg>`;
