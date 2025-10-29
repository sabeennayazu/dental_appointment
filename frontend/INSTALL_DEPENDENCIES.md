# Install Dependencies for Next.js Admin Panel

## Required Dependencies

The admin panel requires these npm packages (already in package.json):

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.90.5",
    "@tanstack/react-table": "^8.21.3",
    "axios": "^1.13.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.544.0"
  }
}
```

## Installation Command

Run this command in the `frontend` directory:

```bash
npm install
```

This will install all dependencies including:
- **@tanstack/react-query** - Data fetching and caching
- **@tanstack/react-table** - Table components (for future enhancements)
- **axios** - HTTP client (alternative to fetch)
- **clsx** - Utility for conditional CSS classes
- **date-fns** - Date formatting and manipulation
- **lucide-react** - Icon library

## Verify Installation

After installation, verify the packages:

```bash
npm list @tanstack/react-query @tanstack/react-table axios clsx date-fns lucide-react
```

Expected output:
```
dental_appointment@0.1.0
├── @tanstack/react-query@5.90.5
├── @tanstack/react-table@8.21.3
├── axios@1.13.1
├── clsx@2.1.1
├── date-fns@4.1.0
└── lucide-react@0.544.0
```

## Alternative: Manual Installation

If you need to install packages individually:

```bash
npm install @tanstack/react-query@^5.90.5
npm install @tanstack/react-table@^8.21.3
npm install axios@^1.13.1
npm install clsx@^2.1.1
npm install date-fns@^4.1.0
npm install lucide-react@^0.544.0
```

## Already Installed

These packages were already in your project:
- **next** - Next.js framework
- **react** - React library
- **react-dom** - React DOM
- **tailwindcss** - CSS framework
- **typescript** - TypeScript support
- **lucide-react** - Icons (already installed)
- **framer-motion** - Animations

## No Additional Installation Needed

The admin panel is ready to use! Just run:

```bash
npm run dev
```

## Troubleshooting

### If npm install fails:

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and package-lock.json**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use npm ci** (for clean install):
   ```bash
   npm ci
   ```

### If specific package fails:

Check Node.js version (requires Node 18+):
```bash
node --version
```

Update npm:
```bash
npm install -g npm@latest
```

## Next Steps

After installing dependencies:

1. ✅ Configure `.env.local` (see `env.example`)
2. ✅ Start Django backend
3. ✅ Run `npm run dev`
4. ✅ Visit http://localhost:3000/admin

See `QUICK_START.md` for complete setup instructions.
