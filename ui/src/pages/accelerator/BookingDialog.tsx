// EVA-STORY: F46-01-002
// EVA-STORY: F46-05-002
// EVA-FEATURE: F46-01 F46-05
import { useState } from 'react'
import { useLocalStorageState } from '@/hooks/use-local-storage-state'
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  Label,
  ProgressBar,
  Text,
  Textarea,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components'
import {
  ArrowLeftRegular,
  ArrowRightRegular,
  CalendarRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons'
import type { Workspace, Booking, EntrySurvey } from '@/lib/types'
import { DOCUMENT_TYPES, AI_FEATURES } from '@/lib/constants'

interface BookingDialogProps {
  workspace: Workspace
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'dates' | 'survey' | 'confirmation'

const useStyles = makeStyles({
  dialogSurface: {
    width: 'min(860px, calc(100vw - 24px))',
  },
  content: {
    maxHeight: '85vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  stepSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
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
    ...shorthands.gap('6px'),
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bold: {
    fontWeight: 700,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    ...shorthands.gap('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding('12px'),
    maxHeight: '200px',
    overflowY: 'auto',
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  actionsEnd: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
  },
  actionsBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px', '0'),
  },
  successIcon: {
    width: '64px',
    height: '64px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
})

export default function BookingDialog({ workspace, open, onOpenChange }: BookingDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>('dates')
  const [bookings, setBookings] = useLocalStorageState<Booking[]>('bookings', [])
  const [surveys, setSurveys] = useLocalStorageState<EntrySurvey[]>('entry-surveys', [])

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [useCase, setUseCase] = useState('')
  const [expectedBenefits, setExpectedBenefits] = useState('')
  const [targetMetrics, setTargetMetrics] = useState('')
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([])
  const [selectedAIFeatures, setSelectedAIFeatures] = useState<string[]>([])
  const [teamSize, setTeamSize] = useState('1')
  const styles = useStyles()

  const calculateCost = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const weeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return weeks * workspace.pricePerWeek
  }

  const handleDatesContinue = () => {
    if (!startDate || !endDate) {
      window.alert('Please select both start and end dates')
      return
    }
    if (new Date(startDate) >= new Date(endDate)) {
      window.alert('End date must be after start date')
      return
    }
    setCurrentStep('survey')
  }

  const handleSurveySubmit = () => {
    if (!useCase.trim() || !expectedBenefits.trim() || !targetMetrics.trim()) {
      window.alert('Please complete all required survey fields')
      return
    }
    if (selectedDocTypes.length === 0) {
      window.alert('Please select at least one document type')
      return
    }
    if (selectedAIFeatures.length === 0) {
      window.alert('Please select at least one AI feature')
      return
    }

    const bookingId = `booking-${Date.now()}`
    const totalCost = calculateCost()

    const newBooking: Booking = {
      id: bookingId,
      workspaceId: workspace.id,
      userId: 'current-user',
      userName: 'Current User',
      startDate,
      endDate,
      status: 'active',
      entrySurveyCompleted: true,
      exitSurveyCompleted: false,
      totalCost,
      createdAt: new Date().toISOString()
    }

    const newSurvey: EntrySurvey = {
      bookingId,
      useCase,
      expectedBenefits,
      targetMetrics,
      documentTypes: selectedDocTypes,
      aiFeatures: selectedAIFeatures,
      teamSize: parseInt(teamSize)
    }

    setBookings((current) => [...(current || []), newBooking])
    setSurveys((current) => [...(current || []), newSurvey])

    setCurrentStep('confirmation')
    window.alert('Workspace booked successfully!')
  }

  const handleClose = () => {
    setCurrentStep('dates')
    setStartDate('')
    setEndDate('')
    setUseCase('')
    setExpectedBenefits('')
    setTargetMetrics('')
    setSelectedDocTypes([])
    setSelectedAIFeatures([])
    setTeamSize('1')
    onOpenChange(false)
  }

  const progress = currentStep === 'dates' ? 33 : currentStep === 'survey' ? 66 : 100

  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) handleClose() }}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle>Book {workspace.name}</DialogTitle>
          <DialogContent className={styles.content}>
            <Text className={styles.subtitle}>Complete the booking process to reserve your workspace</Text>
            <ProgressBar value={progress / 100} thickness="large" />

        {currentStep === 'dates' && (
          <div className={styles.stepSection}>
            <div className={styles.twoCol}>
              <div className={styles.stepSection}>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className={styles.stepSection}>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {startDate && endDate && (
              <div className={styles.summaryBox}>
                <Text className={styles.bold}>Booking Summary</Text>
                <div className={styles.summaryRow}>
                  <Text className={styles.muted}>Duration</Text>
                  <Text className={styles.bold}>
                    {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))} weeks
                  </Text>
                </div>
                <div className={styles.summaryRow}>
                  <Text className={styles.muted}>Total Cost</Text>
                  <Text className={styles.bold}>${calculateCost()}</Text>
                </div>
              </div>
            )}

            <div className={styles.actionsEnd}>
              <Button appearance="secondary" onClick={handleClose}>Cancel</Button>
              <Button appearance="primary" onClick={handleDatesContinue} icon={<ArrowRightRegular />} iconPosition="after">
                Continue to Survey
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'survey' && (
          <div className={styles.stepSection}>
            <div className={styles.stepSection}>
              <Label htmlFor="use-case">What is your use case? *</Label>
              <Textarea
                id="use-case"
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                placeholder="Describe the business problem or opportunity you want to explore..."
                rows={3}
              />
            </div>

            <div className={styles.stepSection}>
              <Label htmlFor="expected-benefits">Expected Benefits & Outcomes *</Label>
              <Textarea
                id="expected-benefits"
                value={expectedBenefits}
                onChange={(e) => setExpectedBenefits(e.target.value)}
                placeholder="What do you hope to achieve with this workspace?"
                rows={3}
              />
            </div>

            <div className={styles.stepSection}>
              <Label htmlFor="target-metrics">Target Metrics *</Label>
              <Input
                id="target-metrics"
                value={targetMetrics}
                onChange={(e) => setTargetMetrics(e.target.value)}
                placeholder="e.g., Process 500 documents, reduce review time by 30%"
              />
            </div>

            <div className={styles.stepSection}>
              <Label>Document Types * (select all that apply)</Label>
              <div className={styles.featureGrid}>
                {DOCUMENT_TYPES.map((type) => (
                  <div key={type} className={styles.optionRow}>
                    <Checkbox
                      id={`doc-${type}`}
                      checked={selectedDocTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        setSelectedDocTypes((current) =>
                          checked
                            ? [...current, type]
                            : current.filter((t) => t !== type)
                        )
                      }}
                    />
                    <Label htmlFor={`doc-${type}`}>
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.stepSection}>
              <Label>AI Features Needed * (select all that apply)</Label>
              <div className={styles.featureGrid}>
                {AI_FEATURES.map((feature) => (
                  <div key={feature} className={styles.optionRow}>
                    <Checkbox
                      id={`ai-${feature}`}
                      checked={selectedAIFeatures.includes(feature)}
                      onCheckedChange={(checked) => {
                        setSelectedAIFeatures((current) =>
                          checked
                            ? [...current, feature]
                            : current.filter((f) => f !== feature)
                        )
                      }}
                    />
                    <Label htmlFor={`ai-${feature}`}>
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.stepSection}>
              <Label htmlFor="team-size">Team Size</Label>
              <Input
                id="team-size"
                type="number"
                min="1"
                max={workspace.capacity}
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
              />
            </div>

            <div className={styles.actionsBetween}>
              <Button appearance="secondary" onClick={() => setCurrentStep('dates')} icon={<ArrowLeftRegular />}>
                Back
              </Button>
              <Button appearance="primary" onClick={handleSurveySubmit} icon={<CheckmarkCircleRegular />} iconPosition="after">
                Complete Booking
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'confirmation' && (
          <div className={styles.stepSection}>
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>
                <CheckmarkCircleRegular fontSize={40} />
              </div>
              <div>
                <Text size={500} weight="bold">Booking Confirmed!</Text>
                <Text className={styles.subtitle}>
                  Your workspace has been reserved. You'll receive access instructions via email.
                </Text>
              </div>
            </div>

            <div className={styles.summaryBox}>
              <div className={styles.summaryRow}>
                <Text className={styles.muted}>Workspace</Text>
                <Text className={styles.bold}>{workspace.name}</Text>
              </div>
              <div className={styles.summaryRow}>
                <Text className={styles.muted}>Period</Text>
                <Text className={styles.bold}>
                  {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </Text>
              </div>
              <div className={styles.summaryRow}>
                <Text className={styles.muted}>Total Cost</Text>
                <Text className={styles.bold}>${calculateCost()}</Text>
              </div>
            </div>

            <Button appearance="primary" onClick={handleClose} className={styles.fullWidth} icon={<CalendarRegular />}>
              View My Bookings
            </Button>
          </div>
        )}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
