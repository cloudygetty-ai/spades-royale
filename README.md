# ♠ Spades Royale

A premium real-money skill-based Spades card game built with React + Vite.

## 🚀 Live Demo
[https://spades-royale.vercel.app](https://spades-royale.vercel.app)

## ✨ Features
- **Lobby** — Tournament listings ($1–$50 buy-ins, up to $10K prize pools), cash game tables, live fill progress
- **Bidding** — NIL, Blind NIL (+$5 bonus), bids 1–13 with strategy tips and countdown timer
- **Game Table** — 4-player felt table, card animations, trick tracking, thinking indicators
- **Results** — Confetti, animated earnings counter, full breakdown (bonuses, fees, net)

## 🛠 Tech Stack
- React 18 + Vite
- Pure CSS animations (no dependencies)
- Vercel deployment

## 📦 Setup
\`\`\`bash
npm install
npm run dev       # Development
npm run build     # Production build
vercel deploy --prod  # Deploy
\`\`\`

## 🗂 Structure
\`\`\`
src/
  App.jsx        # Complete game (LobbyScreen, BiddingScreen, GameScreen, ResultsScreen)
  main.jsx       # React root
index.html
vercel.json
\`\`\`
