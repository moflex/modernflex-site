{
  // Fit the MODERNFLEX wordmarks to the full width of their row.
  const fit = () => {
    for (const el of document.querySelectorAll(".fit")) {
      el.style.fontSize = "100px";
      const w = el.parentElement.clientWidth, sw = el.scrollWidth;
      if (sw) el.style.fontSize = Math.floor(9950 * w / sw) / 100 + "px";
    }
  };
  fit();
  window.addEventListener("resize", fit);
  if (document.fonts) document.fonts.ready.then(fit);

  // Homepage: show the small wordmark in the bar once the masthead scrolls away.
  const mast = document.querySelector(".wm");
  if (mast && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(([en]) => document.body.classList.toggle("past", !en.isIntersecting), { rootMargin: "-60px 0px 0px 0px" });
    io.observe(mast);
  } else document.body.classList.add("past");

  const toastEl = document.getElementById("toast");
  const toast = (t) => { toastEl.textContent = t; toastEl.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { toastEl.hidden = true; }, 3200); };

  // MFTV: play a YouTube episode in place, or switch the featured episode.
  const epsData = document.getElementById("eps");
  const EPS = epsData ? JSON.parse(epsData.textContent) : [];
  document.addEventListener("click", (ev) => {
    const play = ev.target.closest("[data-play]");
    if (play) {
      const fr = play.closest(".frame");
      const id = fr.dataset.yt;
      if (!id) { toast("This episode is coming soon."); return; }
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
      f.title = fr.dataset.title || "MFTV episode";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      fr.replaceChildren(f);
      return;
    }
    const tile = ev.target.closest("[data-ep]");
    if (tile && EPS.length) {
      const i = +tile.dataset.ep, holder = document.getElementById("player");
      if (!holder || !EPS[i]) return;
      holder.innerHTML = EPS[i];
      for (const t of document.querySelectorAll("[data-ep]")) t.setAttribute("aria-pressed", String(t === tile));
      holder.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  });

  // Simple checks before a form is sent.
  document.addEventListener("submit", (ev) => {
    const f = ev.target, msg = f.querySelector(".msg");
    const email = f.querySelector('input[type="email"]');
    const say = (t) => { ev.preventDefault(); if (msg) msg.textContent = t; };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return say("Add a valid email address.");
    for (const r of f.querySelectorAll("[data-req]")) if (!r.value.trim()) return say(r.dataset.req);
  });
}
