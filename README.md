# Aarohan Healthcare (Expo React Native)

Role-based healthcare app scaffold designed for Expo Go.

## Implemented

- Onboarding with centered logo, healthcare illustration, tagline, language selector, and primary CTA
- Login/Register with large inputs, role selection, and validation errors
- Patient flow: Home, Symptom Collection (step progress), AI Result (risk badge + emergency banner), Health Records
- Doctor dashboard with filter tabs: All | Mild | Moderate | Emergency
- CHW dashboard with touch-friendly tiles and offline banner
- Admin dashboard with KPI cards, simple trend graph, and simple heat map
- Reusable UI components: `PrimaryButton`, `Card`, `RiskBadge`, `InputField`, `VitalsCard`, `EmergencyBanner`, `LanguageSwitcher`
- Security baseline: HTTPS-only API guard, `expo-secure-store` token storage, role-based routing

## Project Structure

`src/`

- `components/ui/`
- `screens/Auth/`
- `screens/Patient/`
- `screens/Doctor/`
- `screens/CHW/`
- `screens/Admin/`
- `services/`
- `context/`
- `navigation/`
- `i18n/`
- `models/`
- `utils/`

## Run

```powershell
npm install
npm run typecheck
npm run start
```

Then scan the QR code from Expo Go.
