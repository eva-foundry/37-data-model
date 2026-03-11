/**
 * EvaIcon Component
 * Wraps Fluent UI Icons with GC Design System semantic names
 */

import React from 'react';
import {
  AddRegular,
  EditRegular,
  DeleteRegular,
  SaveRegular,
  DismissRegular,
  SearchRegular,
  FilterRegular,
  ArrowSortRegular,
  ArrowClockwiseRegular,
  ArrowDownloadRegular,
  ArrowUploadRegular,
  CopyRegular,
  CutRegular,
  ClipboardPasteRegular,
  PrintRegular,
  ShareRegular,
  HomeRegular,
  ArrowLeftRegular,
  ArrowRightRegular,
  ArrowUpRegular,
  ArrowDownRegular,
  NavigationRegular,
  MoreVerticalRegular,
  MoreHorizontalRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  WarningRegular,
  InfoRegular,
  LockClosedRegular,
  LockOpenRegular,
  DocumentRegular,
  FolderRegular,
  ImageRegular,
  AttachRegular,
  LinkRegular,
  CalendarRegular,
  ClockRegular,
  MailRegular,
  CommentRegular,
  ChatRegular,
  AlertRegular,
  PersonRegular,
  PeopleRegular,
  SettingsRegular,
  SignOutRegular,
  GridRegular,
  TableRegular,
  ListRegular,
  DataBarVerticalRegular,
  QuestionCircleRegular,
  OpenRegular,
  EyeRegular,
  EyeOffRegular,
  LocalLanguageRegular,
} from '@fluentui/react-icons';
import { gcIconSizes, type GCSemanticIconName, type GCIconSize } from '@eva/gc-design-system/tokens';

const iconMap = {
  add: AddRegular,
  edit: EditRegular,
  delete: DeleteRegular,
  save: SaveRegular,
  cancel: DismissRegular,
  close: DismissRegular,
  search: SearchRegular,
  filter: FilterRegular,
  sort: ArrowSortRegular,
  refresh: ArrowClockwiseRegular,
  download: ArrowDownloadRegular,
  upload: ArrowUploadRegular,
  copy: CopyRegular,
  cut: CutRegular,
  paste: ClipboardPasteRegular,
  print: PrintRegular,
  share: ShareRegular,
  home: HomeRegular,
  back: ArrowLeftRegular,
  forward: ArrowRightRegular,
  up: ArrowUpRegular,
  down: ArrowDownRegular,
  menu: NavigationRegular,
  moreVertical: MoreVerticalRegular,
  moreHorizontal: MoreHorizontalRegular,
  expand: ChevronDownRegular,
  collapse: ChevronUpRegular,
  success: CheckmarkCircleRegular,
  error: ErrorCircleRegular,
  warning: WarningRegular,
  info: InfoRegular,
  locked: LockClosedRegular,
  unlocked: LockOpenRegular,
  document: DocumentRegular,
  folder: FolderRegular,
  image: ImageRegular,
  attachment: AttachRegular,
  link: LinkRegular,
  calendar: CalendarRegular,
  clock: ClockRegular,
  email: MailRegular,
  comment: CommentRegular,
  chat: ChatRegular,
  notification: AlertRegular,
  person: PersonRegular,
  people: PeopleRegular,
  settings: SettingsRegular,
  signout: SignOutRegular,
  dashboard: GridRegular,
  table: TableRegular,
  list: ListRegular,
  grid: GridRegular,
  chart: DataBarVerticalRegular,
  help: QuestionCircleRegular,
  external: OpenRegular,
  visibility: EyeRegular,
  visibilityOff: EyeOffRegular,
  language: LocalLanguageRegular,
} as const;

export interface EvaIconProps {
  /** Semantic icon name */
  name: GCSemanticIconName;
  /** Icon size */
  size?: GCIconSize;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Icon title (tooltip) */
  title?: string;
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * EvaIcon - GC-compliant icon component with semantic names
 * 
 * @example
 * ```tsx
 * <EvaIcon name="add" size="lg" aria-label="Add new item" />
 * <EvaIcon name="delete" size="md" title="Delete" />
 * ```
 */
export function EvaIcon({
  name,
  size = 'md',
  'aria-label': ariaLabel,
  title,
  className,
  style,
}: EvaIconProps) {
  const IconComponent = (iconMap as Partial<Record<GCSemanticIconName, typeof AddRegular>>)[name];
  
  if (!IconComponent) {
    console.warn(`EvaIcon: Unknown icon name "${name}"`);
    return null;
  }

  const iconSize = gcIconSizes[size];

  return (
    <IconComponent
      aria-label={ariaLabel}
      title={title}
      className={className}
      style={{
        width: iconSize,
        height: iconSize,
        ...style,
      }}
    />
  );
}
