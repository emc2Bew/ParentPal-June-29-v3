# Expo Auth App

A complete React Native Expo application with Supabase authentication integration.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to Settings > API
3. Copy the "Project URL" and "anon public" key
4. Add these to your `.env` file

## Features

- **Authentication Flows**: Sign up, sign in, email verification
- **Session Management**: Automatic session persistence with AsyncStorage
- **Email Verification**: Automatic polling for verification status
- **Error Handling**: User-friendly error messages with toast notifications
- **TypeScript**: Full type safety throughout the application
- **Testing**: Comprehensive test coverage with Jest and React Testing Library

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables as described above

3. Start the development server:
```bash
npm run dev
```

4. Run tests:
```bash
npm test
```

## Project Structure

```
app/
├── (tabs)/                 # Main app tabs
├── screens/Auth/          # Authentication screens
│   ├── Login.tsx
│   ├── SignUp.tsx
│   └── VerifyEmail.tsx
├── _layout.tsx           # Root layout with AuthProvider
└── index.tsx             # App entry point

components/ui/            # Reusable UI components
├── Button.tsx
├── Input.tsx
└── Toast.tsx

hooks/
└── useAuth.ts           # Authentication context and hook

lib/
└── supabase.ts          # Supabase client configuration

tests/
└── authFlows.test.tsx   # Authentication flow tests
```

## Authentication Flow

1. **Sign Up**: Users create an account with email and password
2. **Email Verification**: Users verify their email address via link
3. **Sign In**: Users authenticate with verified credentials
4. **Session Persistence**: Sessions are automatically saved and restored

## Testing

The app includes comprehensive tests covering:
- Form validation
- Authentication flows
- Navigation behavior
- Error handling
- Session management

Run tests with:
```bash
npm test
```

## Technologies Used

- **Expo** - React Native framework
- **Supabase** - Backend as a service for authentication
- **TypeScript** - Type safety
- **Jest** - Testing framework
- **React Testing Library** - Component testing utilities