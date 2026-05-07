import { createFileRoute } from '@tanstack/react-router'
import { Headphones, MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'

import { AppShell, PageHeader } from '@/components/AppShell'
import { AuthGate } from '@/components/AuthGate'

export const Route = createFileRoute('/support')({
  component: SupportPage,
})

type ChatMessage = {
  id: string
  author: 'user' | 'agent'
  body: string
  createdAt: string
}

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    author: 'agent',
    body: 'A representative will reply shortly. Account verification, withdrawal status, and payment method questions can be reviewed from this thread.',
    createdAt: new Date().toISOString(),
  },
]

function SupportPage() {
  return (
    <AppShell>
      <AuthGate>
        <SupportContent />
      </AuthGate>
    </AppShell>
  )
}

function SupportContent() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')

  const handleSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${prev.length + 1}`,
        author: 'user',
        body,
        createdAt: new Date().toISOString(),
      },
    ])
    setDraft('')
  }

  return (
    <>
      <PageHeader
        eyebrow="Chat support"
        title="Message a customer service representative"
        description="Send questions about account verification, withdrawal status, payment methods, or processing tokens. Replies appear in this thread."
      />

      <section className="mx-auto w-full max-w-2xl rounded-md border border-[#d8d0c1] bg-[#fffdf8] shadow-sm">
        <header className="flex items-center gap-3 border-b border-[#ebe2d4] px-5 py-4">
          <span className="grid size-10 place-items-center rounded-md bg-[#23342d] text-white">
            <Headphones className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Support queue</p>
            <p className="text-sm text-[#6f5f4d]">Average response time: under one business hour</p>
          </div>
        </header>

        <div className="space-y-4 p-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.author === 'user'
                    ? 'bg-[#d96f32] text-white'
                    : 'bg-[#f4f1ea] text-[#1f2520]'
                }`}
              >
                {message.body}
              </div>
            </div>
          ))}
        </div>

        <form
          className="flex items-end gap-3 border-t border-[#ebe2d4] p-4"
          onSubmit={handleSend}
        >
          <label className="flex-1">
            <span className="sr-only">Message</span>
            <textarea
              className="h-20 w-full resize-none rounded-md border border-[#d8d0c1] bg-[#fbfaf7] p-3 text-sm outline-none focus:border-[#256352]"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Describe the account issue, withdrawal reference, or verification question"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-[#23342d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1a2a23] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!draft.trim()}
          >
            <Send className="size-4" />
            Send
          </button>
        </form>
      </section>

      <p className="mx-auto mt-4 flex max-w-2xl items-center gap-2 text-xs text-[#6f5f4d]">
        <MessageSquare className="size-3.5" />
        Sensitive payment credentials should never be shared over chat. Verification staff request only the information needed to release a payout.
      </p>
    </>
  )
}
