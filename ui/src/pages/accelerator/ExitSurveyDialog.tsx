// EVA-STORY: F46-01-003
// EVA-STORY: F46-05-004
// EVA-FEATURE: F46-01 F46-05
import { useState } from 'react'
import { useLocalStorageState } from '@/hooks/use-local-storage-state'
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Label,
  Radio,
  RadioGroup,
  Text,
  Textarea,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components'
import { CheckmarkCircleRegular, ReceiptRegular } from '@fluentui/react-icons'
import type { Booking, ExitSurvey } from '@/lib/types'

interface ExitSurveyDialogProps {
  booking: Booking
  open: boolean
  onOpenChange: (open: boolean) => void
}

const useStyles = makeStyles({
  dialogSurface: {
    width: 'min(860px, calc(100vw - 24px))',
  },
  content: {
    maxHeight: '85vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  radioColumn: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
  },
  ratingRow: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
  },
  accountingSection: {
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('16px', '0', '0'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  accountingHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    ...shorthands.gap('12px'),
  },
  summaryBox: {
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtle: {
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
  },
  strong: {
    fontWeight: 700,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
  },
})

export default function ExitSurveyDialog({ booking, open, onOpenChange }: ExitSurveyDialogProps) {
  const [bookings, setBookings] = useLocalStorageState<Booking[]>('bookings', [])
  const [exitSurveys, setExitSurveys] = useLocalStorageState<ExitSurvey[]>('exit-surveys', [])

  const [actualResults, setActualResults] = useState('')
  const [goalsAchieved, setGoalsAchieved] = useState<'yes' | 'no' | ''>('')
  const [lessonsLearned, setLessonsLearned] = useState('')
  const [blockers, setBlockers] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [rating, setRating] = useState('')
  const [department, setDepartment] = useState('')
  const [costCenter, setCostCenter] = useState('')
  const [approverName, setApproverName] = useState('')
  const [approverEmail, setApproverEmail] = useState('')
  const styles = useStyles()

  const handleSubmit = () => {
    if (!actualResults.trim() || !goalsAchieved || !lessonsLearned.trim() || !rating) {
      window.alert('Please complete all required fields')
      return
    }

    if (!department.trim() || !costCenter.trim() || !approverName.trim() || !approverEmail.trim()) {
      window.alert('Please complete all accounting information fields')
      return
    }

    const newExitSurvey: ExitSurvey = {
      bookingId: booking.id,
      actualResults,
      goalsAchieved: goalsAchieved === 'yes',
      lessonsLearned,
      blockers,
      suggestions,
      rating: parseInt(rating),
      accountingInfo: {
        department,
        costCenter,
        approverName,
        approverEmail
      }
    }

    setExitSurveys((current) => [...(current || []), newExitSurvey])
    setBookings((current) =>
      (current || []).map((b) =>
        b.id === booking.id
          ? { ...b, exitSurveyCompleted: true, status: 'completed' as const }
          : b
      )
    )

    window.alert('Exit survey submitted! Receipt will be generated.')
    handleClose()
  }

  const handleClose = () => {
    setActualResults('')
    setGoalsAchieved('')
    setLessonsLearned('')
    setBlockers('')
    setSuggestions('')
    setRating('')
    setDepartment('')
    setCostCenter('')
    setApproverName('')
    setApproverEmail('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) handleClose() }}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle>Exit Survey & Cost Recovery</DialogTitle>
          <DialogContent className={styles.content}>
            <Text className={styles.subtitle}>
              Help us improve EVA DA by sharing your experience and providing accounting information
            </Text>

          <div className={styles.section}>
            <Label htmlFor="actual-results">What results did you achieve? *</Label>
            <Textarea
              id="actual-results"
              value={actualResults}
              onChange={(e) => setActualResults(e.target.value)}
              placeholder="Describe the outcomes and accomplishments from your workspace usage..."
              rows={3}
            />
          </div>

          <div className={styles.section}>
            <Label>Did you achieve your stated goals? *</Label>
            <RadioGroup
              value={goalsAchieved}
              onChange={(_, data) => setGoalsAchieved(data.value as 'yes' | 'no')}
              className={styles.radioColumn}
            >
              <Radio value="yes" label="Yes, goals were achieved" />
              <Radio value="no" label="No, goals were not fully achieved" />
            </RadioGroup>
          </div>

          <div className={styles.section}>
            <Label htmlFor="lessons">Key Lessons Learned *</Label>
            <Textarea
              id="lessons"
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="What insights did you gain from using EVA DA?"
              rows={3}
            />
          </div>

          <div className={styles.section}>
            <Label htmlFor="blockers">Blockers or Challenges (optional)</Label>
            <Textarea
              id="blockers"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Describe any obstacles you encountered..."
              rows={2}
            />
          </div>

          <div className={styles.section}>
            <Label htmlFor="suggestions">Suggestions for Improvement (optional)</Label>
            <Textarea
              id="suggestions"
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="How can we make EVA DA better?"
              rows={2}
            />
          </div>

          <div className={styles.section}>
            <Label htmlFor="rating">Overall Experience Rating *</Label>
            <RadioGroup value={rating} onChange={(_, data) => setRating(data.value)}>
              <div className={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <Radio key={num} value={num.toString()} label={num.toString()} />
                ))}
              </div>
              <Text className={styles.subtle}>1 = Poor, 5 = Excellent</Text>
            </RadioGroup>
          </div>

          <div className={styles.accountingSection}>
            <div className={styles.accountingHeader}>
              <ReceiptRegular fontSize={20} />
              <Text weight="semibold">Accounting Information</Text>
            </div>

            <div className={styles.twoCol}>
              <Field label="Department *">
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., IT Services"
                />
              </Field>

              <Field label="Cost Center *">
                <Input
                  id="cost-center"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  placeholder="e.g., CC-12345"
                />
              </Field>

              <Field label="Approver Name *">
                <Input
                  id="approver-name"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="Full name"
                />
              </Field>

              <Field label="Approver Email *">
                <Input
                  id="approver-email"
                  type="email"
                  value={approverEmail}
                  onChange={(e) => setApproverEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </Field>
            </div>
          </div>

          <div className={styles.summaryBox}>
            <Text className={styles.strong}>Cost Recovery Summary</Text>
            <div className={styles.summaryRow}>
              <Text className={styles.subtle}>Total Amount</Text>
              <Text className={styles.strong}>${booking.totalCost}</Text>
            </div>
            <Text className={styles.subtle}>
              A receipt will be generated and sent to the approver for funding processing.
            </Text>
          </div>

          <div className={styles.actions}>
            <Button appearance="secondary" onClick={handleClose}>Cancel</Button>
            <Button appearance="primary" onClick={handleSubmit} icon={<CheckmarkCircleRegular />}>
              Submit & Generate Receipt
            </Button>
          </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
