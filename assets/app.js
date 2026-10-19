/* =========================================================
   Ders Notlarım - logique commune
   Tout le contenu vient de /data/kitaplar.json
   ========================================================= */
(function () {
  'use strict';

  const VERI_YOLU = '/data/kitaplar.json';
  const SITE_ADI = 'Ders Notlarım';

  /* ---------- Outils ---------- */

  // Crée un élément : el('div', { class: 'x', href: '…' }, enfant1, 'texte', …)
  function el(etiket, ozellikler, ...cocuklar) {
    const d = document.createElement(etiket);
    if (ozellikler) {
      for (const [k, v] of Object.entries(ozellikler)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') d.className = v;
        else if (k === 'style') d.setAttribute('style', v);
        else d.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of cocuklar.flat()) {
      if (c === null || c === undefined || c === false) continue;
      d.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return d;
  }

  // Icône SVG (chevron gauche/droite, nouvel onglet)
  function ikon(tur) {
    const yollar = {
      sol: '<path d="M15 18l-6-6 6-6"/>',
      sag: '<path d="M9 6l6 6-6 6"/>',
      dis: '<path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M20 14v6H4V4h6"/>'
    };
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', '18');
    s.setAttribute('height', '18');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = yollar[tur];
    return s;
  }

  // Normalise un texte pour la recherche (minuscules, sans accents)
  function sade(t) {
    return (t || '')
      .toLocaleLowerCase('tr')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[ıİ]/g, 'i');
  }

  // Lit /kitap/<slug>/<bolum> ou ?k=<slug>&b=<bolum>
  function rota() {
    const parcalar = location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (parcalar[0] === 'kitap' && parcalar[1]) {
      return { kitap: parcalar[1], bolum: parcalar[2] || null };
    }
    const q = new URLSearchParams(location.search);
    return { kitap: q.get('k'), bolum: q.get('b') };
  }

  const kitapUrl = (k) => '/kitap/' + encodeURIComponent(k.slug);
  const bolumUrl = (k, b) => kitapUrl(k) + '/' + encodeURIComponent(b.id);
  const dosyaUrl = (k, b) => '/notlar/' + encodeURIComponent(k.slug) + '/' + encodeURIComponent(b.dosya);
  const bolumEtiketi = (b) => (b.etiket ? b.etiket : (b.no !== undefined ? String(b.no) : ''));
  // Une étiquette « numérique » (40, 41–42) est suivie du titre ; une étiquette texte (Önsöz) se suffit
  const sayisal = (t) => /^[\d\s.–-]+$/.test(t);
  const bolumAdi = (k, b) => {
    const e = bolumEtiketi(b);
    if (!e) return b.baslik;
    return sayisal(e) ? e + '. ' + b.baslik : e;
  };
  // Nom court pour le fil d'Ariane : champ « kisa », sinon « 32. Bölüm » ou l'étiquette texte
  const kisaAd = (b) => {
    if (b.kisa) return b.kisa;
    const e = bolumEtiketi(b);
    return sayisal(e) ? e + '. Bölüm' : (e || b.baslik);
  };

  // Taille du texte arabe sur la couverture selon sa longueur
  function arBoyut(t) {
    const n = (t || '').length;
    if (n <= 14) return 'b1';
    if (n <= 20) return 'b2';
    if (n <= 28) return 'b3';
    return 'b4';
  }

  async function veriYukle() {
    const r = await fetch(VERI_YOLU, { cache: 'no-cache' });
    if (!r.ok) throw new Error('kitaplar.json okunamadı');
    const v = await r.json();
    return v.kitaplar || [];
  }

  function hataGoster(hedef, mesaj) {
    hedef.replaceChildren(
      el('div', { class: 'hata' },
        el('p', null, mesaj),
        el('p', null, el('a', { href: '/' }, 'Ana sayfaya dön'))
      )
    );
  }

  function kapak(k, kucuk) {
    return el('div', { class: 'kapak', style: '--renk:' + (k.renk || '#1E3A5F'), 'aria-hidden': kucuk ? 'true' : null },
      kucuk ? null : el('div', { class: 'kapak-baslik' }, k.baslik),
      el('div', { class: 'kapak-ar ' + arBoyut(k.ar), lang: 'ar' }, k.ar),
      kucuk ? null : el('div', { class: 'kapak-yazar' }, k.yazar || '')
    );
  }

  /* ---------- Accueil : étagère ---------- */

  async function rafSayfasi() {
    const hedef = document.getElementById('raf');
    try {
      const kitaplar = await veriYukle();
      hedef.replaceChildren(...kitaplar.map((k) =>
        el('a', { class: 'kitap', href: kitapUrl(k) },
          kapak(k, false),
          el('div', { class: 'kitap-bilgi' },
            el('div', { class: 'kitap-ad' }, k.baslik),
            k.alt ? el('div', { class: 'kitap-alt' }, k.alt) : null
          )
        )
      ));
    } catch (e) {
      hataGoster(hedef, 'Kitaplar yüklenemedi.');
    }
  }

  /* ---------- Page d'un livre ---------- */

  async function kitapSayfasi() {
    const hedef = document.getElementById('icerik');
    let kitaplar;
    try { kitaplar = await veriYukle(); } catch (e) { return hataGoster(hedef, 'Kitaplar yüklenemedi.'); }

    const { kitap: slug } = rota();
    const k = kitaplar.find((x) => x.slug === slug);
    if (!k) return hataGoster(hedef, 'Bu kitap bulunamadı.');

    document.title = k.baslik + ' · ' + SITE_ADI;

    const bolumler = k.bolumler || [];
    const eksikVar = bolumler.some((b) => !b.dosya);

    const ust = el('section', { class: 'kitap-ust' },
      kapak(k, true),
      el('div', { class: 'kitap-ust-metin' },
        el('div', { class: 'ust-etiket' }, 'Şerh notları'),
        el('h1', null, k.baslik),
        el('div', { class: 'yazar' }, k.yazar || ''),
        k.aciklama ? el('p', { class: 'aciklama' }, k.aciklama) : null
      )
    );

    if (!bolumler.length) {
      hedef.replaceChildren(ust, el('div', { class: 'bos' }, 'Bu kitabın notları yakında eklenecek.'));
      return;
    }

    let filtre = 'tumu';
    let sorgu = '';

    const liste = el('ol', { class: 'bolumler' });
    const sonucYok = el('div', { class: 'bos', hidden: true }, 'Aramanıza uygun bölüm bulunamadı.');

    function satir(b) {
      const govde = el('div', { class: 'bolum-govde' },
        el('div', { class: 'bolum-baslik' }, b.baslik),
        b.ar ? el('div', { class: 'bolum-ar', lang: 'ar' }, b.ar) : null,
        b.alt ? el('div', { class: 'bolum-alt' }, b.alt) : null
      );
      const no = el('div', { class: 'bolum-no' }, bolumEtiketi(b));
      if (b.dosya) {
        return el('li', null,
          el('a', { class: 'bolum hazir', href: bolumUrl(k, b) },
            no, govde,
            el('div', { class: 'bolum-durum' }, 'Oku', ikon('sag'))
          )
        );
      }
      return el('li', null,
        el('div', { class: 'bolum' }, no, govde, el('div', { class: 'bolum-durum' }, 'Yakında'))
      );
    }

    function ciz() {
      const s = sade(sorgu);
      const gorunen = bolumler.filter((b) => {
        if (filtre === 'hazir' && !b.dosya) return false;
        if (!s) return true;
        return sade([b.baslik, b.ar, b.alt, b.etiket, b.no, b.kisa].join(' ')).includes(s);
      });
      liste.replaceChildren(...gorunen.map(satir));
      sonucYok.hidden = gorunen.length > 0;
    }

    const aramaKutusu = el('input', { id: 'bolum-ara', type: 'search', placeholder: 'Bâb veya kelime…', autocomplete: 'off' });
    aramaKutusu.addEventListener('input', () => { sorgu = aramaKutusu.value; ciz(); });

    let filtreler = null;
    if (eksikVar) {
      const tumu = el('button', { type: 'button', class: 'cip', 'aria-pressed': 'true' }, 'Tümü');
      const hazir = el('button', { type: 'button', class: 'cip', 'aria-pressed': 'false' }, 'Hazır olanlar');
      tumu.addEventListener('click', () => { filtre = 'tumu'; tumu.setAttribute('aria-pressed', 'true'); hazir.setAttribute('aria-pressed', 'false'); ciz(); });
      hazir.addEventListener('click', () => { filtre = 'hazir'; hazir.setAttribute('aria-pressed', 'true'); tumu.setAttribute('aria-pressed', 'false'); ciz(); });
      filtreler = el('div', { class: 'filtreler', role: 'group', 'aria-label': 'Filtre' }, tumu, hazir);
    }

    const araclar = el('div', { class: 'araclar' },
      filtreler || el('div'),
      el('div', { class: 'arama' },
        el('label', { for: 'bolum-ara' }, 'Bölüm ara'),
        aramaKutusu
      )
    );

    hedef.replaceChildren(ust, el('section', { 'aria-label': 'Bölümler' }, araclar, liste, sonucYok));
    ciz();
  }

  /* ---------- Lecteur d'un chapitre ---------- */

  async function okuyucuSayfasi() {
    const ust = document.getElementById('okuyucu-ust');
    const cerceve = document.getElementById('cerceve');
    let kitaplar;
    try { kitaplar = await veriYukle(); } catch (e) { return hataGoster(document.getElementById('okuyucu-govde'), 'Kitaplar yüklenemedi.'); }

    const r = rota();
    const k = kitaplar.find((x) => x.slug === r.kitap);
    const hazirlar = k ? (k.bolumler || []).filter((b) => b.dosya) : [];
    const i = hazirlar.findIndex((b) => String(b.id) === String(r.bolum));
    if (!k || i < 0) {
      cerceve.remove();
      return hataGoster(document.getElementById('okuyucu-govde'), 'Bu bölüm bulunamadı.');
    }

    const b = hazirlar[i];
    const onceki = hazirlar[i - 1];
    const sonraki = hazirlar[i + 1];

    document.title = bolumAdi(k, b) + ' · ' + k.baslik;

    function gezintiDugmesi(hedefBolum, yon) {
      const etiket = yon === 'sol' ? 'Önceki' : 'Sonraki';
      const icerik = [
        yon === 'sol' ? ikon('sol') : null,
        el('span', { class: 'etiket-uzun' }, etiket),
        yon === 'sag' ? ikon('sag') : null
      ];
      if (!hedefBolum) {
        return el('span', { class: 'dugme', 'aria-disabled': 'true', 'aria-label': etiket + ' bölüm yok' }, icerik);
      }
      return el('a', { class: 'dugme', href: bolumUrl(k, hedefBolum), title: bolumAdi(k, hedefBolum), 'aria-label': etiket + ': ' + bolumAdi(k, hedefBolum) }, icerik);
    }

    ust.replaceChildren(
      el('div', { class: 'kapsayici' },
        el('nav', { class: 'konum', 'aria-label': 'Konum' },
          el('a', { href: '/' }, SITE_ADI),
          el('span', { class: 'ayrac', 'aria-hidden': 'true' }, '/'),
          el('a', { href: kitapUrl(k) }, k.baslik),
          el('span', { class: 'ayrac', 'aria-hidden': 'true' }, '/'),
          el('span', { class: 'simdi' }, kisaAd(b))
        ),
        el('div', { class: 'gezinti' },
          gezintiDugmesi(onceki, 'sol'),
          gezintiDugmesi(sonraki, 'sag'),
          el('a', { class: 'dugme', href: dosyaUrl(k, b), target: '_blank', rel: 'noopener', title: 'Yeni sekmede aç', 'aria-label': 'Yeni sekmede aç' }, ikon('dis'))
        )
      )
    );

    cerceve.title = bolumAdi(k, b);
    cerceve.src = dosyaUrl(k, b);
  }

  /* ---------- Hakkında : liste des cours ---------- */

  async function hakkindaSayfasi() {
    const hedef = document.getElementById('kayitlar');
    if (!hedef) return;
    try {
      const kitaplar = await veriYukle();
      hedef.replaceChildren(...kitaplar.map((k) =>
        el('li', null,
          el('a', { class: 'kayit', href: k.kayitlar || '#', style: '--renk:' + (k.renk || '#1E3A5F'),
                    target: k.kayitlar ? '_blank' : null, rel: k.kayitlar ? 'noopener' : null },
            el('span', { class: 'kayit-renk', 'aria-hidden': 'true' }),
            el('span', { class: 'kayit-govde' },
              el('span', { class: 'kayit-ad' }, k.baslik),
              el('span', { class: 'kayit-yazar' }, k.yazar || '')
            ),
            el('span', { class: 'kayit-eylem' }, 'Dersleri dinle')
          )
        )
      ));
    } catch (e) { /* liste vide si erreur */ }
  }

  /* ---------- Démarrage ---------- */

  const sayfa = document.body.dataset.sayfa;
  if (sayfa === 'raf') rafSayfasi();
  else if (sayfa === 'kitap') kitapSayfasi();
  else if (sayfa === 'oku') okuyucuSayfasi();
  else if (sayfa === 'hakkinda') hakkindaSayfasi();
})();
