# Lens Ledger Studio Hub

Build FrameFlow, a premium ERP/SaaS for Indian photography studios to manage their entire business in one place.

Pages: Landing, pricing, register, login, forgot password, studio setup, plan selection and welcome checklist.

The post-login workspace includes overview, enquiries, clients, services, packages, quotations, bookings and shoot checklists, calendar, team, payments, studio profile and settings. Quotations, invoices and receipts can be downloaded as PDFs. Published quotations have client decision pages.

Start the Django backend in `../photography-managment-backend` and run its migrations for registration, public quote decisions and document email. Set `VITE_API_URL` when the backend is on a different origin. Core workspace records currently use browser localStorage for the signed-in studio; published quote snapshots and their decisions are stored in Django. Configure the backend SMTP settings to deliver invoice and receipt emails outside development.

Core message: Help visitors instantly understand that FrameFlow replaces scattered WhatsApp chats, spreadsheets and manual paperwork with one organized system for client records, enquiries, quotations, bookings, shoot management, team coordination, billing and profit tracking. Clearly communicate how it saves time, prevents missed leads and payments, and helps studios run more profitably.

Design: Premium editorial photography aesthetic, not a generic AI-generated SaaS template. Use cinematic wedding photos, studio portraits, behind-the-scenes images, overlapping collages, asymmetrical layouts, bold typography and realistic dashboard mockups. Avoid repetitive cards and standard centered hero sections.

Style: DM Sans + Playfair Display, warm ivory, charcoal, muted olive and rich photographic colors.

Create a visually striking, image-rich landing page with clear benefits, product previews, pricing and strong CTAs. Build responsive, polished authentication and onboarding flows with functional forms and realistic Indian studio data. Prioritize originality, clarity and conversion—visitors should immediately understand what FrameFlow does and why their studio needs it.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lens-ledger-studio-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2e6462b6-4ad9-4341-b080-5a3f513625c9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
