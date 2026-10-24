# Play Store — Zeevan

Files in this folder. Do not put the signing key or its passwords in WhatsApp or chat.

## Must upload

| Item | Value / file |
| --- | --- |
| AAB | EAS production build (see below). Play will not take an APK. |
| Package name | `com.novarosolution.kankreg` |
| App name | Zeevan |
| Icon 512×512 | `icon-512.png` |
| Feature graphic 1024×500 | `feature-graphic-1024x500.png` (Play) |
| Feature graphic 4K | `feature-graphic-4k.png` (4096×2000 master) |
| Phone screenshots | `screenshots/` (1080×1920) and `screenshots-4k/` (2160×3840) |
| Privacy policy | https://www.zeevan.shop/privacy |

## Copy

**Short description** (80 characters):

```
Farm ghee, tel, masala & honey — live delivery from our Gujarat kitchen.
```

**Full description:**

```
Zeevan is a farm shop for A2 bilona ghee, wood-pressed tel, small-batch masala, and Haldar honey.

Shop the catalogue, save an address, and get delivery in your zone with a live time. Outside our area the app says delivery is not possible.

Track orders from our Gujarat kitchen to your door. Pay online with Razorpay or cash on delivery where shown. Earn rewards on orders.

Questions: support@zeevan.app
```

## Console answers

| Question | Answer |
| --- | --- |
| Support email | support@zeevan.app |
| Login | Yes — email + password |
| Test account | Make a normal customer (not admin). Put that email/password only in Play Console. |
| Ads | No |
| Play in-app purchase | No (physical food; Razorpay / COD, not Google Play Billing) |
| 18+ | No |
| Category | Food & Drink |
| Website | https://www.zeevan.shop |

## Signing key

The Android keystore is on Expo (EAS), credential `T0Px1JNw17`.  
Do not export the `.jks` or passwords into chat. Download a backup from Expo only onto your own disk.

## AAB

From `mobile/`:

```
npx eas-cli build --platform android --profile production
```

Then download the `.aab` from the Expo build page and upload it to Play Console → Production / Testing.
