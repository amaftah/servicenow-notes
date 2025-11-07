# 🧰 ServiceNow Incident Notes Generator

A lightweight **React + TypeScript** web app that automates the generation of French ServiceNow notes (`Titre`, `Note de travail`, and `Commentaire utilisateur`) from a single English description.

Deployed via **GitHub Pages**.  
Built for agents who want perfectly formatted ServiceNow incident notes—automatically translated and ready to paste.

---

## 🚀 Features

- 🧠 **Single-field input**: Describe the incident in English; the app parses context and builds structured outputs.
- 🇫🇷 **French output**:
  - **Title (short_description)**
  - **Work Notes (Note de travail – interne)**
  - **User-visible Comment (Commentaire visible par l’utilisateur)**
- 🔄 **Two translation modes**:
  - **Offline fallback** (simple glossary)
  - **LibreTranslate API** (real translation, optional endpoint)
- 📄 **Export to JSON** (ready to paste into ServiceNow)
- 🎨 **Modern UI** styled to resemble ServiceNow:
  - Emerald accents
  - Card layout
  - Responsive grid design

---

## 🧩 Tech Stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- Inline CSS (no dependency on Tailwind)
- GitHub Actions for deployment

---

## 🛠️ Getting Started

### 1. Create your environment (Codespace or local)
```bash
npm create vite@latest servicenow-notes -- --template react-ts
cd servicenow-notes
npm install
