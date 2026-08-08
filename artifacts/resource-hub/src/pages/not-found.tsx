export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-serif font-bold text-foreground">404</h1>
      <p className="text-muted-foreground mt-2">The page you are looking for does not exist.</p>
      <a href="/" className="mt-4 text-primary hover:underline">Return to Hub</a>
    </div>
  )
}
