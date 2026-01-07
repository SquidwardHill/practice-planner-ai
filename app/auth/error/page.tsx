import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { P } from '@/components/atoms/typography'

export default async function Page({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sorry, something went wrong.</CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <P className="text-muted-foreground">Code error: {params.error}</P>
              ) : (
                <P className="text-muted-foreground">An unspecified error occurred.</P>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
