# Practice Planner AI

An AI-powered basketball practice plan generator built with Next.js, Tailwind CSS, and OpenAI.

## Features

- Generate structured basketball practice plans from natural language prompts
- Time-blocked practice schedules with drill categories
- Uses a curated master drill list to ensure realistic practice plans
- Clean, modern UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```bash
# For testing without an API key, use mock mode:
USE_MOCK_API=true

# Or use a real OpenAI API key:
# OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

The app includes a mock mode that works without an OpenAI API key. To use it, set `USE_MOCK_API=true` in your `.env.local` file. The mock mode returns sample practice plans based on the master drill list.

Run tests:
```bash
npm test
```

## Usage

Enter a practice request in the text area, for example:
- "Create a 90-minute varsity basketball practice focusing on transition defense and conditioning."
- "Generate a 60-minute practice plan for shooting and rebounding."

The AI will generate a structured practice plan with time slots, drill names, categories, and notes.

## Deployment

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your `OPENAI_API_KEY` as an environment variable in Vercel's project settings
4. Deploy!

The app will automatically use the environment variable from Vercel's settings.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
