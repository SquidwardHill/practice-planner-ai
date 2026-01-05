import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Account created successfully</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground mb-4">
                Your account has been created. If email confirmation is enabled,
                please check your email.
              </p>
              <p className="text-base text-muted-foreground">
                For local development, you can confirm your email using:
              </p>
              <code className="text-xs bg-muted p-2 rounded mt-2 block">
                npm run confirm:user &lt;your-email&gt;
              </code>
              <div className="mt-4">
                <a
                  href="/auth/login"
                  className="text-sm underline underline-offset-4"
                >
                  Go to login →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
