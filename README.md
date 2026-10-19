# Ders Notlarım

Site statique (HTML/CSS/JS, sans framework) qui regroupe mes notes de cours par livre.
Hébergé sur Vercel, déployé automatiquement à chaque `git push`.

## Structure

```
ders-notlarim/
├── index.html          ← accueil : étagère des livres
├── kitap.html          ← page d'un livre (liste des chapitres)     → /kitap/<slug>
├── oku.html            ← lecteur d'un chapitre (affiche le HTML)    → /kitap/<slug>/<id>
├── hakkinda.html       ← page Hakkında                              → /hakkinda
├── 404.html
├── data/
│   └── kitaplar.json   ← LA table des matières du site (le seul fichier à modifier)
├── notlar/
│   ├── kitabut-tevhid/ ← les HTML des notes, un dossier par livre
│   ├── nevakidul-islam/
│   └── …
├── assets/             ← style.css, app.js, favicon.svg
├── vercel.json         ← URL propres (/kitap/...)
└── serve.json          ← même chose pour l'aperçu local
```

## Ajouter un chapitre

1. Copier le fichier HTML dans `notlar/<slug-du-livre>/` (ex. `notlar/nevakidul-islam/onsoz.html`).
2. Ajouter une entrée dans `bolumler` du livre, dans `data/kitaplar.json`, à la position voulue :

```json
{ "id": "onsoz", "etiket": "Önsöz", "baslik": "Önsöz", "dosya": "onsoz.html" }
```

Champs d'un chapitre :

| Champ     | Rôle |
|-----------|------|
| `id`      | identifiant dans l'URL : `/kitap/nevakidul-islam/onsoz` (unique dans le livre) |
| `no`      | numéro affiché dans la pastille (ex. `32`) |
| `etiket`  | texte affiché à la place du numéro (ex. `"Önsöz"`, `"Sonuç"`) |
| `baslik`  | titre turc |
| `ar`      | titre arabe (facultatif) |
| `alt`     | petite ligne sous le titre (facultatif) |
| `dosya`   | nom du fichier dans `notlar/<slug>/`. **Sans `dosya`, le chapitre s'affiche « Yakında »** |

L'ordre des entrées = l'ordre d'affichage et l'ordre des boutons Önceki / Sonraki.

3. `git add . && git commit -m "Önsöz eklendi" && git push` → en ligne en moins d'une minute.

## Ajouter un livre

Ajouter un objet dans `kitaplar` :

```json
{
  "slug": "yeni-kitap",
  "baslik": "Titre turc (aussi écrit sur la couverture)",
  "ar": "العنوان بالعربية",
  "yazar": "Auteur",
  "alt": "Petite ligne sous la couverture",
  "renk": "#1E3A5F",
  "kayitlar": "https://lien-des-enregistrements (facultatif, utilisé dans Hakkında)",
  "aciklama": "Courte description (facultatif, affichée sur la page du livre)",
  "bolumler": []
}
```

puis créer le dossier `notlar/yeni-kitap/`.

## Aperçu en local

Il faut un petit serveur (les URL `/kitap/...` ne marchent pas en double-cliquant sur le fichier) :

```
npx serve .
```

puis ouvrir http://localhost:3000

## Mise en ligne (une seule fois)

1. Créer le dépôt vide `ders-notlarim` sur github.com/new
2. Dans ce dossier :
   ```
   git init
   git add .
   git commit -m "İlk sürüm"
   git branch -M main
   git remote add origin https://github.com/BayramKILIC/ders-notlarim.git
   git push -u origin main
   ```
3. Sur vercel.com : Add New → Project → importer `ders-notlarim` → Deploy (aucun réglage à changer).
