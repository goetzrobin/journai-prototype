import { clearChats, getChats } from '@/app/actions'
import { ClearHistory } from '@/components/clear-history'
import { SidebarItems } from '@/components/sidebar-items'
import { ThemeToggle } from '@/components/theme-toggle'
import { cache } from 'react'
import { Button } from './ui/button'
import { CheckIcon } from '@radix-ui/react-icons'
import Link from "next/link";

interface SidebarListProps {
  userId?: string
  children?: React.ReactNode
}

const loadChats = cache(async (userId?: string) => {
  return await getChats(userId)
})

export async function SidebarList({ userId }: SidebarListProps) {
  const chats = await loadChats(userId)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
          <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-8">Cornerstone Conversations</h2>
          <h2 className="mb-4 font-semibold">Alignment</h2>
          <Button asChild className='w-full mb-4 justify-start' variant="outline">
              <Link href="/new">Values Workshop</Link></Button>
          <Button disabled className='w-full mb-4 justify-start' variant="outline">Build your mental mosaic</Button>
          <Button disabled className='w-full mb-4 justify-start' variant="outline">Ideal Day Planning</Button>
          <Button disabled className='w-full mb-4 justify-start' variant="outline">Current Habits Invetory</Button>
          <Button disabled className='w-full mb-4 justify-start' variant="outline">Goal Setting & Routine Planning</Button>
          <h2 className="mb-4 font-semibold">Relationships</h2>
          <Button disabled className='w-full mb-4 justify-start' variant="outline">Attachment Exploration</Button>
          <p className="p-4 text-sm text-center text-muted-foreground">More relationship conversations coming soon</p>
          </div>
            <div className="p-4 border-b">
            <h2 className="text-lg mb-8 font-semibold">My Routines</h2>
            <h2 className="mb-4 font-semibold">Daily</h2>
            <Button disabled className='w-full mb-4 justify-start' variant="outline">Morning Checkin
            </Button>
            <Button disabled className='w-full mb-4 justify-start' variant="outline">Evening Gratefulness</Button>
            <h2 className="mb-4 font-semibold">Weekly</h2>
            <Button disabled className='w-full mb-4 justify-start' variant="outline">Sunday Reflection
            </Button>
          </div>
            <div className="p-4 border-b">
            <h2 className="text-lg mb-8 font-semibold">Help me</h2>
            <Button className='w-full mb-4 justify-start' variant="outline">Vent</Button>
            <Button className='w-full mb-4 justify-start' variant="outline">Dump my emotions</Button>
            <Button className='w-full mb-4 justify-start' variant="outline">Reassurance on a decision</Button>
            <Button className='w-full mb-4 justify-start' variant="outline">Get grounded</Button>
            <Button className='w-full mb-4 justify-start' variant="outline">Explore my feelings</Button>
          </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <ThemeToggle />
        <ClearHistory clearChats={clearChats} isEnabled={chats?.length > 0} />
      </div>
    </div>
  )
}
