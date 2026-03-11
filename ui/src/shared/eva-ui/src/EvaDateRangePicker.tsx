import { makeStyles } from '@fluentui/react-components';
import { EvaInput } from './EvaInput';

export interface EvaDateRangePickerProps {
  label?: string;
  start?: string;
  end?: string;
  disabled?: boolean;
  onChange: (start?: string, end?: string) => void;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  row: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  separator: {
    whiteSpace: 'nowrap',
  },
});

export function EvaDateRangePicker({ label, start, end, disabled, onChange }: EvaDateRangePickerProps) {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {label ? <span>{label}</span> : null}
      <div className={styles.row}>
        <EvaInput
          type="date"
          value={start ?? ''}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value || undefined, end)}
        />
        <span className={styles.separator}>to</span>
        <EvaInput
          type="date"
          value={end ?? ''}
          disabled={disabled}
          onChange={(event) => onChange(start, event.currentTarget.value || undefined)}
        />
      </div>
    </div>
  );
}
