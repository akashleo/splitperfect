# SplitPerfect Frontend

React + TypeScript frontend for SplitPerfect expense sharing application.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Add your Google Client ID
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   App will run at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # ShadCN UI components
│   │   └── Layout.tsx    # App layout with navigation
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── Home.tsx
│   │   ├── CreateRoom.tsx
│   │   ├── JoinRoom.tsx
│   │   ├── RoomDetails.tsx
│   │   ├── UploadBill.tsx
│   │   ├── EditBill.tsx
│   │   ├── Bills.tsx
│   │   ├── Rooms.tsx
│   │   └── Report.tsx
│   ├── lib/
│   │   ├── api.ts        # Axios API client
│   │   └── utils.ts      # Utility functions
│   ├── store/
│   │   └── authStore.ts  # Zustand auth state
│   ├── types/
│   │   └── index.ts      # TypeScript types
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
└── package.json
```

## Key Features

- **Mobile-First Design** - Optimized for mobile devices
- **PWA Support** - Installable as mobile app
- **Offline Capable** - Service worker for offline functionality
- **Modern UI** - ShadCN components with Tailwind CSS
- **Type-Safe** - Full TypeScript coverage
- **Optimized** - React Query for efficient data fetching

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Manual

```bash
npm run build
# Deploy dist/ folder to any static host
```
