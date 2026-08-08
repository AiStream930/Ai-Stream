import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import NotFound from '@/pages/not-found'
import { Route, Switch, Router as WouterRouter } from 'wouter'
import Hub from '@/pages/hub'
import { StoreProvider } from '@/lib/store'

function Router() {
  return (
    <Switch>
      <Route path="/" component={Hub} />
      <Route path="/folder/:id" component={Hub} />
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <StoreProvider>
      <TooltipProvider delayDuration={300}>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </StoreProvider>
  )
}

export default App
