import {Button, buttonVariants} from "./ui/button";
import {cn} from "@/lib/utils";
import Link from "next/link";

export function EmptyUnauthedScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Hey there! Log in or sign up to start your journai.
        </h1>
        <p className="leading-normal text-muted-foreground">
          If you already have an account click on Login next to the icon on the top right. If you&apos;re new sign up below. We can&apos;t wait for you to meet Sam!
        </p>
        <Link href="/signup" className={cn(buttonVariants({variant: 'default'}), 'mt-4 w-fit')} >Sign Up</Link>
      </div>
    </div>
  )
}
