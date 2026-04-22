# Kankreg (Expo React Native)

A beginner-friendly e-commerce starter app built with Expo and React Native.

## Features

- Clean folder structure (`screens`, `components`, `navigation`, `services`, `context`, `data`)
- Native stack navigation with React Navigation
- Screens:
  - `LoginScreen`
  - `HomeScreen` (product list via `FlatList`)
  - `ProductScreen`
  - `CartScreen`
- Reusable `ProductCard` component
- Cart management with Context API (add/remove/clear)
- Modern minimal UI styling
- Web-friendly layout constraints for future React Native Web support

## Project Structure

```txt
.
├── App.js
├── app.json
├── index.js
├── src
│   ├── components
│   │   └── ProductCard.js
│   ├── context
│   │   └── CartContext.js
│   ├── data
│   │   └── products.js
│   ├── navigation
│   │   └── AppNavigator.js
│   ├── screens
│   │   ├── CartScreen.js
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   └── ProductScreen.js
│   └── services
│       └── productService.js
└── package.json
```

## Run

```bash
npm install
npm run start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web

### API URL (fix “Route not found” / 404)

1. **Start the backend** from `backend/` (default port **5001**): `npm run dev`
2. **Optional:** create `.env` in the app root with:
   - `EXPO_PUBLIC_API_URL=http://127.0.0.1:5001` (local)
   - Or, if your API is under a path: `EXPO_PUBLIC_API_URL=https://yourdomain.com/api`
3. **Production builds** default to `https://novarosolution.com/api`. If your API is at the **domain root** (e.g. `https://novarosolution.com/products`), set:
   - `EXPO_PUBLIC_API_URL=https://novarosolution.com`
4. Restart Expo after changing `.env`.

The server exposes routes at both `/products` and `/api/products` (same for users, orders, admin, etc.).
# kankreg
