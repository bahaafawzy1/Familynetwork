### Integrations (Sandbox)

- Twilio (SMS/WhatsApp)
  - Set `TWILIO_*` in backend `.env`. For dev without Twilio, backend logs OTP to console.
- Azure Face API (Verification)
  - Create Cognitive Services Face resource; set `AZURE_FACE_ENDPOINT`, `AZURE_FACE_KEY` in backend `.env`. Use backend service `services/face.ts` (to be added) for ID + selfie compare.
- Payments: Paymob & Fawry
  - Use sandbox credentials. Implement `payments` module (to be added) with Paymob accept API and Fawry pay-at-store integration.
- Firebase (Realtime/Firestore)
  - Create Firebase project; add web config to frontend; use Firestore for chat and presence.
- Analytics
  - GA4: add measurement ID to Flutter and Admin. Mixpanel: add token via env and initialize on app start.