import { Button } from "./ui/button";

export function EmptyScreen({onClick}: {onClick?: () => void}) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Welcome! Let&apos;s start your journai.
        </h1>
        <p className="leading-normal text-muted-foreground">
          In this conversation your AI mentor Sam will guide you through an exploration of what&apos;s 
          important to you and help you start on a path to a future that is aligned with your values and passions.
        </p>
        <Button className="mt-4 w-fit" onClick={onClick}>I am ready to start my journai!</Button>
      </div>
    </div>
  )
}
