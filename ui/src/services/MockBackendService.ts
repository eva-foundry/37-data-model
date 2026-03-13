/**
 * Mock Backend Service - Shared between chat-face and admin-face
 * 
 * Copy this file to both faces until we create a shared package.
 */

import { Translation, TranslationMap } from '../types/translations';

const STORAGE_KEYS = {
  TRANSLATIONS: 'eva_mock_translations',
  SETTINGS: 'eva_mock_settings',
  SETTINGS_ADMIN: 'eva_mock_settings_admin',
  APPS: 'eva_mock_apps',
  USER: 'eva_mock_user',
  RBAC_ASSIGNMENTS: 'eva_mock_rbac_assignments',
  AUDIT_LOGS: 'eva_mock_audit_logs',
} as const;

// Mock data - 61 translations from seed file (FULL SET)
const ALL_TRANSLATIONS: Translation[] = [
  // Chat Interface
  { key: 'chat.welcome.title', en: 'Welcome to EVA Chat', fr: 'Bienvenue au clavardage EVA', category: 'chat' },
  { key: 'chat.welcome.subtitle', en: 'Ask questions about Employment Insurance', fr: 'Posez des questions sur l\'assurance-emploi', category: 'chat' },
  { key: 'chat.input.placeholder', en: 'Type your question here...', fr: 'Tapez votre question ici...', category: 'chat' },
  { key: 'chat.input.label', en: 'Message input', fr: 'Saisie du message', category: 'chat' },
  { key: 'chat.input.hint', en: 'Press Enter to send, Shift+Enter for new line', fr: 'Appuyez sur Entrée pour envoyer, Maj+Entrée pour nouvelle ligne', category: 'chat' },
  { key: 'chat.button.send', en: 'Send', fr: 'Envoyer', category: 'chat' },
  { key: 'chat.input.clear', en: 'Clear chat', fr: 'Effacer la conversation', category: 'chat' },
  { key: 'chat.message.you', en: 'You', fr: 'Vous', category: 'chat' },
  { key: 'chat.message.generating', en: 'Generating response...', fr: 'Génération de la réponse...', category: 'chat' },
  { key: 'chat.loading', en: 'Loading...', fr: 'Chargement...', category: 'chat' },
  { key: 'chat.empty.title', en: 'Start a conversation', fr: 'Commencez une conversation', category: 'chat' },
  { key: 'chat.empty.subtitle', en: 'Ask me anything about Employment Insurance, case law, or legal questions.', fr: 'Demandez-moi n\'importe quoi sur l\'assurance-emploi, la jurisprudence ou les questions juridiques.', category: 'chat' },
  { key: 'chat.empty.suggestions', en: 'Try asking:', fr: 'Essayez de demander:', category: 'chat' },
  { key: 'chat.example.1', en: 'How do I apply for Employment Insurance?', fr: 'Comment puis-je faire une demande d\'assurance-emploi?', category: 'chat' },
  { key: 'chat.example.2', en: 'What are the eligibility requirements?', fr: 'Quelles sont les conditions d\'admissibilité?', category: 'chat' },
  { key: 'chat.example.3', en: 'Find case law about reasonable cause', fr: 'Trouvez la jurisprudence sur le motif valable', category: 'chat' },
  { key: 'chat.error.network', en: 'Network error. Please try again.', fr: 'Erreur réseau. Veuillez réessayer.', category: 'errors' },
  { key: 'chat.error.server', en: 'Server error. Please contact support.', fr: 'Erreur du serveur. Veuillez contacter le support.', category: 'errors' },
  
  // Navigation
  { key: 'nav.chat', en: 'Chat', fr: 'Clavardage', category: 'navigation' },
  { key: 'nav.documents', en: 'Documents', fr: 'Documents', category: 'navigation' },
  { key: 'nav.admin', en: 'Admin', fr: 'Admin', category: 'navigation' },
  { key: 'nav.settings', en: 'Settings', fr: 'Paramètres', category: 'navigation' },
  { key: 'nav.logout', en: 'Logout', fr: 'Déconnexion', category: 'navigation' },
  
  // Common
  { key: 'common.loading', en: 'Loading...', fr: 'Chargement...', category: 'common' },
  { key: 'common.save', en: 'Save', fr: 'Enregistrer', category: 'common' },
  { key: 'common.cancel', en: 'Cancel', fr: 'Annuler', category: 'common' },
  { key: 'common.delete', en: 'Delete', fr: 'Supprimer', category: 'common' },
  { key: 'common.edit', en: 'Edit', fr: 'Modifier', category: 'common' },
  { key: 'common.close', en: 'Close', fr: 'Fermer', category: 'common' },
  { key: 'common.yes', en: 'Yes', fr: 'Oui', category: 'common' },
  { key: 'common.no', en: 'No', fr: 'Non', category: 'common' },
  { key: 'common.languages.en', en: 'English', fr: 'Anglais', category: 'common' },
  { key: 'common.languages.fr', en: 'French', fr: 'Français', category: 'common' },
  
  // Admin - Complete set
  { key: 'admin.title', en: 'Content Management', fr: 'Gestion du contenu', category: 'admin' },
  { key: 'admin.translations.title', en: 'Translations', fr: 'Traductions', category: 'admin' },
  { key: 'admin.translations.key', en: 'Key', fr: 'Clé', category: 'admin' },
  { key: 'admin.translations.english', en: 'English', fr: 'Anglais', category: 'admin' },
  { key: 'admin.translations.french', en: 'French', fr: 'Français', category: 'admin' },
  { key: 'admin.translations.category', en: 'Category', fr: 'Catégorie', category: 'admin' },
  { key: 'admin.translations.search', en: 'Search translations...', fr: 'Rechercher des traductions...', category: 'admin' },
  { key: 'admin.bulk.import', en: 'Import CSV', fr: 'Importer CSV', category: 'admin' },
  { key: 'admin.bulk.export', en: 'Export CSV', fr: 'Exporter CSV', category: 'admin' },
  { key: 'admin.translationsPage.kicker', en: 'Operations', fr: 'Opérations', category: 'admin' },
  { key: 'admin.translationsPage.title', en: 'Multilingual Glossary', fr: 'Glossaire multilingue', category: 'admin' },
  { key: 'admin.translationsPage.subtitle', en: 'Review, filter, and update the keys powering every EVA experience.', fr: 'Passez en revue, filtrez et mettez à jour les clés qui alimentent toutes les expériences EVA.', category: 'admin' },
  { key: 'admin.translationsPage.languageToggle', en: 'Switch to {locale}', fr: 'Passer en {locale}', category: 'admin' },
  { key: 'admin.translationsPage.filters.ariaLabel', en: 'Filter translations', fr: 'Filtrer les traductions', category: 'admin' },
  { key: 'admin.translationsPage.filters.category', en: 'Category', fr: 'Catégorie', category: 'admin' },
  { key: 'admin.translationsPage.filters.categoryPlaceholder', en: 'Select category', fr: 'Choisir une catégorie', category: 'admin' },
  { key: 'admin.translationsPage.filters.categoryAll', en: 'All categories', fr: 'Toutes les catégories', category: 'admin' },
  { key: 'admin.translationsPage.filters.key', en: 'Key contains', fr: 'Clé contient', category: 'admin' },
  { key: 'admin.translationsPage.filters.keyPlaceholder', en: 'Search by key', fr: 'Rechercher par clé', category: 'admin' },
  { key: 'admin.translationsPage.filters.apply', en: 'Apply filters', fr: 'Appliquer les filtres', category: 'admin' },
  { key: 'admin.translationsPage.filters.reset', en: 'Reset', fr: 'Réinitialiser', category: 'admin' },
  { key: 'admin.translationsPage.import.label', en: 'Import CSV', fr: 'Importer un CSV', category: 'admin' },
  { key: 'admin.translationsPage.import.progress', en: 'Importing...', fr: 'Importation...', category: 'admin' },
  { key: 'admin.translationsPage.import.ariaLabel', en: 'Upload CSV file with translations', fr: 'Téléverser un fichier CSV de traductions', category: 'admin' },
  { key: 'admin.translationsPage.export.label', en: 'Download CSV', fr: 'Télécharger le CSV', category: 'admin' },
  // Settings Page (WI-3)
  { key: 'admin.settings.title', en: 'Settings', fr: 'Paramètres', category: 'admin' },
  { key: 'admin.settings.description', en: 'View and manage application configuration settings.', fr: 'Afficher et gérer les paramètres de configuration de l\'application.', category: 'admin' },
  { key: 'admin.settings.column.category', en: 'Category', fr: 'Catégorie', category: 'admin' },
  { key: 'admin.settings.column.key', en: 'Key', fr: 'Clé', category: 'admin' },
  { key: 'admin.settings.column.description', en: 'Description', fr: 'Description', category: 'admin' },
  { key: 'admin.settings.column.value', en: 'Value', fr: 'Valeur', category: 'admin' },
  { key: 'admin.settings.column.valueType', en: 'Type', fr: 'Type', category: 'admin' },
  { key: 'admin.settings.column.isPublic', en: 'Visibility', fr: 'Visibilité', category: 'admin' },
  { key: 'admin.settings.filter.category', en: 'Category', fr: 'Catégorie', category: 'admin' },
  { key: 'admin.settings.filter.category.all', en: 'All categories', fr: 'Toutes les catégories', category: 'admin' },
  { key: 'admin.settings.action.edit', en: 'Edit', fr: 'Modifier', category: 'admin' },
  { key: 'admin.settings.badge.public', en: 'Public', fr: 'Public', category: 'admin' },
  { key: 'admin.settings.badge.internal', en: 'Internal', fr: 'Interne', category: 'admin' },
  { key: 'admin.settings.state.empty', en: 'No settings found.', fr: 'Aucun paramètre trouvé.', category: 'admin' },
  { key: 'admin.settings.error.fetch', en: 'Failed to load settings. Please try again.', fr: 'Échec du chargement des paramètres. Veuillez réessayer.', category: 'admin' },
  // admin.apps.* — WI-4 AppsPage seeds
  { key: 'admin.apps.title', en: 'App Registry', fr: 'Registre des applications', category: 'admin' },
  { key: 'admin.apps.description', en: 'Manage registered AI assistant applications.', fr: 'G\u00e9rez les applications d\'assistant IA enregistr\u00e9es.', category: 'admin' },
  { key: 'admin.apps.column.title', en: 'Title', fr: 'Titre', category: 'admin' },
  { key: 'admin.apps.column.description', en: 'Description', fr: 'Description', category: 'admin' },
  { key: 'admin.apps.column.visibility', en: 'Visibility', fr: 'Visibilité', category: 'admin' },
  { key: 'admin.apps.column.costCenter', en: 'Cost Centre', fr: 'Centre de coûts', category: 'admin' },
  { key: 'admin.apps.column.disabled', en: 'Status', fr: 'Statut', category: 'admin' },
  { key: 'admin.apps.column.updatedAt', en: 'Updated', fr: 'Mis à jour', category: 'admin' },
  { key: 'admin.apps.filter.q', en: 'Search', fr: 'Rechercher', category: 'admin' },
  { key: 'admin.apps.filter.q.placeholder', en: 'Search by title, ID or description…', fr: 'Rechercher par titre, ID ou description…', category: 'admin' },
  { key: 'admin.apps.filter.visibility', en: 'Visibility', fr: 'Visibilité', category: 'admin' },
  { key: 'admin.apps.filter.visibility.all', en: 'All', fr: 'Tous', category: 'admin' },
  { key: 'admin.apps.filter.visibility.public', en: 'Public', fr: 'Public', category: 'admin' },
  { key: 'admin.apps.filter.visibility.private', en: 'Private', fr: 'Privé', category: 'admin' },
  { key: 'admin.apps.action.add', en: 'Add App', fr: 'Ajouter une application', category: 'admin' },
  { key: 'admin.apps.action.edit', en: 'Edit', fr: 'Modifier', category: 'admin' },
  { key: 'admin.apps.action.disable', en: 'Disable', fr: 'Désactiver', category: 'admin' },
  { key: 'admin.apps.action.cancel', en: 'Cancel', fr: 'Annuler', category: 'admin' },
  { key: 'admin.apps.action.export', en: 'Export JSON', fr: 'Exporter JSON', category: 'admin' },
  { key: 'admin.apps.confirm.disable', en: 'Disable application?', fr: 'D\u00e9sactiver l\'application ?', category: 'admin' },
  { key: 'admin.apps.confirm.disable.description', en: 'This will prevent users from accessing the application. You can re-enable it later.', fr: 'Cela emp\u00eachera les utilisateurs d\'acc\u00e9der \u00e0 l\'application. Vous pouvez la r\u00e9activer plus tard.', category: 'admin' },
  { key: 'admin.apps.badge.public', en: 'Public', fr: 'Public', category: 'admin' },
  { key: 'admin.apps.badge.private', en: 'Private', fr: 'Privé', category: 'admin' },
  { key: 'admin.apps.badge.active', en: 'Active', fr: 'Actif', category: 'admin' },
  { key: 'admin.apps.badge.disabled', en: 'Disabled', fr: 'Désactivé', category: 'admin' },
  { key: 'admin.apps.state.empty', en: 'No applications found.', fr: 'Aucune application trouvée.', category: 'admin' },
  { key: 'admin.apps.error.fetch', en: 'Failed to load applications. Please try again.', fr: 'Échec du chargement des applications. Veuillez réessayer.', category: 'admin' },
  // admin.rbac.* — WI-9 RbacPage seeds
  { key: 'admin.rbac.title', en: 'Role Assignments', fr: 'Attributions de rôles', category: 'admin' },
  { key: 'admin.rbac.description', en: 'Manage user role assignments for EVA applications.', fr: 'Gérez les attributions de rôles pour les applications EVA.', category: 'admin' },
  { key: 'admin.rbac.column.displayName', en: 'Name', fr: 'Nom', category: 'admin' },
  { key: 'admin.rbac.column.email', en: 'Email', fr: 'Courriel', category: 'admin' },
  { key: 'admin.rbac.column.role', en: 'Role', fr: 'Rôle', category: 'admin' },
  { key: 'admin.rbac.column.scope', en: 'Scope', fr: 'Portée', category: 'admin' },
  { key: 'admin.rbac.column.enabled', en: 'Status', fr: 'Statut', category: 'admin' },
  { key: 'admin.rbac.column.updatedAt', en: 'Updated', fr: 'Mis à jour', category: 'admin' },
  { key: 'admin.rbac.filter.role', en: 'Role', fr: 'Rôle', category: 'admin' },
  { key: 'admin.rbac.filter.role.all', en: 'All roles', fr: 'Tous les rôles', category: 'admin' },
  { key: 'admin.rbac.filter.role.admin', en: 'Admin', fr: 'Admin', category: 'admin' },
  { key: 'admin.rbac.filter.role.editor', en: 'Editor', fr: 'Éditeur', category: 'admin' },
  { key: 'admin.rbac.filter.role.viewer', en: 'Viewer', fr: 'Lecteur', category: 'admin' },
  { key: 'admin.rbac.filter.scope', en: 'Scope', fr: 'Portée', category: 'admin' },
  { key: 'admin.rbac.filter.scope.all', en: 'All scopes', fr: 'Toutes les portées', category: 'admin' },
  { key: 'admin.rbac.filter.scope.global', en: 'Global', fr: 'Global', category: 'admin' },
  { key: 'admin.rbac.filter.scope.jurisprudence', en: 'Jurisprudence', fr: 'Jurisprudence', category: 'admin' },
  { key: 'admin.rbac.filter.scope.finops', en: 'FinOps', fr: 'FinOps', category: 'admin' },
  { key: 'admin.rbac.action.assign', en: 'Assign Role', fr: 'Attribuer un rôle', category: 'admin' },
  { key: 'admin.rbac.action.edit', en: 'Edit', fr: 'Modifier', category: 'admin' },
  { key: 'admin.rbac.badge.admin', en: 'Admin', fr: 'Admin', category: 'admin' },
  { key: 'admin.rbac.badge.editor', en: 'Editor', fr: 'Éditeur', category: 'admin' },
  { key: 'admin.rbac.badge.viewer', en: 'Viewer', fr: 'Lecteur', category: 'admin' },
  { key: 'admin.rbac.badge.enabled', en: 'Active', fr: 'Actif', category: 'admin' },
  { key: 'admin.rbac.badge.disabled', en: 'Inactive', fr: 'Inactif', category: 'admin' },
  { key: 'admin.rbac.state.empty', en: 'No role assignments found.', fr: 'Aucune attribution de rôle trouvée.', category: 'admin' },
  { key: 'admin.rbac.error.fetch', en: 'Failed to load role assignments. Please try again.', fr: 'Échec du chargement des attributions. Veuillez réessayer.', category: 'admin' },
  // admin.auditLogs.* — WI-10 AuditLogsPage seeds
  { key: 'admin.auditLogs.title', en: 'Audit Logs', fr: 'Journaux d\'audit', category: 'admin' },
  { key: 'admin.auditLogs.description', en: 'View a tamper-evident record of administrative actions.', fr: 'Consultez un registre infalsifiable des actions administratives.', category: 'admin' },
  { key: 'admin.auditLogs.column.timestamp', en: 'Timestamp', fr: 'Horodatage', category: 'admin' },
  { key: 'admin.auditLogs.column.actor', en: 'Actor', fr: 'Acteur', category: 'admin' },
  { key: 'admin.auditLogs.column.entityType', en: 'Entity', fr: 'Entité', category: 'admin' },
  { key: 'admin.auditLogs.column.action', en: 'Action', fr: 'Action', category: 'admin' },
  { key: 'admin.auditLogs.column.outcome', en: 'Outcome', fr: 'Résultat', category: 'admin' },
  { key: 'admin.auditLogs.filter.entityType', en: 'Entity', fr: 'Entité', category: 'admin' },
  { key: 'admin.auditLogs.filter.entityType.all', en: 'All entities', fr: 'Toutes les entités', category: 'admin' },
  { key: 'admin.auditLogs.filter.entityType.app', en: 'App', fr: 'Application', category: 'admin' },
  { key: 'admin.auditLogs.filter.entityType.setting', en: 'Setting', fr: 'Paramètre', category: 'admin' },
  { key: 'admin.auditLogs.filter.entityType.rbac', en: 'RBAC', fr: 'RBAC', category: 'admin' },
  { key: 'admin.auditLogs.filter.outcome', en: 'Outcome', fr: 'Résultat', category: 'admin' },
  { key: 'admin.auditLogs.filter.outcome.all', en: 'All outcomes', fr: 'Tous les résultats', category: 'admin' },
  { key: 'admin.auditLogs.filter.outcome.success', en: 'Success', fr: 'Succès', category: 'admin' },
  { key: 'admin.auditLogs.filter.outcome.failure', en: 'Failure', fr: 'Échec', category: 'admin' },
  { key: 'admin.auditLogs.filter.actor', en: 'Actor contains', fr: 'Acteur contient', category: 'admin' },
  { key: 'admin.auditLogs.filter.actor.placeholder', en: 'Search by email…', fr: 'Rechercher par courriel…', category: 'admin' },
  { key: 'admin.auditLogs.badge.success', en: 'Success', fr: 'Succès', category: 'admin' },
  { key: 'admin.auditLogs.badge.failure', en: 'Failure', fr: 'Échec', category: 'admin' },
  { key: 'admin.auditLogs.state.empty', en: 'No audit log entries found.', fr: 'Aucune entr\u00e9e de journal d\'audit trouv\u00e9e.', category: 'admin' },
  { key: 'admin.auditLogs.error.fetch', en: 'Failed to load audit logs. Please try again.', fr: '\u00c9chec du chargement des journaux. Veuillez r\u00e9essayer.', category: 'admin' },
  // admin.ingestionRuns.* -- WI-12 IngestionRunsPage seeds
  { key: 'admin.ingestionRuns.title', en: 'Ingestion Runs', fr: 'Ex\u00e9cutions d\'ingestion', category: 'admin' },
  { key: 'admin.ingestionRuns.description', en: 'Monitor and manage document ingestion pipeline runs.', fr: 'Surveillez et g\u00e9rez les ex\u00e9cutions du pipeline d\'ingestion de documents.', category: 'admin' },
  { key: 'admin.ingestionRuns.column.runId', en: 'Run ID', fr: 'ID d\'ex\u00e9cution', category: 'admin' },
  { key: 'admin.ingestionRuns.column.status', en: 'Status', fr: 'Statut', category: 'admin' },
  { key: 'admin.ingestionRuns.column.startedAt', en: 'Started', fr: 'D\u00e9marr\u00e9 le', category: 'admin' },
  { key: 'admin.ingestionRuns.column.completedAt', en: 'Completed', fr: 'Termin\u00e9 le', category: 'admin' },
  { key: 'admin.ingestionRuns.column.documentCount', en: 'Documents', fr: 'Documents', category: 'admin' },
  { key: 'admin.ingestionRuns.column.actions', en: 'Actions', fr: 'Actions', category: 'admin' },
  { key: 'admin.ingestionRuns.action.trigger', en: 'Trigger Run', fr: 'D\u00e9clencher une ex\u00e9cution', category: 'admin' },
  { key: 'admin.ingestionRuns.action.cancel', en: 'Cancel', fr: 'Annuler', category: 'admin' },
  { key: 'admin.ingestionRuns.state.empty', en: 'No ingestion runs found.', fr: 'Aucune ex\u00e9cution d\'ingestion trouv\u00e9e.', category: 'admin' },
  { key: 'admin.ingestionRuns.status.pending', en: 'Pending', fr: 'En attente', category: 'admin' },
  { key: 'admin.ingestionRuns.status.running', en: 'Running', fr: 'En cours', category: 'admin' },
  { key: 'admin.ingestionRuns.status.completed', en: 'Completed', fr: 'Termin\u00e9', category: 'admin' },
  { key: 'admin.ingestionRuns.status.failed', en: 'Failed', fr: '\u00c9chou\u00e9', category: 'admin' },
  { key: 'admin.ingestionRuns.status.cancelled', en: 'Cancelled', fr: 'Annul\u00e9', category: 'admin' },
  { key: 'admin.ingestionRuns.dialog.trigger.title', en: 'Trigger Ingestion Run', fr: 'D\u00e9clencher une ex\u00e9cution d\'ingestion', category: 'admin' },
  { key: 'admin.ingestionRuns.dialog.trigger.body', en: 'This will start a new document ingestion run immediately. Proceed?', fr: 'Cela d\u00e9marrera imm\u00e9diatement une nouvelle ex\u00e9cution d\'ingestion. Continuer?', category: 'admin' },
  { key: 'admin.ingestionRuns.dialog.trigger.confirm', en: 'Trigger', fr: 'D\u00e9clencher', category: 'admin' },
  { key: 'admin.ingestionRuns.dialog.trigger.cancel', en: 'Cancel', fr: 'Annuler', category: 'admin' },
  { key: 'admin.ingestionRuns.error.fetch', en: 'Failed to load ingestion runs. Please try again.', fr: '\u00c9chec du chargement des ex\u00e9cutions. Veuillez r\u00e9essayer.', category: 'admin' },
  { key: 'admin.ingestionRuns.error.trigger', en: 'Failed to trigger ingestion run.', fr: '\u00c9chec du d\u00e9clenchement de l\'ex\u00e9cution d\'ingestion.', category: 'admin' },
  { key: 'admin.ingestionRuns.error.cancel', en: 'Failed to cancel ingestion run.', fr: '\u00c9chec de l\'annulation de l\'ex\u00e9cution d\'ingestion.', category: 'admin' },
  // admin.searchHealth.* -- WI-13 SearchHealthPage seeds
  { key: 'admin.searchHealth.title', en: 'Search Index Health', fr: 'Sant\u00e9 des index de recherche', category: 'admin' },
  { key: 'admin.searchHealth.description', en: 'Monitor Azure AI Search index health and trigger reindex operations.', fr: 'Surveillez la sant\u00e9 des index Azure AI Search et d\u00e9clenchez des r\u00e9indexations.', category: 'admin' },
  { key: 'admin.searchHealth.column.indexName', en: 'Index Name', fr: 'Nom de l\'index', category: 'admin' },
  { key: 'admin.searchHealth.column.status', en: 'Status', fr: 'Statut', category: 'admin' },
  { key: 'admin.searchHealth.column.healthScore', en: 'Health Score', fr: 'Score de sant\u00e9', category: 'admin' },
  { key: 'admin.searchHealth.column.docCount', en: 'Documents', fr: 'Documents', category: 'admin' },
  { key: 'admin.searchHealth.column.lastIndexed', en: 'Last Indexed', fr: 'Derni\u00e8re indexation', category: 'admin' },
  { key: 'admin.searchHealth.column.actions', en: 'Actions', fr: 'Actions', category: 'admin' },
  { key: 'admin.searchHealth.action.reindex', en: 'Reindex', fr: 'R\u00e9indexer', category: 'admin' },
  { key: 'admin.searchHealth.state.empty', en: 'No search indexes found.', fr: 'Aucun index de recherche trouv\u00e9.', category: 'admin' },
  { key: 'admin.searchHealth.status.healthy', en: 'Healthy', fr: 'En bonne sant\u00e9', category: 'admin' },
  { key: 'admin.searchHealth.status.degraded', en: 'Degraded', fr: 'D\u00e9grad\u00e9', category: 'admin' },
  { key: 'admin.searchHealth.status.error', en: 'Error', fr: 'Erreur', category: 'admin' },
  { key: 'admin.searchHealth.dialog.reindex.title', en: 'Reindex Confirmation', fr: 'Confirmation de r\u00e9indexation', category: 'admin' },
  { key: 'admin.searchHealth.dialog.reindex.body', en: 'This will trigger a full reindex of the selected index. The operation may take several minutes.', fr: 'Cela d\u00e9clenchera une r\u00e9indexation compl\u00e8te de l\'index s\u00e9lectionn\u00e9. L\'op\u00e9ration peut prendre plusieurs minutes.', category: 'admin' },
  { key: 'admin.searchHealth.dialog.reindex.confirm', en: 'Reindex', fr: 'R\u00e9indexer', category: 'admin' },
  { key: 'admin.searchHealth.dialog.reindex.cancel', en: 'Cancel', fr: 'Annuler', category: 'admin' },
  { key: 'admin.searchHealth.error.fetch', en: 'Failed to load search index health. Please try again.', fr: '\u00c9chec du chargement de la sant\u00e9 des index. Veuillez r\u00e9essayer.', category: 'admin' },
  { key: 'admin.searchHealth.error.reindex', en: 'Failed to trigger reindex. Please try again.', fr: '\u00c9chec du d\u00e9clenchement de la r\u00e9indexation. Veuillez r\u00e9essayer.', category: 'admin' },
  // admin.supportTickets.* -- WI-14 SupportTicketsPage seeds
  { key: 'admin.supportTickets.title', en: 'Support Tickets', fr: 'Billets d\'assistance', category: 'admin' },
  { key: 'admin.supportTickets.description', en: 'View and manage help desk support tickets.', fr: 'Consultez et g\u00e9rez les billets d\'assistance du centre d\'aide.', category: 'admin' },
  { key: 'admin.supportTickets.column.ticketId', en: 'Ticket ID', fr: 'ID du billet', category: 'admin' },
  { key: 'admin.supportTickets.column.title', en: 'Title', fr: 'Titre', category: 'admin' },
  { key: 'admin.supportTickets.column.status', en: 'Status', fr: 'Statut', category: 'admin' },
  { key: 'admin.supportTickets.column.priority', en: 'Priority', fr: 'Priorit\u00e9', category: 'admin' },
  { key: 'admin.supportTickets.column.createdAt', en: 'Created', fr: 'Cr\u00e9\u00e9 le', category: 'admin' },
  { key: 'admin.supportTickets.column.assignedTo', en: 'Assigned To', fr: 'Assign\u00e9 \u00e0', category: 'admin' },
  { key: 'admin.supportTickets.state.empty', en: 'No support tickets found.', fr: 'Aucun billet d\'assistance trouv\u00e9.', category: 'admin' },
  { key: 'admin.supportTickets.status.open', en: 'Open', fr: 'Ouvert', category: 'admin' },
  { key: 'admin.supportTickets.status.inprogress', en: 'In Progress', fr: 'En cours', category: 'admin' },
  { key: 'admin.supportTickets.status.resolved', en: 'Resolved', fr: 'R\u00e9solu', category: 'admin' },
  { key: 'admin.supportTickets.priority.high', en: 'High', fr: '\u00c9lev\u00e9e', category: 'admin' },
  { key: 'admin.supportTickets.priority.medium', en: 'Medium', fr: 'Moyenne', category: 'admin' },
  { key: 'admin.supportTickets.priority.low', en: 'Low', fr: 'Faible', category: 'admin' },
  { key: 'admin.supportTickets.filter.status', en: 'Status', fr: 'Statut', category: 'admin' },
  { key: 'admin.supportTickets.filter.status.all', en: 'All statuses', fr: 'Tous les statuts', category: 'admin' },
  { key: 'admin.supportTickets.filter.status.open', en: 'Open', fr: 'Ouvert', category: 'admin' },
  { key: 'admin.supportTickets.filter.status.inProgress', en: 'In Progress', fr: 'En cours', category: 'admin' },
  { key: 'admin.supportTickets.filter.status.resolved', en: 'Resolved', fr: 'R\u00e9solu', category: 'admin' },
  { key: 'admin.supportTickets.filter.priority', en: 'Priority', fr: 'Priorit\u00e9', category: 'admin' },
  { key: 'admin.supportTickets.filter.priority.all', en: 'All priorities', fr: 'Toutes les priorit\u00e9s', category: 'admin' },
  { key: 'admin.supportTickets.filter.priority.high', en: 'High', fr: '\u00c9lev\u00e9e', category: 'admin' },
  { key: 'admin.supportTickets.filter.priority.medium', en: 'Medium', fr: 'Moyenne', category: 'admin' },
  { key: 'admin.supportTickets.filter.priority.low', en: 'Low', fr: 'Faible', category: 'admin' },
  { key: 'admin.supportTickets.error.fetch', en: 'Failed to load support tickets. Please try again.', fr: '\u00c9chec du chargement des billets. Veuillez r\u00e9essayer.', category: 'admin' },
  { key: 'admin.supportTickets.error.update', en: 'Failed to update support ticket.', fr: '\u00c9chec de la mise \u00e0 jour du billet.', category: 'admin' },
  // admin.featureFlags.* -- WI-15 FeatureFlagsPage seeds
  { key: 'admin.featureFlags.title', en: 'Feature Flags', fr: 'Indicateurs de fonctionnalit\u00e9', category: 'admin' },
  { key: 'admin.featureFlags.description', en: 'Manage feature toggles to control EVA platform capabilities.', fr: 'G\u00e9rez les bascules de fonctionnalit\u00e9 pour contr\u00f4ler les capacit\u00e9s de la plateforme EVA.', category: 'admin' },
  { key: 'admin.featureFlags.column.flagKey', en: 'Flag Key', fr: 'Cl\u00e9 d\'indicateur', category: 'admin' },
  { key: 'admin.featureFlags.column.label', en: 'Label', fr: '\u00c9tiquette', category: 'admin' },
  { key: 'admin.featureFlags.column.enabled', en: 'Status', fr: 'Statut', category: 'admin' },
  { key: 'admin.featureFlags.column.description', en: 'Description', fr: 'Description', category: 'admin' },
  { key: 'admin.featureFlags.column.modifiedBy', en: 'Modified By', fr: 'Modifi\u00e9 par', category: 'admin' },
  { key: 'admin.featureFlags.column.actions', en: 'Actions', fr: 'Actions', category: 'admin' },
  { key: 'admin.featureFlags.badge.enabled', en: 'Enabled', fr: 'Activ\u00e9', category: 'admin' },
  { key: 'admin.featureFlags.badge.disabled', en: 'Disabled', fr: 'D\u00e9sactiv\u00e9', category: 'admin' },
  { key: 'admin.featureFlags.action.enable', en: 'Enable', fr: 'Activer', category: 'admin' },
  { key: 'admin.featureFlags.action.disable', en: 'Disable', fr: 'D\u00e9sactiver', category: 'admin' },
  { key: 'admin.featureFlags.state.empty', en: 'No feature flags found.', fr: 'Aucun indicateur de fonctionnalit\u00e9 trouv\u00e9.', category: 'admin' },
  { key: 'admin.featureFlags.error.fetch', en: 'Failed to load feature flags. Please try again.', fr: '\u00c9chec du chargement des indicateurs. Veuillez r\u00e9essayer.', category: 'admin' },
  { key: 'admin.featureFlags.error.toggle', en: 'Failed to toggle feature flag.', fr: '\u00c9chec du basculement de l\'indicateur de fonctionnalit\u00e9.', category: 'admin' },
  // admin.rbacRoles.* -- WI-16 RbacRolesPage seeds
  { key: 'admin.rbacRoles.title', en: 'RBAC Roles', fr: 'R\u00f4les RBAC', category: 'admin' },
  { key: 'admin.rbacRoles.description', en: 'Manage role definitions, permissions, and assignments.', fr: 'G\u00e9rez les d\u00e9finitions de r\u00f4les, les autorisations et les attributions.', category: 'admin' },
  { key: 'admin.rbacRoles.column.name', en: 'Role Name', fr: 'Nom du r\u00f4le', category: 'admin' },
  { key: 'admin.rbacRoles.column.description', en: 'Description', fr: 'Description', category: 'admin' },
  { key: 'admin.rbacRoles.column.permissions', en: 'Permissions', fr: 'Autorisations', category: 'admin' },
  { key: 'admin.rbacRoles.column.userCount', en: 'Users', fr: 'Utilisateurs', category: 'admin' },
  { key: 'admin.rbacRoles.action.create', en: 'Create Role', fr: 'Cr\u00e9er un r\u00f4le', category: 'admin' },
  { key: 'admin.rbacRoles.action.delete', en: 'Delete', fr: 'Supprimer', category: 'admin' },
  { key: 'admin.rbacRoles.state.empty', en: 'No roles found.', fr: 'Aucun r\u00f4le trouv\u00e9.', category: 'admin' },
  { key: 'admin.rbacRoles.dialog.create.title', en: 'Create New Role', fr: 'Cr\u00e9er un nouveau r\u00f4le', category: 'admin' },
  { key: 'admin.rbacRoles.dialog.create.confirm', en: 'Create', fr: 'Cr\u00e9er', category: 'admin' },
  { key: 'admin.rbacRoles.dialog.create.cancel', en: 'Cancel', fr: 'Annuler', category: 'admin' },
  { key: 'admin.rbacRoles.field.name', en: 'Role Name', fr: 'Nom du r\u00f4le', category: 'admin' },
  { key: 'admin.rbacRoles.field.description', en: 'Description', fr: 'Description', category: 'admin' },
  { key: 'admin.rbacRoles.dialog.delete.title', en: 'Delete Role', fr: 'Supprimer le r\u00f4le', category: 'admin' },
  { key: 'admin.rbacRoles.dialog.delete.body', en: 'Are you sure you want to delete this role? This action cannot be undone.', fr: '\u00cates-vous s\u00fbr de vouloir supprimer ce r\u00f4le? Cette action est irr\u00e9versible.', category: 'admin' },
  { key: 'admin.rbacRoles.dialog.delete.confirm', en: 'Delete', fr: 'Supprimer', category: 'admin' },
  { key: 'admin.rbacRoles.dialog.delete.cancel', en: 'Cancel', fr: 'Annuler', category: 'admin' },
  { key: 'admin.rbacRoles.dialog.deleteBlocked.title', en: 'Cannot Delete Role', fr: 'Impossible de supprimer le r\u00f4le', category: 'admin' },
  { key: 'admin.rbacRoles.dialog.deleteBlocked.body', en: 'This role is currently assigned to one or more users. Remove all user assignments before deleting.', fr: 'Ce r\u00f4le est actuellement attribu\u00e9 \u00e0 un ou plusieurs utilisateurs. Supprimez toutes les attributions avant de supprimer.', category: 'admin' },
  { key: 'admin.rbacRoles.dialog.deleteBlocked.ok', en: 'OK', fr: 'OK', category: 'admin' },
  { key: 'admin.rbacRoles.error.fetch', en: 'Failed to load roles. Please try again.', fr: '\u00c9chec du chargement des r\u00f4les. Veuillez r\u00e9essayer.', category: 'admin' },
  { key: 'admin.rbacRoles.error.create', en: 'Failed to create role.', fr: '\u00c9chec de la cr\u00e9ation du r\u00f4le.', category: 'admin' },
  { key: 'admin.rbacRoles.error.update', en: 'Failed to update role.', fr: '\u00c9chec de la mise \u00e0 jour du r\u00f4le.', category: 'admin' },
  { key: 'admin.rbacRoles.error.delete', en: 'Failed to delete role.', fr: '\u00c9chec de la suppression du r\u00f4le.', category: 'admin' },
];

const MOCK_SETTINGS = {
  'chat.max_message_length': 4000,
  'chat.enable_streaming': true,
  'features.enable_translator': true,
  'features.enable_documents': true,
  'ui.default_language': 'en',
  'ui.show_welcome_message': true,
};

// Mock Settings for Admin Settings Page
const ALL_SETTINGS = [
  { key: 'max_tokens', category: 'chat', value: '4096', valueType: 'number', isPublic: true, description: 'Maximum tokens for chat completion' },
  { key: 'temperature', category: 'chat', value: '0.7', valueType: 'number', isPublic: true, description: 'Temperature for chat generation' },
  { key: 'top_p', category: 'chat', value: '0.95', valueType: 'number', isPublic: true, description: 'Top-p sampling parameter' },
  { key: 'enable_streaming', category: 'chat', value: 'true', valueType: 'boolean', isPublic: true, description: 'Enable streaming responses' },
  { key: 'max_message_length', category: 'chat', value: '4000', valueType: 'number', isPublic: true, description: 'Maximum message length' },
  { key: 'enable_debug', category: 'system', value: 'false', valueType: 'boolean', isPublic: false, description: 'Enable debug logging' },
  { key: 'log_level', category: 'system', value: 'info', valueType: 'string', isPublic: false, description: 'Logging level (debug, info, warn, error)' },
  { key: 'api_version', category: 'system', value: '2.0.0', valueType: 'string', isPublic: true, description: 'API version' },
  { key: 'max_concurrent_requests', category: 'system', value: '10', valueType: 'number', isPublic: false, description: 'Maximum concurrent API requests' },
  { key: 'enable_translator', category: 'features', value: 'true', valueType: 'boolean', isPublic: true, description: 'Enable translation feature' },
  { key: 'enable_documents', category: 'features', value: 'true', valueType: 'boolean', isPublic: true, description: 'Enable documents retrieval' },
  { key: 'enable_citations', category: 'features', value: 'true', valueType: 'boolean', isPublic: true, description: 'Enable citation links' },
  { key: 'feature_flags', category: 'features', value: '{"chat": true, "retrieval": true, "admin": true}', valueType: 'json', isPublic: false, description: 'Feature flags configuration' },
  { key: 'default_language', category: 'ui', value: 'en', valueType: 'string', isPublic: true, description: 'Default language (en/fr)' },
  { key: 'show_welcome_message', category: 'ui', value: 'true', valueType: 'boolean', isPublic: true, description: 'Show welcome message on start' },
  { key: 'theme', category: 'ui', value: 'light', valueType: 'string', isPublic: true, description: 'UI theme (light/dark)' },
];

// Mock Apps for App Registry Page
const ALL_APPS = [
  {
    appId: 'app-001',
    title: 'EVA Jurisprudence',
    description: 'Employment Insurance case law search and analysis',
    visibility: 'public' as const,
    systemPrompt: 'You are an expert in Employment Insurance law and case precedents.',
    costCenter: 'ESDC-EVA-001',
    owners: ['john.doe@esdc.gc.ca', 'jane.smith@esdc.gc.ca'],
    tags: ['legal', 'case-law', 'ei'],
    uiBannerKey: 'apps.eva_jurisprudence.banner',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    appId: 'app-002',
    title: 'EVA Assistant',
    description: 'General-purpose Government of Canada assistant',
    visibility: 'public' as const,
    costCenter: 'ESDC-EVA-002',
    owners: ['admin@esdc.gc.ca'],
    tags: ['general', 'assistance'],
    createdAt: '2024-02-01T14:30:00Z',
  },
  {
    appId: 'app-003',
    title: 'FinOps Analyzer',
    description: 'Internal cost optimization and resource analysis',
    visibility: 'private' as const,
    systemPrompt: 'You help analyze Azure spending and recommend optimizations.',
    costCenter: 'ESDC-FINOPS-001',
    owners: ['finops-team@esdc.gc.ca'],
    tags: ['internal', 'finops', 'cost-management'],
    createdAt: '2024-03-10T09:15:00Z',
  },
  {
    appId: 'app-004',
    title: 'Document Data Extractor',
    description: 'Extract structured data from government forms',
    visibility: 'private' as const,
    costCenter: 'ESDC-DOC-001',
    owners: ['doc-team@esdc.gc.ca'],
    tags: ['internal', 'ocr', 'extraction'],
    uiBannerKey: 'apps.doc_extractor.banner',
    createdAt: '2024-03-20T11:45:00Z',
  },
  {
    appId: 'app-005',
    title: 'Policy Q&A',
    description: 'Answer questions about internal policies',
    visibility: 'public' as const,
    costCenter: 'ESDC-POL-001',
    owners: ['policy@esdc.gc.ca'],
    tags: ['policy', 'guidance'],
    createdAt: '2024-04-01T08:00:00Z',
  },
];

// Mock RBAC Assignments for Role Management Page
const ALL_RBAC_ASSIGNMENTS = [
  {
    id: 'rbac-001',
    displayName: 'Alice Martin',
    email: 'alice.martin@esdc.gc.ca',
    role: 'EVA_ADMIN' as const,
    scope: 'global',
    enabled: true,
    updatedAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'rbac-002',
    displayName: 'Bob Tremblay',
    email: 'bob.tremblay@esdc.gc.ca',
    role: 'EVA_EDITOR' as const,
    scope: 'jurisprudence',
    enabled: true,
    updatedAt: '2026-01-20T14:30:00Z',
  },
  {
    id: 'rbac-003',
    displayName: 'Carol Nguyen',
    email: 'carol.nguyen@esdc.gc.ca',
    role: 'EVA_VIEWER' as const,
    scope: 'jurisprudence',
    enabled: true,
    updatedAt: '2026-01-25T11:15:00Z',
  },
  {
    id: 'rbac-004',
    displayName: 'David Osei',
    email: 'david.osei@esdc.gc.ca',
    role: 'EVA_EDITOR' as const,
    scope: 'finops',
    enabled: false,
    updatedAt: '2026-02-01T08:45:00Z',
  },
  {
    id: 'rbac-005',
    displayName: 'Emma Lavoie',
    email: 'emma.lavoie@esdc.gc.ca',
    role: 'EVA_VIEWER' as const,
    scope: 'global',
    enabled: true,
    updatedAt: '2026-02-10T16:00:00Z',
  },
];

// Mock Audit Logs for Audit Logs Page
const ALL_AUDIT_LOGS = [
  {
    id: 'audit-001',
    timestamp: '2026-02-20T05:00:00Z',
    actor: 'alice.martin@esdc.gc.ca',
    entityType: 'App',
    action: 'disable',
    outcome: 'success' as const,
    details: 'Disabled app-003 (FinOps Analyzer)',
  },
  {
    id: 'audit-002',
    timestamp: '2026-02-19T16:45:00Z',
    actor: 'bob.tremblay@esdc.gc.ca',
    entityType: 'Setting',
    action: 'update',
    outcome: 'success' as const,
    details: 'Updated max_tokens from 2048 to 4096',
  },
  {
    id: 'audit-003',
    timestamp: '2026-02-19T14:22:00Z',
    actor: 'carol.nguyen@esdc.gc.ca',
    entityType: 'RBAC',
    action: 'assign',
    outcome: 'success' as const,
    details: 'Assigned EVA_VIEWER to david.osei@esdc.gc.ca (scope: finops)',
  },
  {
    id: 'audit-004',
    timestamp: '2026-02-18T10:10:00Z',
    actor: 'unknown@esdc.gc.ca',
    entityType: 'App',
    action: 'create',
    outcome: 'failure' as const,
    details: 'Attempt to create app rejected — missing costCenter field',
  },
  {
    id: 'audit-005',
    timestamp: '2026-02-17T08:30:00Z',
    actor: 'alice.martin@esdc.gc.ca',
    entityType: 'RBAC',
    action: 'revoke',
    outcome: 'success' as const,
    details: 'Revoked EVA_EDITOR from david.osei@esdc.gc.ca',
  },
  {
    id: 'audit-006',
    timestamp: '2026-02-16T13:55:00Z',
    actor: 'emma.lavoie@esdc.gc.ca',
    entityType: 'Setting',
    action: 'update',
    outcome: 'failure' as const,
    details: 'Update to enable_debug blocked — insufficient permissions',
  },
];

const MOCK_USER = {
  displayName: 'Demo Admin',
  email: 'demo@esdc.gc.ca',
  roles: ['EVA_ADMIN', 'EVA_VIEWER'],
};

// ─── WI-12: Ingestion Runs mock data ────────────────────────────────────────
const ALL_INGESTION_RUNS = [
  { runId: 'run-001', status: 'completed', startedAt: '2026-02-19T02:00:00Z', completedAt: '2026-02-19T02:12:00Z', documentCount: 1842 },
  { runId: 'run-002', status: 'running',   startedAt: '2026-02-20T06:30:00Z', completedAt: null,                   documentCount: 320  },
  { runId: 'run-003', status: 'failed',    startedAt: '2026-02-18T18:00:00Z', completedAt: '2026-02-18T18:01:00Z', documentCount: 0    },
];

// ─── WI-13: Search Health mock data ─────────────────────────────────────────
const ALL_SEARCH_INDEXES = [
  { indexName: 'eva-jurisprudence-en', status: 'healthy',  docCount: 18420, lastIndexed: '2026-02-19T02:12:00Z', healthScore: 97 },
  { indexName: 'eva-jurisprudence-fr', status: 'degraded', docCount: 14210, lastIndexed: '2026-02-17T14:00:00Z', healthScore: 61 },
  { indexName: 'eva-policies',         status: 'error',    docCount: 0,     lastIndexed: '2026-01-30T09:00:00Z', healthScore: 12 },
];

// ─── WI-14: Support Tickets mock data ───────────────────────────────────────
const ALL_SUPPORT_TICKETS = [
  { ticketId: 'TKT-001', title: 'Cannot access chat widget',    status: 'open',        priority: 'high',   createdAt: '2026-02-18T08:00:00Z', assignedTo: '' },
  { ticketId: 'TKT-002', title: 'Translations page 404',        status: 'in-progress', priority: 'medium', createdAt: '2026-02-17T09:30:00Z', assignedTo: 'alice.martin@esdc.gc.ca' },
  { ticketId: 'TKT-003', title: 'Export CSV fails for 0 items', status: 'resolved',    priority: 'low',    createdAt: '2026-02-15T11:00:00Z', assignedTo: 'bob.tremblay@esdc.gc.ca' },
  { ticketId: 'TKT-004', title: 'Auth bypass flag ignored',     status: 'open',        priority: 'high',   createdAt: '2026-02-20T07:00:00Z', assignedTo: '' },
];

// ─── WI-15: Feature Flags mock data ─────────────────────────────────────────
const ALL_FEATURE_FLAGS = [
  { flagKey: 'feat.chat-session-state', label: 'Chat Session State',  enabled: true,  description: 'Persist chat session across page reloads',   lastModified: '2026-02-10T10:00:00Z', modifiedBy: 'alice.martin@esdc.gc.ca' },
  { flagKey: 'feat.eva-homepage',       label: 'EVA Homepage',        enabled: false, description: 'New homepage with product tile grid',        lastModified: '2026-02-14T14:00:00Z', modifiedBy: 'bob.tremblay@esdc.gc.ca' },
  { flagKey: 'feat.sprint-board',       label: 'Sprint Board',        enabled: false, description: 'ADO sprint board tab in admin-face',         lastModified: '2026-02-14T14:00:00Z', modifiedBy: 'bob.tremblay@esdc.gc.ca' },
  { flagKey: 'feat.audit-export',       label: 'Audit Export CSV',    enabled: true,  description: 'Allow audit log CSV export for admins',      lastModified: '2026-02-01T09:00:00Z', modifiedBy: 'carol.nguyen@esdc.gc.ca' },
  { flagKey: 'feat.dark-mode',          label: 'Dark Mode (Beta)',    enabled: false, description: 'Enable dark mode toggle in user settings',   lastModified: '2026-01-20T16:00:00Z', modifiedBy: 'alice.martin@esdc.gc.ca' },
];

// ─── WI-16: RBAC Roles mock data ────────────────────────────────────────────
const ALL_RBAC_ROLES = [
  { roleId: 'role-001', name: 'EVA_ADMIN',  description: 'Full administrative access', permissions: ['apps:write','translations:write','rbac:write','settings:write','audit:read','ingestion:write','flags:write'], userCount: 2  },
  { roleId: 'role-002', name: 'EVA_EDITOR', description: 'Content editing access',     permissions: ['apps:write','translations:write','audit:read'],                                                               userCount: 7  },
  { roleId: 'role-003', name: 'EVA_VIEWER', description: 'Read-only access',           permissions: ['apps:read','translations:read','audit:read'],                                                                userCount: 23 },
];

class MockBackendService {
  private initialized = false;

  private initialize(): void {
    if (this.initialized) return;

    if (!localStorage.getItem(STORAGE_KEYS.TRANSLATIONS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSLATIONS, JSON.stringify(ALL_TRANSLATIONS));
      console.log('✅ [Mock] Seeded 107 translations');
    }

    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(MOCK_SETTINGS));
      console.log('✅ [Mock] Seeded 6 settings');
    }

    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS_ADMIN)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS_ADMIN, JSON.stringify(ALL_SETTINGS));
      console.log('✅ [Mock] Seeded 16 admin settings');
    }

    if (!localStorage.getItem(STORAGE_KEYS.APPS)) {
      localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(ALL_APPS));
      console.log('✅ [Mock] Seeded 5 apps');
    }

    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(MOCK_USER));
    }

    if (!localStorage.getItem(STORAGE_KEYS.RBAC_ASSIGNMENTS)) {
      localStorage.setItem(STORAGE_KEYS.RBAC_ASSIGNMENTS, JSON.stringify(ALL_RBAC_ASSIGNMENTS));
      console.log('✅ [Mock] Seeded 5 RBAC assignments');
    }

    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(ALL_AUDIT_LOGS));
      console.log('✅ [Mock] Seeded 6 audit log entries');
    }

    this.initialized = true;
  }

  async getAllTranslations(): Promise<TranslationMap> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.TRANSLATIONS);
    const translations: Translation[] = raw ? JSON.parse(raw) : [];

    const map: TranslationMap = {};
    translations.forEach(t => {
      map[t.key] = { en: t.en, fr: t.fr };
    });

    console.log(`📦 [Mock] GET /api/translations/all - ${translations.length} keys`);
    return map;
  }

  async getTranslations(params?: {
    category?: string;
    keyContains?: string;
  }): Promise<{ translations: Translation[]; total: number }> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.TRANSLATIONS);
    let translations: Translation[] = raw ? JSON.parse(raw) : [];

    if (params?.category) {
      translations = translations.filter(t => t.category === params.category);
    }
    if (params?.keyContains) {
      const search = params.keyContains.toLowerCase();
      translations = translations.filter(t => t.key.toLowerCase().includes(search));
    }

    console.log(`📦 [Mock] GET /api/translations - ${translations.length} results`);
    return { translations, total: translations.length };
  }

  async bulkUpdateTranslations(
    updates: Array<{ key: string; en: string; fr: string; category?: string }>
  ): Promise<{ updated: number }> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.TRANSLATIONS);
    const translations: Translation[] = raw ? JSON.parse(raw) : [];

    let updatedCount = 0;
    updates.forEach(update => {
      const index = translations.findIndex(t => t.key === update.key);
      if (index >= 0) {
        translations[index] = { ...translations[index], ...update };
      } else {
        translations.push({
          key: update.key,
          en: update.en,
          fr: update.fr,
          category: update.category || 'common',
        });
      }
      updatedCount++;
    });

    localStorage.setItem(STORAGE_KEYS.TRANSLATIONS, JSON.stringify(translations));
    console.log(`💾 [Mock] POST /api/translations/bulk - ${updatedCount} updated`);
    
    return { updated: updatedCount };
  }

  async getPublicSettings(): Promise<Record<string, any>> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const settings = raw ? JSON.parse(raw) : MOCK_SETTINGS;

    console.log('⚙️ [Mock] GET /api/settings/public');
    return settings;
  }

  async getCurrentUser(): Promise<{ displayName: string; email: string; roles: string[] }> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    const user = raw ? JSON.parse(raw) : MOCK_USER;

    console.log('👤 [Mock] GET /api/users/me');
    return user;
  }

  async getSettings(params?: {
    category?: string;
    isPublic?: boolean;
  }): Promise<{ settings: any[] }> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS_ADMIN);
    let settings: any[] = raw ? JSON.parse(raw) : ALL_SETTINGS;

    if (params?.category) {
      settings = settings.filter(s => s.category === params.category);
    }
    if (params?.isPublic !== undefined) {
      settings = settings.filter(s => s.isPublic === params.isPublic);
    }

    console.log(`⚙️ [Mock] GET /api/settings - ${settings.length} results`);
    return { settings };
  }

  async updateSetting(
    key: string,
    update: { value: string; valueType: string; isPublic: boolean; description?: string }
  ): Promise<any> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS_ADMIN);
    const settings: any[] = raw ? JSON.parse(raw) : ALL_SETTINGS;

    const index = settings.findIndex(s => s.key === key);
    if (index >= 0) {
      settings[index] = { ...settings[index], ...update, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.SETTINGS_ADMIN, JSON.stringify(settings));
      console.log(`💾 [Mock] PATCH /api/settings/${key} - updated`);
      return settings[index];
    }

    throw new Error(`Setting not found: ${key}`);
  }

  async getUserMe(): Promise<any> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    const user = raw ? JSON.parse(raw) : MOCK_USER;

    console.log('👤 [Mock] GET /api/users/me');
    return user;
  }

  async getApps(params?: {
    q?: string;
    visibility?: 'public' | 'private';
    page?: number;
    pageSize?: number;
  }): Promise<{ apps: any[]; total: number; page: number; pageSize: number }> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.APPS);
    let apps: any[] = raw ? JSON.parse(raw) : ALL_APPS;

    // Filter by search query (title, appId, description)
    if (params?.q) {
      const search = params.q.toLowerCase();
      apps = apps.filter(app =>
        app.title.toLowerCase().includes(search) ||
        app.appId.toLowerCase().includes(search) ||
        (app.description || '').toLowerCase().includes(search)
      );
    }

    // Filter by visibility
    if (params?.visibility) {
      apps = apps.filter(app => app.visibility === params.visibility);
    }

    // Pagination
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 25;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedApps = apps.slice(start, end);

    console.log(`📱 [Mock] GET /api/apps - ${paginatedApps.length}/${apps.length} results (page ${page})`);
    return { apps: paginatedApps, total: apps.length, page, pageSize };
  }

  async createApp(data: {
    title: string;
    description?: string;
    visibility: 'public' | 'private';
    systemPrompt?: string;
    costCenter?: string;
    owners?: string[];
    tags?: string[];
    uiBannerKey?: string;
  }): Promise<any> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.APPS);
    const apps: any[] = raw ? JSON.parse(raw) : ALL_APPS;

    // Generate new appId
    const appId = `app-${String(apps.length + 1).padStart(3, '0')}`;
    const newApp = {
      appId,
      ...data,
      createdAt: new Date().toISOString(),
    };

    apps.push(newApp);
    localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps));

    console.log(`✨ [Mock] POST /api/apps - created ${appId}`);
    return newApp;
  }

  async updateApp(appId: string, data: {
    title?: string;
    description?: string;
    visibility?: 'public' | 'private';
    systemPrompt?: string;
    costCenter?: string;
    owners?: string[];
    tags?: string[];
    uiBannerKey?: string;
  }): Promise<any> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.APPS);
    const apps: any[] = raw ? JSON.parse(raw) : ALL_APPS;

    const index = apps.findIndex(app => app.appId === appId);
    if (index >= 0) {
      apps[index] = { ...apps[index], ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps));
      console.log(`💾 [Mock] PATCH /api/apps/${appId} - updated`);
      return apps[index];
    }

    throw new Error(`App not found: ${appId}`);
  }

  async getRbacAssignments(params?: {
    role?: string;
    scope?: string;
  }): Promise<{ assignments: any[]; total: number }> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.RBAC_ASSIGNMENTS);
    let assignments: any[] = raw ? JSON.parse(raw) : ALL_RBAC_ASSIGNMENTS;

    if (params?.role) {
      assignments = assignments.filter(a => a.role === params.role);
    }
    if (params?.scope) {
      assignments = assignments.filter(a => a.scope === params.scope);
    }

    console.log(`🔐 [Mock] GET /api/rbac/assignments - ${assignments.length} results`);
    return { assignments, total: assignments.length };
  }

  async getAuditLogs(params?: {
    entityType?: string;
    outcome?: string;
    actor?: string;
  }): Promise<{ logs: any[]; total: number }> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    let logs: any[] = raw ? JSON.parse(raw) : ALL_AUDIT_LOGS;

    if (params?.entityType) {
      logs = logs.filter(l => l.entityType === params.entityType);
    }
    if (params?.outcome) {
      logs = logs.filter(l => l.outcome === params.outcome);
    }
    if (params?.actor) {
      const search = params.actor.toLowerCase();
      logs = logs.filter(l => l.actor.toLowerCase().includes(search));
    }

    console.log(`📋 [Mock] GET /api/audit/logs - ${logs.length} results`);
    return { logs, total: logs.length };
  }

  async disableApp(appId: string): Promise<void> {
    this.initialize();
    await this.delay();

    const raw = localStorage.getItem(STORAGE_KEYS.APPS);
    const apps: any[] = raw ? JSON.parse(raw) : ALL_APPS;

    const index = apps.findIndex(app => app.appId === appId);
    if (index >= 0) {
      apps[index] = { ...apps[index], disabled: true, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps));
      console.log(`🚫 [Mock] POST /api/apps/${appId}/disable - disabled`);
      return;
    }

    throw new Error(`App not found: ${appId}`);
  }

  // ─── WI-12: Ingestion Runs ─────────────────────────────────────────────────

  async getIngestionRuns(): Promise<{ runs: any[] }> {
    await this.delay();
    console.log('[Mock] GET /v1/admin/ingestion/runs');
    return { runs: ALL_INGESTION_RUNS };
  }

  async triggerIngestionRun(): Promise<{ run: any }> {
    await this.delay();
    const run = { runId: `run-${Date.now()}`, status: 'pending', startedAt: new Date().toISOString(), completedAt: null, documentCount: 0 };
    console.log('[Mock] POST /v1/admin/ingestion/runs', run.runId);
    return { run };
  }

  async cancelIngestionRun(runId: string): Promise<void> {
    await this.delay();
    console.log(`[Mock] PATCH /v1/admin/ingestion/runs/${runId} → cancelled`);
  }

  // ─── WI-13: Search Health ──────────────────────────────────────────────────

  async getSearchHealth(): Promise<{ indexes: any[] }> {
    await this.delay();
    console.log('[Mock] GET /v1/admin/search/health');
    return { indexes: ALL_SEARCH_INDEXES };
  }

  async triggerReindex(indexName: string): Promise<void> {
    await this.delay();
    console.log(`[Mock] POST /v1/admin/search/reindex → ${indexName}`);
  }

  // ─── WI-14: Support Tickets ────────────────────────────────────────────────

  async getSupportTickets(): Promise<{ tickets: any[] }> {
    await this.delay();
    console.log('[Mock] GET /v1/admin/support/tickets');
    return { tickets: ALL_SUPPORT_TICKETS };
  }

  async updateSupportTicket(ticketId: string, patch: Record<string, any>): Promise<any> {
    await this.delay();
    console.log(`[Mock] PATCH /v1/admin/support/tickets/${ticketId}`, patch);
    return { ticketId, ...patch };
  }

  // ─── WI-15: Feature Flags ─────────────────────────────────────────────────

  async getFeatureFlags(): Promise<{ flags: any[] }> {
    await this.delay();
    console.log('[Mock] GET /v1/admin/feature-flags');
    return { flags: ALL_FEATURE_FLAGS };
  }

  async toggleFeatureFlag(flagKey: string, enabled: boolean): Promise<void> {
    await this.delay();
    console.log(`[Mock] PATCH /v1/admin/feature-flags/${flagKey} → enabled=${enabled}`);
  }

  // ─── WI-16: RBAC Roles ────────────────────────────────────────────────────

  async getRbacRoles(): Promise<{ roles: any[] }> {
    await this.delay();
    console.log('[Mock] GET /v1/admin/rbac/roles');
    return { roles: ALL_RBAC_ROLES };
  }

  async createRbacRole(data: Record<string, any>): Promise<{ role: any }> {
    await this.delay();
    const role = { roleId: `role-${Date.now()}`, userCount: 0, ...data };
    console.log('[Mock] POST /v1/admin/rbac/roles', role.roleId);
    return { role };
  }

  async updateRbacRole(roleId: string, data: Record<string, any>): Promise<any> {
    await this.delay();
    console.log(`[Mock] PATCH /v1/admin/rbac/roles/${roleId}`, data);
    return { roleId, ...data };
  }

  async deleteRbacRole(roleId: string): Promise<void> {
    await this.delay();
    console.log(`[Mock] DELETE /v1/admin/rbac/roles/${roleId}`);
  }

  private async delay(): Promise<void> {
    const ms = 50 + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  resetMockData(): void {
    localStorage.removeItem(STORAGE_KEYS.TRANSLATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.USER);
    this.initialized = false;
    console.log('🔄 [Mock] Data reset');
  }
}

export const mockBackendService = new MockBackendService();
