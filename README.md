# Projet Clean Wash & Co

**Projet Client**

Ce dépôt regroupe les différentes applications web et sites développés pour l'entreprise **Clean Wash & Co**. Il est composé d'une application interactive de fidélisation (jeu de roulette) pour récolter des avis Google, ainsi que du site vitrine statique présentant les différents services de l'entreprise.

## 🛠️ Stack Technique

### Application Roulette (`roulette_app`)
- **Framework** : Next.js (React)
- **Styling** : Tailwind CSS, Framer Motion
- **Backend / Base de données** : Supabase
- **Fonctionnalités** : QR Codes interactifs, animations, base de données en temps réel

### Site Vitrine (`site_clean_wash_and_co`)
- **Technologies** : HTML5, CSS3, JavaScript (Vanilla)
- **Fonctionnalités** : Design responsive, animations au scroll (AOS), slider avant/après

---

## 📋 Prérequis

Avant de lancer le projet, assurez-vous de disposer des éléments suivants :
- **Node.js** (v18 ou supérieure recommandée)
- **npm** (inclus avec Node.js)
- Un compte / projet **Supabase** configuré avec les bonnes variables d'environnement (pour l'application roulette).

---

## 🚀 Installation et Lancement Local

Vous pouvez lancer les projets de manière indépendante :

### Lancement de l'application Roulette (Next.js) :
```bash
# 1. Naviguez dans le dossier de l'application
cd roulette_app

# 2. Installez les dépendances
npm install

# 3. Lancez le serveur de développement
npm run dev
```
L'application sera accessible sur : [http://localhost:3000](http://localhost:3000)

### Lancement du site vitrine (HTML/CSS/JS) :
```bash
# 1. Naviguez dans le dossier du site
cd site_clean_wash_and_co

# 2. Ouvrez simplement le fichier `index.html` dans votre navigateur web, ou utilisez un outil comme `serve` :
npx serve .
```

---

## 📂 Arborescence du Projet

```text
.
├── roulette_app/           # Application interactive Next.js (Jeu de roulette promo/avis Google)
│   ├── src/                # Code source de l'application (pages, composants, API)
│   ├── public/             # Assets statiques (images, etc.)
│   └── package.json        # Dépendances du projet Next.js
├── site_clean_wash_and_co/ # Site vitrine statique HTML/CSS/JS (Clean Wash & Co)
│   ├── index.html          # Page d'accueil du site vitrine
│   ├── script.js           # Logique JavaScript front-end
│   └── styles.css          # Styles CSS du site
└── README.md               # Documentation principale du projet
```