// EVA-STORY: F46-05-001
// EVA-FEATURE: F46-05
import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardFooter,
  Button,
  Badge,
  Text,
  Title3,
  Caption1,
  tokens,
  makeStyles,
  shorthands,
} from '@fluentui/react-components'
import {
  CalendarRegular,
  LockClosedRegular,
  SparkleRegular,
  TranslateRegular,
  DocumentTextRegular,
  BeakerRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons'
import { WORKSPACES, WORKSPACE_TYPE_LABELS } from '@/lib/constants'
import type { Workspace } from '@/lib/types'
import BookingDialog from './BookingDialog'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    ...shorthands.gap('24px'),
  },
  card: {
    ...shorthands.transition('box-shadow', '200ms', 'ease'),
    ':hover': {
      boxShadow: tokens.shadow16,
    },
  },
  cardHeaderContent: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    ...shorthands.gap('12px'),
  },
  cardHeaderLeft: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  iconBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  description: {
    marginTop: '8px',
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
  featuresLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('6px'),
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    fontSize: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding('4px', '8px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  capacity: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('12px', '0', '0'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
  },
  capacityItem: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  capacityLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  capacityValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  priceValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
  },
})

const getWorkspaceIcon = (type: string) => {
  switch (type) {
    case 'protected-b':
      return <LockClosedRegular fontSize={24} />
    case 'ocr-enabled':
      return <DocumentTextRegular fontSize={24} />
    case 'translation':
      return <TranslateRegular fontSize={24} />
    case 'summarization':
      return <SparkleRegular fontSize={24} />
    default:
      return <BeakerRegular fontSize={24} />
  }
}

export default function WorkspaceCatalog() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const styles = useStyles()

  const handleBookWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace)
    setBookingDialogOpen(true)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Available Workspaces</h2>
        <Text className={styles.subtitle}>Select a workspace environment that matches your AI exploration needs</Text>
      </div>

      <div className={styles.grid}>
        {WORKSPACES.map((workspace) => (
          <Card key={workspace.id} className={styles.card}>
            <CardHeader>
              <div className={styles.cardHeaderContent}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.iconBadgeRow}>
                    {getWorkspaceIcon(workspace.type)}
                    <Badge appearance="filled" size="small">
                      {WORKSPACE_TYPE_LABELS[workspace.type]}
                    </Badge>
                  </div>
                  <Title3>{workspace.name}</Title3>
                </div>
              </div>
              <Text className={styles.description}>{workspace.description}</Text>
            </CardHeader>

            <div className={styles.features}>
              <Caption1 className={styles.featuresLabel}>KEY FEATURES</Caption1>
              <div className={styles.featuresList}>
                {workspace.features.map((feature, idx) => (
                  <div key={idx} className={styles.feature}>
                    <CheckmarkCircleRegular fontSize={12} />
                    {feature}
                  </div>
                ))}
              </div>

              <div className={styles.capacity}>
                <div className={styles.capacityItem}>
                  <Caption1 className={styles.capacityLabel}>Capacity</Caption1>
                  <Text className={styles.capacityValue}>{workspace.capacity} users</Text>
                </div>
                <div className={styles.capacityItem}>
                  <Caption1 className={styles.capacityLabel}>Price</Caption1>
                  <Text className={styles.priceValue}>${workspace.pricePerWeek}/week</Text>
                </div>
              </div>
            </div>

            <CardFooter>
              <Button
                appearance="primary"
                style={{ width: '100%' }}
                icon={<CalendarRegular />}
                onClick={() => handleBookWorkspace(workspace)}
              >
                Book This Workspace
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedWorkspace && (
        <BookingDialog
          workspace={selectedWorkspace}
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
        />
      )}
    </div>
  )
}
