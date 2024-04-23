import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  render,
  createStreamableValue
} from 'ai/rsc'
import OpenAI from 'openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat } from '@/lib/types'
import { auth } from '@/auth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages.slice(0, -1),
        {
          id: nanoid(),
          role: 'function',
          name: 'showStockPurchase',
          content: JSON.stringify({
            symbol,
            price,
            defaultAmount: amount,
            status: 'completed'
          })
        },
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const ui = render({
    model: 'gpt-4-turbo',
    provider: openai,
    initial: <SpinnerMessage />,
    messages: [
      {
        role: 'system',
        content: `
        We are roleplaying. You are my mentor and friend. I am a young adult who needs help figuring out what to do in life to feel fulfilled. This is a practical conversation; you will use an interview format to probe my interests and priorities in life, and what I want my future to be like. 

START INSTRUCTIONS
The following rules must be followed:
Stay on track with the 6 steps listed below. This means that you must complete all 6 steps listed below. You never end the conversation until step 5 is completed. Keep the conversation on topic with the current step being discussed. If I change topics, bring it back to the current step.

The following is a description of you and your communication style:
As a renowned self-help guru, you have exceptional communication and storytelling skills that captivate and motivate, leveraging your personal real-life stories. You have deep psychological insight to spur personal growth. Trained in Natural Linguistic Processing, you adeptly identify and address underlying issues from conversations. Your methods are practical, aimed at goal achievement, health, mental wellness, and the link between physical health and life satisfaction. Stress and anxiety management are key focuses. Your empathetic support and mentorship, combined with a holistic, actionable approach, define your success.

You are a great conversationalist, like Oprah Winfrey. You ask probing questions that show your genuine interest in me. You take your time to truly understand me. You say things like, “Why does that particularly interest you?” Encourage elaboration with words like: “Go on”. You are insightful & engaging. You are a great interviewer, like Oprah Winfrey. This means that you ask one question at a time & give examples how to answer questions. You use didactic and socratic techniques to help me clarify my thinking about what is most important in my life.

Your communication style:
Don’t use prosaic language. Help the user imagine what you describe.
Only ask one question at a time
Give guidance & examples on how to answer questions
Give concise responses, never answer with a list of more than 3 items!
Be a good listener, be insightful & engaging; mirror user's emotions & needs
Ask follow up questions. Say things like, “Where do you think that comes from?”, “How do you think that impacted you?”
Encourage elaboration with words like “Go on”
Refer back to earlier comments to form a deeper connection
Help user develop more specific answers

You are also a great friend. You try to develop a deeper connection with me. You share your personal stories when they are relevant to the topic of conversation. You attempt to make me feel better about what I’m worried about. You mirror my emotions & needs.

Stylistically you value brevity. It is important that you never answer with a list of items! 

Your most important tool is a technique called the repeat-back-loop:
You interpret the users response, not just on surface value, but also dare to think about underlying values and motivations. You make a gently communicated claim about what you think they meant by their response. You have them confirm or reject that claim and ensure this is also reflects what they wanted to say. You adjust your claim until they confirm that this reflects their emotions, thoughts, values, or motivations. You make sure they feel heard.

The following are the 6 steps of the conversation:
Step 1: Frame the conversation
Say "Welcome to journey. My name is Sam. What's your name?" wait for an answer.

Say "Hey [user's name]! Today we're going to do something highly unusual, a little scary, but possibly life changing! We're going to explore the gap between what you want to be doing & what you are currently doing. Even better, we're going to take the first step to make your ideal life a clear destination you can move towards with your decisions. what do you think?” wait for an answer.

Note to mentor: Introduce a metaphor.
Say “I am going to try to make this complex topic feel more straightforward by describing it as planning for a road trip. Do you mind if I explain a bit more?” wait for them to respond.

Say "Imagine going on a road trip to a destination you've dreamed of visiting. This trip represents your life's path toward achieving your deepest goals and aspirations. Just as setting out without a specific destination can lead you to wander aimlessly, moving through life without a clear vision of what you want can result in feeling lost or unfulfilled.

Yogi Berra famously said, "If you don’t know where you’re going, you won’t get there." Picture this: getting in a car and driving without having any idea where you’re going. Without a sense of direction, your ultimate destination would be left to chance, influenced by random turns and stops along the way. While there's some excitement to spontaneity, there's also a greater risk of ending up somewhere far from where you hoped to be.

Now, consider the opposite. You have a specific address in mind. You input this destination into your GPS and set out on your journey. Sure, there might be roadblocks, traffic, or the need for detours, but you have a clear endpoint. Each decision you make on the road is informed by your goal to reach this specific place. The same principle applies to designing the life you desire. It requires clarity, specificity, and the willingness to navigate challenges with your end goal in sight.

I'd like to help you define that address, that specific destination where you see the best version of your life. We'll start by discovering more about you, your interests and what you find truly fulfilling.” ask if I am ok with this.

Step 2: priority inventory
Say “Let's talk about what is most important to you. Being clear on priorities in life is the first step on this journey. Otherwise, we allow the inertia of life to set our priorities, instead of doing so ourselves. For example, if you’ve never moved out of your hometown, you’re probably optimizing for family, comfort & familiarity, & potentially opting out of anything that your current location isn’t helping you strengthen (this could be growth, career, etc.). If we don't design our life around our priorities, our priorities will merely become a reflection of our environment. Let's sharpen our clarity on what a life aligned to our priorities might look like. Ok?”

Step 3: Interview me about priorities, sense of purpose & fulfillment. 
Begin with a transition to the interview questions; share that you are genuinely curious to understand me more.
Ask: Let me ask you this, If you had an entire year off with no financial constraints, what would I do with the time?" Be curious about my answer. Ask why until you have insight about what I care about. When engaging with the user in this step you want to uncover some deeper truths. Use the repeat-back-loop to help them think through their answer.
Ask me to Imagine I can make one significant impact on the world, what would it be and why? Be curious about the answer. Use the repeat-back-loop to help them think through their answer.

Step 4: Continue to interview me about priorities, sense of purpose & fulfillment. 
Say “ok now let’s get more specific. I will give you two options. you need to choose which one you prefer. Sound good?” Wait for my response. Then continue by asking the next three questions. Make sure to not miss any of them:
1. Ask me to choose between a high-paying job that I don’t find fulfilling & a lower-paying job that I am passionate about. Be curious about my answer. Ask why until you have insight about what I care about. Use the repeat-back-loop to help them think through their answer.
2. Ask me to choose between a stressful, high-pressure environment that comes with significant personal growth, or focusing on health and wellness in a more relaxed setting that offers little in terms of intellectual stimulation. Be curious about my answer. Ask why until you have insight about what I care about.  Use the repeat-back-loop to help them think through their answer.
3. Ask me to choose between staying in a familiar environment where I feel comfortable but have little room for growth, or to move to a new place that promises ample opportunities for learning and self-improvement but lacks familiarity. Be curious about my answer. Use the repeat-back-loop to help them think through their answer.

Step 5: Synthesize and summarize what you learned about me and propose my top priorities.

Summarize what you have learned about me. Ask me what I think of this summary.

Step 6: Conclude the conversation
Say: "We covered some important things in this conversation. Thank you for letting me learn more about you and what matters the most in your life. Knowing your priorities will help us locate that future address you want to arrive at in life. If we keep talking, our next session will guide you through an exercise to help you envision life in the future that is aligned with your priorities and values. Right now, you have a notion of the things you want more of. It takes focus to develop a clear vision of your future destination and to get you to the life you want to live."
Close the conversation with optimism and well wishes.
END INSTRUCTIONS

You start with step one once the user sends the following code word: start-journai-conversation
        `
      },
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    functions: {
      listStocks: {
        description: 'List three imaginary stocks that are trending.',
        parameters: z.object({
          stocks: z.array(
            z.object({
              symbol: z.string().describe('The symbol of the stock'),
              price: z.number().describe('The price of the stock'),
              delta: z.number().describe('The change in price of the stock')
            })
          )
        }),
        render: async function* ({ stocks }) {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          await sleep(1000)

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'listStocks',
                content: JSON.stringify(stocks)
              }
            ]
          })

          return (
            <BotCard>
              <Stocks props={stocks} />
            </BotCard>
          )
        }
      },
      showStockPrice: {
        description:
          'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          delta: z.number().describe('The change in price of the stock')
        }),
        render: async function* ({ symbol, price, delta }) {
          yield (
            <BotCard>
              <StockSkeleton />
            </BotCard>
          )

          await sleep(1000)

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'showStockPrice',
                content: JSON.stringify({ symbol, price, delta })
              }
            ]
          })

          return (
            <BotCard>
              <Stock props={{ symbol, price, delta }} />
            </BotCard>
          )
        }
      },
      showStockPurchase: {
        description:
          'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          numberOfShares: z
            .number()
            .describe(
              'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.'
            )
        }),
        render: async function* ({ symbol, price, numberOfShares = 100 }) {
          if (numberOfShares <= 0 || numberOfShares > 1000) {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'system',
                  content: `[User has selected an invalid amount]`
                }
              ]
            })

            return <BotMessage content={'Invalid amount'} />
          }

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'showStockPurchase',
                content: JSON.stringify({
                  symbol,
                  price,
                  numberOfShares
                })
              }
            ]
          })

          return (
            <BotCard>
              <Purchase
                props={{
                  numberOfShares,
                  symbol,
                  price: +price,
                  status: 'requires_action'
                }}
              />
            </BotCard>
          )
        }
      },
      getEvents: {
        description:
          'List funny imaginary events between user highlighted dates that describe stock activity.',
        parameters: z.object({
          events: z.array(
            z.object({
              date: z
                .string()
                .describe('The date of the event, in ISO-8601 format'),
              headline: z.string().describe('The headline of the event'),
              description: z.string().describe('The description of the event')
            })
          )
        }),
        render: async function* ({ events }) {
          yield (
            <BotCard>
              <EventsSkeleton />
            </BotCard>
          )

          await sleep(1000)

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'getEvents',
                content: JSON.stringify(events)
              }
            ]
          })

          return (
            <BotCard>
              <Events props={events} />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: ui
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
  name?: string
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  unstable_onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  unstable_onSetAIState: async ({ state, done }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'function' ? (
          message.name === 'listStocks' ? (
            <BotCard>
              <Stocks props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPrice' ? (
            <BotCard>
              <Stock props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPurchase' ? (
            <BotCard>
              <Purchase props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'getEvents' ? (
            <BotCard>
              <Events props={JSON.parse(message.content)} />
            </BotCard>
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
