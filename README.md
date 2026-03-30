# 🌸 YUME (夢)
**Anime-Inspired Japanese Soft Drink**

Welcome to the official front-end repository for the **Yume** landing page. 
Yume is an immersive, high-impact web experience designed to evoke the specific feeling of a nostalgic 1990s anime sunset while maintaining a modern, bold "Punk-Cozy" aesthetic.

## 🚀 Overview

This project is a bespoke, single-page promotional site built purely with **Vanilla HTML, CSS, and Javascript**. It avoids heavy frameworks in favor of absolute performance and granular control over scroll physics and animations. 

The visual identity relies on sharp pastel colors (Mint, Lavender, Fluo Pink), hard dark shadows instead of typical soft blurred ones, staggered asymmetrical layouts via CSS transforms (`skewY`), and heavy typography (`Mochiy Pop One`).

## ✨ Key Features

- **Punk-Cozy Aesthetic:** An interplay of aggressive layouts (thick outlines, slanted sections) with soft, dreamy pastel color palettes.
- **Micro-Parallax Engine:** Custom JavaScript Intersection Observers handle varying speeds of parallax elements (such as the background and falling cherry blossoms) to create cinematic depth without sacrificing scroll fluidity.
- **Infinite Flavor Carousel:** A precision-engineered ring carousel. Cans are mathematically spaced using absolute positions, allowing infinite seamless looping and focal auto-centering.
- **Reactive Navigation:** The top navbar features a custom `offsetTop` scroll tracker that dynamically inverts colors (Dark vs Light theme) pixel-perfectly based on the section currently traversing the top screen boundary.
- **Neon Glow Dynamics:** Interactive, breathing neon text-shadow animations and non-intrusive animated SVGs/Canvas elements (like a responsive Starry Sky in the Moonlight section).

## 🛠️ Stack

- **HTML5** (Semantic structure)
- **CSS3** (Animations, clamp logic, flex/grid layouts, CSS variables)
- **Vanilla JS (ES6)** (Event loops, observers, carousel logic)

## 📁 Installation & Usage

Since the project uses purely vanilla front-end technologies, no build steps or bundlers are required.

1. Clone the repository.
2. Ensure you have the required graphic assets inside the `/assets` directory.
3. Open `index.html` in any modern web browser.
4. (Optional) Run via a local server (like VS Code Live Server) to prevent any potential CORS issues with local script loading.

---
*"Taste the dream. Sip the sunset."*
