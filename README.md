# Application SaaS - Roulette & Avis Google

**Projet Client**

Ce dépôt contient le code source de l'application SaaS interactive de fidélisation (jeu de roulette) conçue pour récolter des avis Google et offrir des promotions.

## 🛠️ Stack Technique

- **Framework** : Next.js (React)
- **Styling** : Tailwind CSS, Framer Motion
- **Backend / Base de données** : Supabase
- **Fonctionnalités** : QR Codes interactifs, animations de roulette, base de données en temps réel, dashboard admin

---

## 📋 Prérequis

Avant de lancer le projet, assurez-vous de disposer des éléments suivants :
- **Node.js** (v18 ou supérieure recommandée)
- **npm** (inclus avec Node.js)
- Un compte / projet **Supabase** configuré avec les bonnes variables d'environnement (`.env.local`).

---

## 🚀 Installation et Lancement Local

### Lancement de l'application (Next.js) :
```bash
# 1. Naviguez dans le dossier de l'application
cd roulette_app

# 2. Installez les dépendances
npm install

# 3. Lancez le serveur de développement
npm run dev
```
L'application sera accessible sur : [http://localhost:3000](http://localhost:3000)

---

## 📂 Arborescence du Projet

```text
.
├── roulette_app/           # Application interactive Next.js (Jeu de roulette promo/avis Google)
│   ├── src/                # Code source de l'application (pages, composants, API)
│   ├── public/             # Assets statiques (images, etc.)
│   └── package.json        # Dépendances du projet Next.js
└── README.md               # Documentation principale du projet
```