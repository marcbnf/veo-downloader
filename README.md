# 📹 Veo Downloader

**Veo Downloader** est un outil web simple et léger pour extraire et télécharger les fichiers vidéo MP4 directement depuis les liens de partage Veo (app.veo.co).

## ✨ Fonctionnalités

- 🔗 **Extraction de lien** : Récupère l'URL directe du fichier `.mp4` hébergé sur les serveurs Veo.
- 📺 **Prévisualisation** : Lecteur vidéo HTML5 intégré pour vérifier le contenu avant téléchargement.
- 🌗 **Interface adaptative** : Support du mode sombre (Dark Mode) et clair, avec détection automatique des préférences système.
- ⬇️ **Téléchargement** : Bouton dédié pour ouvrir ou télécharger la vidéo source.

## 🚀 Comment l'utiliser

L'application est accessible directement en ligne :

1. **Ouvrez le lien** : https://marcbnf.github.io/veo-downloader/
2. **Collez un lien** de match Veo (ex: `https://app.veo.co/matches/...`) dans le champ de texte.
3. Cliquez sur **Obtenir le MP4**.
4. Une fois la vidéo chargée, utilisez le lecteur ou le bouton **Ouvrir le lien** pour récupérer le fichier (Clic droit > Enregistrer la vidéo sous...).

## 🛠 Fonctionnement technique

L'application est construite en **HTML**, **CSS** et **Vanilla JavaScript**.

1. **Frontend** : Interface utilisateur responsive utilisant les variables CSS pour le theming.
2. **Logique** : Le script (`app.js`) intercepte l'entrée utilisateur.
3. **Proxy CORS** : Utilise un **Proxy Cloudflare Worker** pour effectuer la requête vers la page Veo (contournement des restrictions CORS).
4. **Parsing** : Une expression régulière (Regex) analyse le code HTML récupéré pour trouver l'URL du CDN (`veocdn.com`) correspondant à la vidéo.

## ⚠️ Avertissement

Cet outil est conçu pour un usage personnel (ex: télécharger vos propres matchs). Assurez-vous de disposer des droits nécessaires sur les vidéos que vous téléchargez.