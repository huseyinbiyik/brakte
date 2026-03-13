import { Controller } from "@hotwired/stimulus";

// Shared palettes for repeated stops
const NIGHT = {
  bg: [42, 34, 28],
  bounce: [85, 60, 30],
  shadow: [15, 10, 6],
  shadowOpacity: 0.05,
  glowOpacity: 0.35,
  text: [210, 195, 178],
};
const DAY = {
  bg: [255, 253, 250],
  bounce: [245, 215, 166],
  shadow: [26, 25, 23],
  shadowOpacity: 0.07,
  glowOpacity: 0.5,
  text: [26, 25, 23],
};

// Time stops tuned for Turkey (Istanbul ~41°N)
// Avg sunrise ~06:30, sunset ~19:00, dawn ~05:30, dusk ~20:00
const STOPS = [
  { hour: 0, ...NIGHT },
  { hour: 5, ...NIGHT },
  {
    hour: 5.75,
    bg: [35, 28, 45],
    bounce: [50, 38, 60],
    shadow: [12, 10, 18],
    shadowOpacity: 0.04,
    glowOpacity: 0.18,
    text: [185, 178, 198],
  },
  {
    hour: 6.25,
    bg: [95, 105, 120],
    bounce: [120, 130, 145],
    shadow: [30, 35, 42],
    shadowOpacity: 0.045,
    glowOpacity: 0.24,
    text: [210, 205, 215],
  },
  {
    hour: 6.75,
    bg: [159, 179, 191],
    bounce: [185, 200, 210],
    shadow: [50, 60, 70],
    shadowOpacity: 0.05,
    glowOpacity: 0.3,
    text: [35, 40, 48],
  },
  { hour: 8.5, ...DAY },
  { hour: 17, ...DAY },
  {
    hour: 18.5,
    bg: [252, 204, 131],
    bounce: [245, 181, 90],
    shadow: [50, 35, 15],
    shadowOpacity: 0.06,
    glowOpacity: 0.45,
    text: [50, 35, 12],
  },
  {
    hour: 19.25,
    bg: [235, 155, 75],
    bounce: [220, 135, 55],
    shadow: [45, 28, 10],
    shadowOpacity: 0.055,
    glowOpacity: 0.35,
    text: [45, 28, 8],
  },
  {
    hour: 19.75,
    bg: [200, 100, 35],
    bounce: [180, 80, 22],
    shadow: [35, 20, 6],
    shadowOpacity: 0.045,
    glowOpacity: 0.25,
    text: [255, 240, 220],
  },
  { hour: 20.5, ...NIGHT },
  { hour: 24, ...NIGHT },
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpRgb(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function rgb(arr, alpha = 1) {
  return `rgb(${arr[0]} ${arr[1]} ${arr[2]} / ${alpha})`;
}

function interpolate(hour) {
  let i = 0;
  while (i < STOPS.length - 1 && STOPS[i + 1].hour <= hour) i++;
  if (i >= STOPS.length - 1) return STOPS[STOPS.length - 1];

  const a = STOPS[i];
  const b = STOPS[i + 1];
  const t = (hour - a.hour) / (b.hour - a.hour);

  return {
    bg: lerpRgb(a.bg, b.bg, t),
    bounce: lerpRgb(a.bounce, b.bounce, t),
    shadow: lerpRgb(a.shadow, b.shadow, t),
    shadowOpacity: lerp(a.shadowOpacity, b.shadowOpacity, t),
    glowOpacity: lerp(a.glowOpacity, b.glowOpacity, t),
    text: lerpRgb(a.text, b.text, t),
  };
}

export default class extends Controller {
  connect() {
    this.overrideHour = new URLSearchParams(window.location.search).get("hour");
    this.perspective = document.querySelector(".perspective");
    this.glow = document.getElementById("glow");
    this.glowBounce = document.getElementById("glow-bounce");
    this.leavesSvg = document.querySelector("#leaves svg");

    this.onVisibility = () => {
      if (document.hidden) {
        this.leavesSvg?.pauseAnimations?.();
        clearInterval(this.interval);
      } else {
        this.leavesSvg?.unpauseAnimations?.();
        this.update();
        this.interval = setInterval(() => this.update(), 60_000);
      }
    };
    document.addEventListener("visibilitychange", this.onVisibility);

    this.update();
    this.interval = setInterval(() => this.update(), 60_000);
  }

  disconnect() {
    clearInterval(this.interval);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  update() {
    const now = new Date();
    const hour =
      this.overrideHour !== null
        ? parseFloat(this.overrideHour)
        : now.getHours() + now.getMinutes() / 60;
    const v = interpolate(hour);

    const root = document.body.style;
    root.setProperty("--light", rgb(v.bg));
    root.setProperty("--bounce-light", rgb(v.bounce));
    root.setProperty("--shadow", rgb(v.shadow));
    root.setProperty("--text-primary", rgb(v.text));
    root.setProperty("--text-muted", rgb(v.text, 0.7));
    root.setProperty("--text-subtle", rgb(v.text, 0.6));

    this.perspective.style.opacity = v.shadowOpacity;
    this.glow.style.opacity = v.glowOpacity;
    this.glowBounce.style.opacity = v.glowOpacity;
  }
}
