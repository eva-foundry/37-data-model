import { makeStyles } from '@fluentui/react-components';

export interface EvaJsonViewerProps {
  data: unknown;
}

const useStyles = makeStyles({
  pre: {
    overflowX: 'auto',
    maxHeight: '480px',
    margin: '0',
  },
});

export function EvaJsonViewer({ data }: EvaJsonViewerProps) {
  const styles = useStyles();
  const formatted = JSON.stringify(data ?? {}, null, 2);
  return (
    <pre className={styles.pre}>
      <code>{formatted}</code>
    </pre>
  );
}
