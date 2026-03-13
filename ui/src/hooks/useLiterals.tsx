/**
 * useLiterals Hook - 5 Language Support
 * Returns multilingual literals for component keys
 */

import React from 'react';
import { useLang } from '@context/LangContext';

const literals: Record<string, Record<string, Record<string, string>>> = {
  'projects.create_form': {
    en: {
      'title': 'Create Project',
      'errors.required': 'This field is required',
      'errors.invalid': 'Invalid value',
      'actions.submit': 'Create',
      'actions.cancel': 'Cancel',
      'messages.error': 'Error creating project',
      'messages.creating': 'Creating...',
    },
    fr: {
      'title': 'Créer un projet',
      'errors.required': 'Ce champ est requis',
      'errors.invalid': 'Valeur invalide',
      'actions.submit': 'Créer',
      'actions.cancel': 'Annuler',
      'messages.error': 'Erreur lors de la création du projet',
      'messages.creating': 'Création en cours...',
    },
    es: {
      'title': 'Crear Proyecto',
      'errors.required': 'Este campo es obligatorio',
      'errors.invalid': 'Valor inválido',
      'actions.submit': 'Crear',
      'actions.cancel': 'Cancelar',
      'messages.error': 'Error al crear el proyecto',
      'messages.creating': 'Creando...',
    },
    de: {
      'title': 'Projekt Erstellen',
      'errors.required': 'Dieses Feld ist erforderlich',
      'errors.invalid': 'Ungültiger Wert',
      'actions.submit': 'Erstellen',
      'actions.cancel': 'Abbrechen',
      'messages.error': 'Fehler beim Erstellen des Projekts',
      'messages.creating': 'Wird erstellt...',
    },
    pt: {
      'title': 'Criar Projeto',
      'errors.required': 'Este campo é obrigatório',
      'errors.invalid': 'Valor inválido',
      'actions.submit': 'Criar',
      'actions.cancel': 'Cancelar',
      'messages.error': 'Erro ao criar projeto',
      'messages.creating': 'Criando...',
    },
  },
  'wbs.create_form': {
    en: {
      'title': 'Create WBS Item',
      'errors.required': 'This field is required',
      'actions.submit': 'Create',
      'actions.cancel': 'Cancel',
      'messages.error': 'Error creating WBS item',
      'messages.creating': 'Creating...',
    },
    fr: {
      'title': 'Créer un élément WBS',
      'errors.required': 'Ce champ est requis',
      'actions.submit': 'Créer',
      'actions.cancel': 'Annuler',
      'messages.error': 'Erreur lors de la création de l\'élément WBS',
      'messages.creating': 'Création en cours...',
    },
    es: {
      'title': 'Crear Elemento WBS',
      'errors.required': 'Este campo es obligatorio',
      'actions.submit': 'Crear',
      'actions.cancel': 'Cancelar',
      'messages.error': 'Error al crear elemento WBS',
      'messages.creating': 'Creando...',
    },
    de: {
      'title': 'WBS-Element Erstellen',
      'errors.required': 'Dieses Feld ist erforderlich',
      'actions.submit': 'Erstellen',
      'actions.cancel': 'Abbrechen',
      'messages.error': 'Fehler beim Erstellen des WBS-Elements',
      'messages.creating': 'Wird erstellt...',
    },
    pt: {
      'title': 'Criar Item WBS',
      'errors.required': 'Este campo é obrigatório',
      'actions.submit': 'Criar',
      'actions.cancel': 'Cancelar',
      'messages.error': 'Erro ao criar item WBS',
      'messages.creating': 'Criando...',
    },
  },
  'sprints.create_form': {
    en: {
      'title': 'Create Sprint',
      'errors.required': 'This field is required',
      'actions.submit': 'Create',
      'actions.cancel': 'Cancel',
      'messages.error': 'Error creating sprint',
      'messages.creating': 'Creating...',
    },
    fr: {
      'title': 'Créer un Sprint',
      'errors.required': 'Ce champ est requis',
      'actions.submit': 'Créer',
      'actions.cancel': 'Annuler',
      'messages.error': 'Erreur lors de la création du sprint',
      'messages.creating': 'Création en cours...',
    },
    es: {
      'title': 'Crear Sprint',
      'errors.required': 'Este campo es obligatorio',
      'actions.submit': 'Crear',
      'actions.cancel': 'Cancelar',
      'messages.error': 'Error al crear sprint',
      'messages.creating': 'Creando...',
    },
    de: {
      'title': 'Sprint Erstellen',
      'errors.required': 'Dieses Feld ist erforderlich',
      'actions.submit': 'Erstellen',
      'actions.cancel': 'Abbrechen',
      'messages.error': 'Fehler beim Erstellen des Sprints',
      'messages.creating': 'Wird erstellt...',
    },
    pt: {
      'title': 'Criar Sprint',
      'errors.required': 'Este campo é obrigatório',
      'actions.submit': 'Criar',
      'actions.cancel': 'Cancelar',
      'messages.error': 'Erro ao criar sprint',
      'messages.creating': 'Criando...',
    },
  },
  'projects.edit_form': {
    en: {
      'title': 'Edit Record',
      'actions.submit': 'Save',
      'actions.cancel': 'Cancel',
      'errors.required': 'This field is required',
      'messages.updating': 'Updating...',
      'messages.error': 'Failed to update record',
      'messages.noChanges': 'No changes detected',
    },
    fr: {
      'title': "Modifier l'enregistrement",
      'actions.submit': 'Enregistrer',
      'actions.cancel': 'Annuler',
      'errors.required': 'Champ obligatoire',
      'messages.updating': 'Mise à jour en cours...',
      'messages.error': 'Erreur lors de la mise à jour',
      'messages.noChanges': 'Aucune modification détectée',
    },
    es: {
      'title': 'Editar Registro',
      'actions.submit': 'Guardar',
      'actions.cancel': 'Cancelar',
      'errors.required': 'Este campo es obligatorio',
      'messages.updating': 'Actualizando...',
      'messages.error': 'Error al actualizar',
      'messages.noChanges': 'No se detectaron cambios',
    },
    de: {
      'title': 'Datensatz Bearbeiten',
      'actions.submit': 'Speichern',
      'actions.cancel': 'Abbrechen',
      'errors.required': 'Dieses Feld ist erforderlich',
      'messages.updating': 'Wird aktualisiert...',
      'messages.error': 'Fehler beim Aktualisieren',
      'messages.noChanges': 'Keine Änderungen erkannt',
    },
    pt: {
      'title': 'Editar Registro',
      'actions.submit': 'Salvar',
      'actions.cancel': 'Cancelar',
      'errors.required': 'Este campo é obrigatório',
      'messages.updating': 'Atualizando...',
      'messages.error': 'Erro ao atualizar',
      'messages.noChanges': 'Nenhuma alteração detectada',
    },
  },
  'wbs.edit_form': {
    en: {
      'title': 'Edit Record',
      'actions.submit': 'Save',
      'actions.cancel': 'Cancel',
      'errors.required': 'This field is required',
      'messages.updating': 'Updating...',
      'messages.error': 'Failed to update record',
      'messages.noChanges': 'No changes detected',
    },
    fr: {
      'title': "Modifier l'enregistrement",
      'actions.submit': 'Enregistrer',
      'actions.cancel': 'Annuler',
      'errors.required': 'Champ obligatoire',
      'messages.updating': 'Mise à jour en cours...',
      'messages.error': 'Erreur lors de la mise à jour',
      'messages.noChanges': 'Aucune modification détectée',
    },
    es: {
      'title': 'Editar Registro',
      'actions.submit': 'Guardar',
      'actions.cancel': 'Cancelar',
      'errors.required': 'Este campo es obligatorio',
      'messages.updating': 'Actualizando...',
      'messages.error': 'Error al actualizar',
      'messages.noChanges': 'No se detectaron cambios',
    },
    de: {
      'title': 'Datensatz Bearbeiten',
      'actions.submit': 'Speichern',
      'actions.cancel': 'Abbrechen',
      'errors.required': 'Dieses Feld ist erforderlich',
      'messages.updating': 'Wird aktualisiert...',
      'messages.error': 'Fehler beim Aktualisieren',
      'messages.noChanges': 'Keine Änderungen erkannt',
    },
    pt: {
      'title': 'Editar Registro',
      'actions.submit': 'Salvar',
      'actions.cancel': 'Cancelar',
      'errors.required': 'Este campo é obrigatório',
      'messages.updating': 'Atualizando...',
      'messages.error': 'Erro ao atualizar',
      'messages.noChanges': 'Nenhuma alteração detectada',
    },
  },
  'sprints.edit_form': {
    en: {
      'title': 'Edit Record',
      'actions.submit': 'Save',
      'actions.cancel': 'Cancel',
      'errors.required': 'This field is required',
      'messages.updating': 'Updating...',
      'messages.error': 'Failed to update record',
      'messages.noChanges': 'No changes detected',
    },
    fr: {
      'title': "Modifier l'enregistrement",
      'actions.submit': 'Enregistrer',
      'actions.cancel': 'Annuler',
      'errors.required': 'Champ obligatoire',
      'messages.updating': 'Mise à jour en cours...',
      'messages.error': 'Erreur lors de la mise à jour',
      'messages.noChanges': 'Aucune modification détectée',
    },
    es: {
      'title': 'Editar Registro',
      'actions.submit': 'Guardar',
      'actions.cancel': 'Cancelar',
      'errors.required': 'Este campo es obligatorio',
      'messages.updating': 'Actualizando...',
      'messages.error': 'Error al actualizar',
      'messages.noChanges': 'No se detectaron cambios',
    },
    de: {
      'title': 'Datensatz Bearbeiten',
      'actions.submit': 'Speichern',
      'actions.cancel': 'Abbrechen',
      'errors.required': 'Dieses Feld ist erforderlich',
      'messages.updating': 'Wird aktualisiert...',
      'messages.error': 'Fehler beim Aktualisieren',
      'messages.noChanges': 'Keine Änderungen erkannt',
    },
    pt: {
      'title': 'Editar Registro',
      'actions.submit': 'Salvar',
      'actions.cancel': 'Cancelar',
      'errors.required': 'Este campo é obrigatório',
      'messages.updating': 'Atualizando...',
      'messages.error': 'Erro ao atualizar',
      'messages.noChanges': 'Nenhuma alteração detectada',
    },
  },
};

export const useLiterals = (namespace: string) => {
  const { lang } = useLang();
  
  return React.useCallback((key: string): string => {
    if (literals[namespace]?.[lang]?.[key]) {
      return literals[namespace][lang][key];
    }
    
    // Fallback to English
    if (literals[namespace]?.['en']?.[key]) {
      return literals[namespace]['en'][key];
    }
    
    // Fallback to key
    return key;
  }, [namespace, lang]);
};
