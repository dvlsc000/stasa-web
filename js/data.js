/* Loads all works, rooms, exhibitions and settings from Supabase in one request and puts them
   in place of the built-in content (js/content.js), which stays as the fallback if Supabase is
   unreachable. The site starts as soon as this is done (at most ~3 s). */
(() => {
  const C = window.SUPABASE;
  const LS = "sc-content-v1";
  const L = (window.SITE && SITE.languages) || ["hr", "en", "nl", "es", "de", "fr"];

  function apply(d) {
    if (!d || !Array.isArray(d.works) || !d.works.length) return false;
    const s = d.settings || {};
    if (s.contact_email) SITE.contactEmail = s.contact_email;
    if (s.instagram) SITE.instagram = s.instagram;
    if (Array.isArray(s.hero_works) && s.hero_works.length) SITE.heroWorks = s.hero_works;
    if (Array.isArray(d.rooms) && d.rooms.length) window.ROOMS = d.rooms.map(r => ({ id: r.id, wall: r.wall }));
    window.WORKS = d.works.map(w => ({
      id: w.id, wing: w.wing, room: w.room || undefined,
      title: w.title || "", story: w.story || null,
      year: w.year === "" || w.year == null ? null : w.year,
      image: w.image || null, gallery: w.gallery && w.gallery.length ? w.gallery : undefined,
      draw: w.draw || (w.wing === "wearable" ? "hat" : "frame"),
      materials: w.materials || [], technique: w.technique || "",
      dimensions: w.dimensions || null, available: w.available !== false,
      price: w.price == null ? null : Number(w.price),
      frame: w.frame || undefined, span: w.span || undefined
    }));
    if (Array.isArray(d.exhibitions)) window.EXHIBITIONS = d.exhibitions.map(x => ({
      year: x.year || "", title: x.title || "", venue: x.venue || "", city: x.city || "", image: x.image || null, kind: x.kind || "show"
    }));
    return true;
  }

  const ctrl = window.AbortController ? new AbortController() : null;
  const timer = setTimeout(() => ctrl && ctrl.abort(), 3000);
  window.__siteData = (C && C.url ? fetch(C.url + "/rest/v1/rpc/site_content", {
    method: "POST",
    headers: { apikey: C.key, "Content-Type": "application/json" },
    body: "{}", signal: ctrl ? ctrl.signal : undefined, cache: "no-store"
  }).then(r => r.ok ? r.json() : Promise.reject(r.status)) : Promise.reject("no config"))
    .then(d => { if (apply(d)) { try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) {} } })
    .catch(() => {                                   // offline / blocked: last good copy, else content.js
      try { const c = JSON.parse(localStorage.getItem(LS) || "null"); if (c) apply(c); } catch (e) {}
    })
    .finally(() => clearTimeout(timer));
})();
