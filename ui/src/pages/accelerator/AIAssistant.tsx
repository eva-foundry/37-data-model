// EVA-STORY: F46-03-003
// EVA-FEATURE: F46-03
/**
 * AIAssistant — EVA Brain chat panel
 *
 * Wired to eva-brain-api (port 8001) via /api/brain proxy.
 * Uses the `ungrounded` approach for workspace booking assistance
 * and falls back gracefully when the Brain API is offline.
 *
 * Design system: @eva/ui + @eva/gc-design-system (Spark stack, 43-spark)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  makeStyles,
  tokens,
  shorthands,
  Text,
  Textarea,
  Divider,
} from '@fluentui/react-components'
import {
  SparkleRegular,
  SendRegular,
  BotRegular,
  PersonRegular,
  WarningRegular,
  DismissRegular,
} from '@fluentui/react-icons'
import { EvaButton, EvaSpinner, EvaBadge } from '@eva/ui'
import { chatUngrounded, pingBrain } from '@/lib/brain-client'
import type { ChatMessage } from '@/lib/brain-client'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 180px)',
    minHeight: '500px',
    maxWidth: '900px',
    marginLeft: 'auto',
    marginRight: 'auto',
    ...shorthands.gap('0px'),
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('20px', '24px', '16px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  headerIcon: {
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius('8px'),
    backgroundColor: tokens.colorBrandBackground,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForegroundInverted,
    flexShrink: 0,
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
  headerTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  headerSub: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  offlineBanner: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('10px', '24px'),
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: tokens.colorStatusWarningForeground1,
    fontSize: tokens.fontSizeBase200,
    '@media (forced-colors: active)': {
      backgroundColor: 'Canvas',
      color: 'CanvasText',
      ...shorthands.borderBottom('1px', 'solid', 'CanvasText'),
    },
  },

  messages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('24px'),
  },
  messageBubble: {
    display: 'flex',
    ...shorthands.gap('10px'),
    maxWidth: '85%',
  },
  messageBubbleUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageBubbleAssistant: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarUser: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundInverted,
  },
  avatarAssistant: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
  },
  bubbleText: {
    ...shorthands.padding('10px', '14px'),
    ...shorthands.borderRadius('12px'),
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  bubbleTextUser: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundInverted,
    ...shorthands.borderRadius('12px', '4px', '12px', '12px'),
    '@media (forced-colors: active)': {
      backgroundColor: 'Highlight',
      color: 'HighlightText',
    },
  },
  bubbleTextAssistant: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    ...shorthands.borderRadius('4px', '12px', '12px', '12px'),
    '@media (forced-colors: active)': {
      backgroundColor: 'Canvas',
      color: 'CanvasText',
      ...shorthands.border('1px', 'solid', 'CanvasText'),
    },
  },
  bubbleError: {
    ...shorthands.padding('10px', '14px'),
    ...shorthands.borderRadius('12px'),
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
    '@media (forced-colors: active)': {
      backgroundColor: 'Canvas',
      color: 'CanvasText',
      ...shorthands.border('1px', 'solid', 'CanvasText'),
    },
  },
  typing: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('10px', '14px'),
    ...shorthands.borderRadius('4px', '12px', '12px', '12px'),
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },

  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('8px'),
    ...shorthands.padding('0px', '24px', '16px'),
  },

  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    ...shorthands.gap('8px'),
    ...shorthands.padding('16px', '24px'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
  },
  textarea: {
    flex: 1,
    resize: 'none',
  },

  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    ...shorthands.gap('12px'),
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    color: tokens.colorBrandBackground,
    opacity: '0.5',
  },
})

// ---------------------------------------------------------------------------
// Starter suggestions
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  'What workspace types are available?',
  'How do I book a Protected B workspace?',
  'What is the entry survey for?',
  'How does cost recovery work?',
  'What AI features does each workspace offer?',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MessageEntry {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
}

export default function AIAssistant() {
  const styles = useStyles()
  const [messages, setMessages] = useState<MessageEntry[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [brainOnline, setBrainOnline] = useState<boolean | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Check brain health on mount
  useEffect(() => {
    pingBrain().then(setBrainOnline)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const conversationHistory = useCallback((): ChatMessage[] => {
    return messages
      .filter((m) => m.role !== 'error')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  }, [messages])

  const send = useCallback(
    async (text: string) => {
      const query = text.trim()
      if (!query || loading) return

      const userEntry: MessageEntry = {
        id: crypto.randomUUID(),
        role: 'user',
        content: query,
      }

      setMessages((prev) => [...prev, userEntry])
      setInput('')
      setLoading(true)

      try {
        const res = await chatUngrounded(query, conversationHistory())
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: res.answer },
        ])
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error contacting EVA Brain.'
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'error', content: message },
        ])
      } finally {
        setLoading(false)
      }
    },
    [loading, conversationHistory],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  const clearConversation = () => setMessages([])

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <SparkleRegular fontSize={22} />
          </div>
          <div className={styles.headerText}>
            <Text className={styles.headerTitle}>EVA Brain Assistant</Text>
            <Text className={styles.headerSub}>
              Powered by eva-brain-api · {brainOnline === null ? 'checking…' : brainOnline ? 'Online' : 'Offline — responses unavailable'}
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          {brainOnline !== null && (
            <EvaBadge
              color={brainOnline ? 'success' : 'danger'}
              appearance="filled"
            >
              {brainOnline ? 'Brain Online' : 'Brain Offline'}
            </EvaBadge>
          )}
          {messages.length > 0 && (
            <EvaButton
              variant="subtle"
              icon={<DismissRegular />}
              onClick={clearConversation}
              aria-label="Clear conversation"
              size="small"
            >
              Clear
            </EvaButton>
          )}
        </div>
      </div>

      {/* Offline warning */}
      {brainOnline === false && (
        <div className={styles.offlineBanner} role="alert">
          <WarningRegular fontSize={16} />
          <span>
            EVA Brain (port 8001) is not reachable. Start eva-brain-api to enable AI
            responses.
          </span>
        </div>
      )}

      {/* Messages */}
      <div className={styles.messages} role="log" aria-live="polite" aria-label="Conversation">
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <SparkleRegular className={styles.emptyIcon} />
            <Text size={500} weight="semibold">Ask EVA Brain anything</Text>
            <Text size={300}>
              I can help with workspace booking, features, costs, and AI capabilities.
            </Text>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageBubble} ${
                msg.role === 'user'
                  ? styles.messageBubbleUser
                  : styles.messageBubbleAssistant
              }`}
            >
              <div
                className={`${styles.avatar} ${
                  msg.role === 'user' ? styles.avatarUser : styles.avatarAssistant
                }`}
                aria-hidden="true"
              >
                {msg.role === 'user' ? (
                  <PersonRegular fontSize={16} />
                ) : (
                  <BotRegular fontSize={16} />
                )}
              </div>
              {msg.role === 'error' ? (
                <div className={styles.bubbleError}>{msg.content}</div>
              ) : (
                <div
                  className={`${styles.bubbleText} ${
                    msg.role === 'user'
                      ? styles.bubbleTextUser
                      : styles.bubbleTextAssistant
                  }`}
                >
                  {msg.content}
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className={styles.typing} role="status" aria-label="EVA Brain is thinking">
            <EvaSpinner size="tiny" />
            <span>EVA Brain is thinking…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only when no messages yet) */}
      {messages.length === 0 && (
        <>
          <Divider />
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <EvaButton
                key={s}
                variant="outline"
                size="small"
                onClick={() => void send(s)}
                disabled={loading || brainOnline === false}
              >
                {s}
              </EvaButton>
            ))}
          </div>
        </>
      )}

      {/* Input row */}
      <div className={styles.inputRow}>
        <Textarea
          className={styles.textarea}
          placeholder={
            brainOnline === false
              ? 'EVA Brain is offline — start eva-brain-api on port 8001'
              : 'Ask about workspaces, bookings, AI features… (Enter to send)'
          }
          value={input}
          onChange={(_, d) => setInput(d.value)}
          onKeyDown={handleKeyDown}
          resize="none"
          rows={2}
          disabled={loading || brainOnline === false}
          aria-label="Message input"
        />
        <EvaButton
          variant="primary"
          icon={<SendRegular />}
          onClick={() => void send(input)}
          disabled={loading || !input.trim() || brainOnline === false}
          aria-label="Send message"
        >
          Send
        </EvaButton>
      </div>
    </div>
  )
}
