// pv-templates-builtin.js — Bibliothèque des 36 modèles de PV OMP 2026
// Generated from official .docx templates
// Template-as-data approach: each template is a JS object with sections and fields

// ══════════════════════════════════════════════════════════════════════════════
// SECTION FACTORIES (DRY — shared across all 36 templates)
// ══════════════════════════════════════════════════════════════════════════════

function sectionIdentification() {
  return {
    id: 'identification',
    label: '1. Identification du PV',
    fields: [
      { id: 'numero_pv', label: 'Numéro du PV', type: 'text', required: true, placeholder: 'Ex: PV-2026-001' },
      { id: 'date_redaction', label: 'Date de rédaction', type: 'date', required: true },
    ]
  };
}

function sectionAgent() {
  return {
    id: 'agent',
    label: '2. Agent verbalisateur',
    fields: [
      { id: 'grade', label: 'Grade', type: 'select', required: true, options: ['Gardien de PM', 'Brigadier de PM', 'Brigadier-chef de PM', 'Chef de PM'] },
      { id: 'nom_agent', label: 'Nom et prénom', type: 'text', required: true, placeholder: 'NOM Prénom' },
      { id: 'matricule', label: 'Matricule', type: 'text', required: true },
      { id: 'commune', label: "Service d'affectation", type: 'text', required: true, placeholder: 'Police Municipale de ...' },
      { id: 'situation', label: 'Situation au moment des faits', type: 'select', required: true, options: ['En patrouille', 'Sur réquisition', 'En surveillance fixe', 'En intervention', 'En mission de police'] },
      { id: 'collegue_nom', label: 'Agent accompagnateur (nom)', type: 'text', required: false, placeholder: 'NOM Prénom' },
      { id: 'collegue_grade', label: 'Agent accompagnateur (grade)', type: 'text', required: false },
      { id: 'collegue_matricule', label: 'Agent accompagnateur (matricule)', type: 'text', required: false },
    ]
  };
}

function sectionDateLieu() {
  return {
    id: 'date_lieu',
    label: '3. Date, heure et lieu',
    fields: [
      { id: 'date_constatation', label: 'Date de la constatation', type: 'date', required: true },
      { id: 'heure_constatation', label: 'Heure précise', type: 'time', required: true },
      { id: 'adresse', label: 'Adresse complète', type: 'text', required: true, placeholder: 'N° et rue, commune' },
      { id: 'repere', label: 'Repères complémentaires', type: 'text', required: false, placeholder: 'Devant le n°, angle rue...' },
      { id: 'meteo', label: 'Conditions météo', type: 'select', required: false, options: ['Beau temps', 'Couvert', 'Pluie', 'Brouillard', 'Nuit claire', 'Nuit éclairage public'] },
    ]
  };
}

function sectionContrevenant() {
  return {
    id: 'contrevenant',
    label: '4. Identification du contrevenant',
    fields: [
      { id: 'nom_contrevenant', label: 'Nom', type: 'text', required: true },
      { id: 'prenom_contrevenant', label: 'Prénom', type: 'text', required: true },
      { id: 'date_naissance', label: 'Date de naissance', type: 'date', required: false },
      { id: 'lieu_naissance', label: 'Lieu de naissance', type: 'text', required: false },
      { id: 'adresse_contrevenant', label: 'Adresse du domicile', type: 'text', required: true },
      { id: 'nationalite', label: 'Nationalité', type: 'text', required: false, placeholder: 'Française' },
      { id: 'profession', label: 'Profession', type: 'text', required: false },
      { id: 'piece_identite', label: "Pièce d'identité présentée", type: 'select', required: false, options: ['CNI', 'Passeport', 'Permis de conduire', 'Titre de séjour', 'Aucune'] },
      { id: 'numero_piece', label: 'N° de la pièce', type: 'text', required: false },
      { id: 'personne_morale', label: 'Personne morale (si applicable)', type: 'text', required: false, placeholder: 'Raison sociale' },
      { id: 'siret', label: 'N° SIRET', type: 'text', required: false },
      { id: 'representant', label: 'Représentant légal', type: 'text', required: false },
    ]
  };
}

function sectionVehicule() {
  return {
    id: 'vehicule',
    label: '5. Identification du véhicule',
    fields: [
      { id: 'immatriculation', label: 'Immatriculation', type: 'text', required: true, placeholder: 'AA-123-BB' },
      { id: 'marque', label: 'Marque', type: 'text', required: true },
      { id: 'modele', label: 'Modèle', type: 'text', required: false },
      { id: 'couleur', label: 'Couleur', type: 'text', required: false },
      { id: 'type_carrosserie', label: 'Type de carrosserie', type: 'select', required: false, options: ['Berline', 'Break', 'SUV', 'Utilitaire', 'Camion', 'Deux-roues', 'Autre'] },
      { id: 'proprietaire_siv', label: 'Propriétaire (via SIV)', type: 'text', required: false },
    ]
  };
}

function sectionQualification({ article, classe, amendeForfaitaire, amendeMinoree, amendeMajoree, retraitPoints, texteLoi }) {
  const fields = [];
  fields.push({ id: 'texte_juridique', label: 'Fondement juridique', type: 'fixed', fixedValue: `Article ${article}\nContravention de ${classe} classe` });
  if (texteLoi) {
    fields.push({ id: 'texte_loi', label: 'Texte applicable', type: 'fixed', fixedValue: texteLoi });
  }
  let bareme = `Amende forfaitaire : ${amendeForfaitaire}`;
  if (amendeMinoree) bareme += `\nAmende minorée (paiement sous 15 jours) : ${amendeMinoree}`;
  if (amendeMajoree) bareme += `\nAmende majorée (absence de paiement/contestation sous 45 jours) : ${amendeMajoree}`;
  if (retraitPoints) bareme += `\nRetrait de ${retraitPoints} point(s) sur le permis de conduire`;
  fields.push({ id: 'bareme_amendes', label: 'Barème des amendes', type: 'fixed', fixedValue: bareme });
  fields.push({ id: 'arrete_complementaire', label: 'Arrêté municipal complémentaire', type: 'text', required: false });
  fields.push({ id: 'transmission_omp', label: 'Transmission au tribunal', type: 'select', required: false, options: ['Non (amende forfaitaire)', 'Oui (5e classe / délit)', 'Oui (récidive)', 'Oui (autres)'] });
  return { id: 'qualification', label: '7. Qualification juridique', fields };
}

function sectionQualificationNum6({ article, classe, amendeForfaitaire, amendeMinoree, amendeMajoree, retraitPoints, texteLoi }) {
  const s = sectionQualification({ article, classe, amendeForfaitaire, amendeMinoree, amendeMajoree, retraitPoints, texteLoi });
  s.label = '6. Qualification juridique';
  return s;
}

function sectionDroits() {
  return {
    id: 'droits',
    label: '8. Droits du contrevenant',
    fields: [
      { id: 'modalite_remise', label: 'Modalité de remise du PV', type: 'select', required: true, options: ['Remise en main propre', 'Envoi par courrier', 'Déposé sur le véhicule', 'Envoi recommandé AR'] },
      { id: 'texte_droits', label: 'Information sur les droits', type: 'fixed', fixedValue: "Le contrevenant dispose d'un délai de 45 jours à compter de la date de l'avis de contravention pour :\n— Payer l'amende forfaitaire\n— Ou contester par voie de requête en exonération auprès de l'Officier du Ministère Public\n\nToute contestation doit être accompagnée de l'avis de contravention original et d'un exposé des motifs." },
      { id: 'observations_contrevenant', label: 'Observations du contrevenant', type: 'textarea', required: false, placeholder: 'Observations éventuelles formulées par le contrevenant...' },
      { id: 'accuse_reception', label: 'Accusé de réception', type: 'select', required: false, options: ['Signé', 'Refusé', 'Absent'] },
    ]
  };
}

function sectionDroitsNum7() {
  const s = sectionDroits();
  s.label = '7. Droits du contrevenant';
  return s;
}

function sectionTransmission() {
  return {
    id: 'transmission',
    label: '9. Transmission',
    fields: [
      { id: 'date_transmission', label: 'Date de transmission', type: 'date', required: false },
      { id: 'destinataire_omp', label: 'Destinataire (OMP)', type: 'text', required: false, placeholder: "Officier du Ministère Public — Tribunal de Police de ..." },
      { id: 'annexes', label: 'Pièces jointes / Annexes', type: 'textarea', required: false, placeholder: 'Photos, croquis, PV complémentaires...' },
    ]
  };
}

function sectionTransmissionNum8() {
  const s = sectionTransmission();
  s.label = '8. Transmission';
  return s;
}

function sectionCloture() {
  return {
    id: 'cloture',
    label: '10. Clôture et signature',
    fields: [
      { id: 'lieu_cloture', label: 'Lieu de clôture', type: 'text', required: true, placeholder: 'Commune' },
      { id: 'date_cloture', label: 'Date de clôture', type: 'date', required: true },
      { id: 'heure_cloture', label: 'Heure de clôture', type: 'time', required: false },
      { id: 'signature_agent', label: "Signature de l'agent", type: 'signature', required: true },
    ]
  };
}

function sectionClotureNum9() {
  const s = sectionCloture();
  s.label = '9. Clôture et signature';
  return s;
}

// ══════════════════════════════════════════════════════════════════════════════
// FAMILY-SPECIFIC SECTION FACTORIES
// ══════════════════════════════════════════════════════════════════════════════

// ── Animal description section (Family 5) ──
function sectionAnimal() {
  return {
    id: 'animal',
    label: '5. Description de l\'animal',
    fields: [
      { id: 'espece', label: 'Espèce', type: 'text', required: true, placeholder: 'Chien, chat, etc.' },
      { id: 'race', label: 'Race', type: 'text', required: false },
      { id: 'couleur_animal', label: 'Couleur / Robe', type: 'text', required: false },
      { id: 'taille_animal', label: 'Taille estimée', type: 'select', required: false, options: ['Petite', 'Moyenne', 'Grande'] },
      { id: 'puce', label: 'Identification (puce/tatouage)', type: 'text', required: false, placeholder: 'N° de puce ou tatouage' },
      { id: 'proprietaire_identifie', label: 'Propriétaire identifié', type: 'text', required: false },
    ]
  };
}

// ── Circonstances de l'intervention (Family 3) ──
function sectionCirconstancesIntervention() {
  return {
    id: 'circonstances_intervention',
    label: "5. Circonstances de l'intervention",
    fields: [
      { id: 'heure_appel', label: "Heure de l'appel / signalement", type: 'time', required: false },
      { id: 'plaignant', label: 'Plaignant / Source du signalement', type: 'text', required: false, placeholder: 'Nom du plaignant ou source' },
      { id: 'heure_arrivee', label: 'Heure d\'arrivée sur place', type: 'time', required: false },
      { id: 'origine_trouble', label: 'Origine du trouble', type: 'textarea', required: true, placeholder: 'Décrivez l\'origine identifiée du trouble...' },
    ]
  };
}


// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS — ALL 36 TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

const BUILTIN_TEMPLATES = [

  // ────────────────────────────────────────────────────────────────────────────
  // FAMILLE 1 : STATIONNEMENT (9 templates)
  // ────────────────────────────────────────────────────────────────────────────

  // 1.1 — Stationnement gênant
  {
    id: 'tpl_1_1', ref: '1.1', nom: 'Stationnement gênant',
    famille: 'Stationnement', familleNum: 1,
    description: 'Art. R417-10 CDR — Contravention 2e classe — 35 €',
    article: 'R417-10 CDR', classeContravention: '2e',
    amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'gene_constatee', label: 'Gêne constatée', type: 'textarea', required: false, placeholder: 'Nature de la gêne...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R417-10 CDR', classe: '2e', amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 1.2 — Stationnement dangereux
  {
    id: 'tpl_1_2', ref: '1.2', nom: 'Stationnement dangereux',
    famille: 'Stationnement', familleNum: 1,
    description: 'Art. R417-11 CDR — Contravention 4e classe — 135 €',
    article: 'R417-11 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'danger_constate', label: 'Nature du danger constaté', type: 'textarea', required: true, placeholder: 'Décrivez le danger...' },
          { id: 'visibilite', label: 'Conditions de visibilité', type: 'text', required: false },
          { id: 'distance_intersection', label: 'Distance par rapport à l\'intersection', type: 'text', required: false },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R417-11 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 1.3 — Zone bleue (non-respect)
  {
    id: 'tpl_1_3', ref: '1.3', nom: 'Zone bleue (non-respect)',
    famille: 'Stationnement', familleNum: 1,
    description: 'Art. R417-3 CDR — Contravention 2e classe — 35 €',
    article: 'R417-3 CDR', classeContravention: '2e',
    amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'heure_debut_stat', label: 'Heure de début de stationnement', type: 'time', required: true },
          { id: 'duree_autorisee', label: 'Durée autorisée', type: 'text', required: true, placeholder: 'Ex: 1h30' },
          { id: 'duree_constatee', label: 'Durée constatée', type: 'text', required: true, placeholder: 'Ex: 2h45' },
          { id: 'disque_present', label: 'Disque de stationnement', type: 'select', required: true, options: ['Oui', 'Non', 'Périmé'] },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R417-3 CDR', classe: '2e', amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 1.4 — Zone piétonne
  {
    id: 'tpl_1_4', ref: '1.4', nom: 'Zone piétonne',
    famille: 'Stationnement', familleNum: 1,
    description: 'Art. R417-6 CDR — Contravention 4e classe — 135 €',
    article: 'R417-6 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'pieton_gene', label: 'Gêne aux piétons constatée', type: 'textarea', required: false, placeholder: 'Décrivez la gêne aux piétons...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R417-6 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 1.5 — Couloir de bus
  {
    id: 'tpl_1_5', ref: '1.5', nom: 'Couloir de bus',
    famille: 'Stationnement', familleNum: 1,
    description: 'Art. R417-10 CDR — Contravention 2e classe — 35 €',
    article: 'R417-10 CDR', classeContravention: '2e',
    amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'num_couloir', label: 'Identification du couloir de bus', type: 'text', required: false, placeholder: 'Ligne, direction...' },
          { id: 'gene_tc', label: 'Gêne aux transports en commun', type: 'textarea', required: false, placeholder: 'Décrivez la gêne causée aux TC...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R417-10 CDR', classe: '2e', amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 1.6 — Place handicapés
  {
    id: 'tpl_1_6', ref: '1.6', nom: 'Place handicapés',
    famille: 'Stationnement', familleNum: 1,
    description: 'Art. R417-10 III CDR — Contravention 4e classe — 135 €',
    article: 'R417-10 III CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'carte_handicap', label: 'Carte de stationnement handicapé', type: 'select', required: true, options: ['Non présentée', 'Absente', 'Périmée', 'Autre véhicule'] },
          { id: 'occupants_presents', label: 'Occupants présents dans le véhicule', type: 'select', required: false, options: ['Oui', 'Non'] },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R417-10 III CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 1.7 — Trottoir / passage piéton
  {
    id: 'tpl_1_7', ref: '1.7', nom: 'Trottoir / passage piéton',
    famille: 'Stationnement', familleNum: 1,
    description: 'Art. R417-10 CDR — Contravention 2e classe — 35 €',
    article: 'R417-10 CDR', classeContravention: '2e',
    amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_infraction', label: "Type d'infraction", type: 'select', required: true, options: ['Trottoir', 'Passage piéton', 'Les deux'] },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'surface_empietee', label: 'Surface empiétée', type: 'text', required: false, placeholder: 'Estimation en m²' },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'gene_constatee', label: 'Gêne constatée', type: 'textarea', required: false, placeholder: 'Nature de la gêne...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R417-10 CDR', classe: '2e', amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 1.8 — Garage / sortie de secours
  {
    id: 'tpl_1_8', ref: '1.8', nom: 'Garage / sortie de secours',
    famille: 'Stationnement', familleNum: 1,
    description: 'Art. R417-10 CDR — Contravention 2e classe — 35 €',
    article: 'R417-10 CDR', classeContravention: '2e',
    amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_obstruction', label: "Type d'obstruction", type: 'select', required: true, options: ['Garage', 'Sortie de secours', "Entrée d'immeuble"] },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'adresse_acces', label: "Adresse de l'accès obstrué", type: 'text', required: false },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'proprietaire_acces', label: "Propriétaire de l'accès", type: 'text', required: false },
          { id: 'gene_constatee', label: 'Gêne constatée', type: 'textarea', required: false, placeholder: 'Nature de la gêne...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R417-10 CDR', classe: '2e', amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 1.9 — Axe rouge / interdiction absolue
  {
    id: 'tpl_1_9', ref: '1.9', nom: 'Axe rouge / interdiction absolue',
    famille: 'Stationnement', familleNum: 1,
    description: 'Art. R417-10 CDR — Contravention 2e classe — 35 €',
    article: 'R417-10 CDR', classeContravention: '2e',
    amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'type_signalisation', label: 'Type de signalisation', type: 'text', required: false, placeholder: 'Marquage au sol, panneaux...' },
          { id: 'reference_axe', label: "Référence de l'axe rouge", type: 'text', required: false },
          { id: 'visibilite', label: 'Visibilité de la signalisation', type: 'text', required: false },
          { id: 'gene_constatee', label: 'Gêne constatée', type: 'textarea', required: false, placeholder: 'Nature de la gêne...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R417-10 CDR', classe: '2e', amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // ────────────────────────────────────────────────────────────────────────────
  // FAMILLE 2 : CIRCULATION (12 templates)
  // ────────────────────────────────────────────────────────────────────────────

  // 2.1 — Excès de vitesse (< 20 km/h hors agglo)
  {
    id: 'tpl_2_1', ref: '2.1', nom: 'Excès de vitesse (< 20 km/h hors agglo)',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R413-14 CDR — Contravention 4e classe — 135 € — 1 point',
    article: 'R413-14 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '1',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'vitesse_retenue', label: 'Vitesse retenue (après correction)', type: 'text', required: true, placeholder: 'Ex: 67 km/h' },
          { id: 'vitesse_autorisee', label: 'Vitesse autorisée', type: 'text', required: true, placeholder: 'Ex: 50 km/h' },
          { id: 'moyen_controle', label: 'Moyen de contrôle', type: 'select', required: true, options: ['Radar fixe', 'Radar mobile', 'Jumelles laser', 'Suivi véhicule'] },
          { id: 'distance_controle', label: 'Distance de contrôle', type: 'text', required: false, placeholder: 'En mètres' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R413-14 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '1', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.2 — Non-respect feu rouge
  {
    id: 'tpl_2_2', ref: '2.2', nom: 'Non-respect feu rouge',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R412-30 CDR — Contravention 4e classe — 135 € — 4 points',
    article: 'R412-30 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '4',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'type_feu', label: 'Type de feu', type: 'select', required: true, options: ['Feu tricolore', 'Feu clignotant', 'Feu piéton'] },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'visibilite_feu', label: 'Visibilité du feu', type: 'text', required: false, placeholder: 'Bonne, réduite, masquée...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R412-30 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '4', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.3 — Non-respect stop
  {
    id: 'tpl_2_3', ref: '2.3', nom: 'Non-respect stop',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R415-6 CDR — Contravention 4e classe — 135 € — 4 points',
    article: 'R415-6 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '4',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'arret_effectue', label: 'Arrêt effectué', type: 'select', required: true, options: ['Aucun arrêt', 'Arrêt partiel', 'Ralentissement'] },
          { id: 'visibilite_panneau', label: 'Visibilité du panneau', type: 'text', required: false },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R415-6 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '4', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.4 — Sens interdit
  {
    id: 'tpl_2_4', ref: '2.4', nom: 'Sens interdit',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R412-28 CDR — Contravention 4e classe — 135 € — 4 points',
    article: 'R412-28 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '4',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'distance_parcourue', label: 'Distance parcourue en sens interdit', type: 'text', required: false, placeholder: 'Estimation en mètres' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R412-28 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '4', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.5 — Non-respect priorité piétons
  {
    id: 'tpl_2_5', ref: '2.5', nom: 'Non-respect priorité piétons',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R415-11 CDR — Contravention 4e classe — 135 € — 6 points',
    article: 'R415-11 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '6',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'localisation_traversee', label: 'Localisation de la traversée', type: 'text', required: false, placeholder: 'Passage piéton, intersection...' },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'pieton_engage', label: 'Piéton engagé sur la chaussée', type: 'select', required: true, options: ['Oui', 'Non'] },
          { id: 'vitesse_estimee', label: 'Vitesse estimée du véhicule', type: 'text', required: false },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R415-11 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '6', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.6 — Usage téléphone au volant
  {
    id: 'tpl_2_6', ref: '2.6', nom: 'Usage téléphone au volant',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R412-6-1 CDR — Contravention 4e classe — 135 € — 3 points',
    article: 'R412-6-1 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '3',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_usage', label: "Type d'usage du téléphone", type: 'select', required: true, options: ['Tenu en main', 'Oreillette', 'Kit mains-libres non homologué'] },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'duree_usage', label: "Durée estimée de l'usage", type: 'text', required: false },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R412-6-1 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '3', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.7 — Défaut d'assurance
  {
    id: 'tpl_2_7', ref: '2.7', nom: "Défaut d'assurance",
    famille: 'Circulation', familleNum: 2,
    description: 'Art. L324-2 CDR — Contravention 5e classe — 3750 €',
    article: 'L324-2 CDR', classeContravention: '5e',
    amendeForfaitaire: '3750 €', amendeMinoree: '', amendeMajoree: '3750 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'attestation_presentee', label: "Attestation d'assurance", type: 'select', required: true, options: ['Non présentée', 'Périmée', 'Véhicule non couvert'] },
          { id: 'delai_presentation', label: 'Délai accordé pour présentation', type: 'text', required: false, placeholder: 'Ex: 5 jours' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'L324-2 CDR', classe: '5e', amendeForfaitaire: '3750 €', amendeMinoree: '', amendeMajoree: '3750 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.8 — Non-respect cédez-le-passage
  {
    id: 'tpl_2_8', ref: '2.8', nom: 'Non-respect cédez-le-passage',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R415-7 CDR — Contravention 4e classe — 135 € — 4 points',
    article: 'R415-7 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '4',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'signalisation', label: 'Signalisation en place', type: 'text', required: false },
          { id: 'priorite_a', label: 'Priorité à', type: 'select', required: true, options: ['Droite', 'Gauche', 'Rond-point'] },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R415-7 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '4', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.9 — Défaut ceinture de sécurité
  {
    id: 'tpl_2_9', ref: '2.9', nom: 'Défaut ceinture de sécurité',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R412-1 CDR — Contravention 4e classe — 135 € — 3 points',
    article: 'R412-1 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '3',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'position_contrevenant', label: 'Position du contrevenant', type: 'select', required: true, options: ['Conducteur', 'Passager avant', 'Passager arrière'] },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R412-1 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '3', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.10 — Défaut de casque
  {
    id: 'tpl_2_10', ref: '2.10', nom: 'Défaut de casque',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R431-1 CDR — Contravention 4e classe — 135 € — 3 points',
    article: 'R431-1 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '3',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_deux_roues', label: 'Type de deux-roues', type: 'select', required: true, options: ['Moto', 'Scooter', 'Cyclomoteur'] },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'casque_present', label: 'État du casque', type: 'select', required: true, options: ['Non porté', 'Non attaché', 'Non homologué'] },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R431-1 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '3', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.11 — Défaut contrôle technique
  {
    id: 'tpl_2_11', ref: '2.11', nom: 'Défaut contrôle technique',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R323-1 CDR — Contravention 4e classe — 135 €',
    article: 'R323-1 CDR', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'date_derniere_visite', label: 'Date de la dernière visite technique', type: 'date', required: false },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'delai_presentation', label: 'Délai accordé pour présentation', type: 'text', required: false, placeholder: 'Ex: 7 jours' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R323-1 CDR', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 2.12 — Dégradation de la chaussée
  {
    id: 'tpl_2_12', ref: '2.12', nom: 'Dégradation de la chaussée',
    famille: 'Circulation', familleNum: 2,
    description: 'Art. R418-1 CDR — Contravention 5e classe — 1500 €',
    article: 'R418-1 CDR', classeContravention: '5e',
    amendeForfaitaire: '1500 €', amendeMinoree: '', amendeMajoree: '1500 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionVehicule(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_degradation', label: 'Type de dégradation', type: 'text', required: true, placeholder: 'Ornières, affaissement, déversement...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'etendue_degats', label: 'Étendue des dégâts', type: 'text', required: false, placeholder: 'Surface, longueur...' },
          { id: 'responsable_identifie', label: 'Responsable identifié', type: 'text', required: false },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R418-1 CDR', classe: '5e', amendeForfaitaire: '1500 €', amendeMinoree: '', amendeMajoree: '1500 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // ────────────────────────────────────────────────────────────────────────────
  // FAMILLE 3 : TRANQUILLITÉ PUBLIQUE (2 templates)
  // Sections: 1-4 common, 5=Circonstances intervention, 6=Faits, 7-10
  // ────────────────────────────────────────────────────────────────────────────

  // 3.1 — Tapage nocturne
  {
    id: 'tpl_3_1', ref: '3.1', nom: 'Tapage nocturne',
    famille: 'Tranquillité publique', familleNum: 3,
    description: 'Art. R623-2 CP — Contravention 3e classe — 68 €',
    article: 'R623-2 CP', classeContravention: '3e',
    amendeForfaitaire: '68 €', amendeMinoree: '', amendeMajoree: '180 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionCirconstancesIntervention(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'nature_trouble', label: 'Nature du trouble', type: 'textarea', required: true, placeholder: 'Musique, cris, travaux, fête...' },
          { id: 'niveau_sonore', label: 'Niveau sonore estimé', type: 'select', required: true, options: ['Faible', 'Modéré', 'Élevé', 'Très élevé'] },
          { id: 'duree_trouble', label: 'Durée du trouble', type: 'text', required: false, placeholder: 'Ex: 2 heures' },
          { id: 'source_bruit', label: 'Source du bruit identifiée', type: 'text', required: true, placeholder: 'Appartement, terrasse, véhicule...' },
          { id: 'mesures_prises', label: 'Mesures prises', type: 'textarea', required: false, placeholder: 'Demande de cesser, mise en demeure...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R623-2 CP', classe: '3e', amendeForfaitaire: '68 €', amendeMinoree: '', amendeMajoree: '180 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 3.2 — Bruits de voisinage
  {
    id: 'tpl_3_2', ref: '3.2', nom: 'Bruits de voisinage',
    famille: 'Tranquillité publique', familleNum: 3,
    description: 'Art. R623-1 CP — Contravention 3e classe — 68 €',
    article: 'R623-1 CP', classeContravention: '3e',
    amendeForfaitaire: '68 €', amendeMinoree: '', amendeMajoree: '180 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionCirconstancesIntervention(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'nature_trouble', label: 'Nature du trouble', type: 'textarea', required: true, placeholder: 'Musique, bricolage, animaux, cris...' },
          { id: 'niveau_sonore', label: 'Niveau sonore estimé', type: 'select', required: true, options: ['Faible', 'Modéré', 'Élevé', 'Très élevé'] },
          { id: 'duree_trouble', label: 'Durée du trouble', type: 'text', required: false, placeholder: 'Ex: 2 heures' },
          { id: 'source_bruit', label: 'Source du bruit identifiée', type: 'text', required: true, placeholder: 'Appartement, jardin, atelier...' },
          { id: 'recurrence', label: 'Récurrence', type: 'select', required: false, options: ['Première fois', 'Récurrent', 'Chronique'] },
          { id: 'mesures_prises', label: 'Mesures prises', type: 'textarea', required: false, placeholder: 'Demande de cesser, mise en demeure...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R623-1 CP', classe: '3e', amendeForfaitaire: '68 €', amendeMinoree: '', amendeMajoree: '180 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // ────────────────────────────────────────────────────────────────────────────
  // FAMILLE 4 : PROPRETÉ URBAINE (3 templates)
  // Sections: 1-4 common, 5=Faits, 6=Qualification, 7=Droits, 8=Transmission, 9=Clôture
  // ────────────────────────────────────────────────────────────────────────────

  // 4.1 — Déjections canines
  {
    id: 'tpl_4_1', ref: '4.1', nom: 'Déjections canines',
    famille: 'Propreté urbaine', familleNum: 4,
    description: 'Art. R632-1 CP — Contravention 1e classe — 38 €',
    article: 'R632-1 CP', classeContravention: '1e',
    amendeForfaitaire: '38 €', amendeMinoree: '', amendeMajoree: '78 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      {
        id: 'faits', label: '5. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_animal', label: "Type d'animal", type: 'text', required: false, placeholder: 'Race, taille, couleur...' },
          { id: 'lieu_precis', label: 'Lieu précis', type: 'text', required: true, placeholder: 'Trottoir, parc, square...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'proprietaire_identifie', label: 'Propriétaire identifié', type: 'text', required: false },
          { id: 'mesures_prises', label: 'Mesures prises', type: 'textarea', required: false, placeholder: 'Demande de nettoyage...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualificationNum6({ article: 'R632-1 CP', classe: '1e', amendeForfaitaire: '38 €', amendeMinoree: '', amendeMajoree: '78 €', retraitPoints: '', texteLoi: '' }),
      sectionDroitsNum7(),
      sectionTransmissionNum8(),
      sectionClotureNum9(),
    ]
  },

  // 4.2 — Dépôt d'ordures sauvage
  {
    id: 'tpl_4_2', ref: '4.2', nom: "Dépôt d'ordures sauvage",
    famille: 'Propreté urbaine', familleNum: 4,
    description: 'Art. R632-1 CP — Contravention 2e classe — 35 €',
    article: 'R632-1 CP', classeContravention: '2e',
    amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      {
        id: 'faits', label: '5. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_dechets', label: 'Type de déchets', type: 'text', required: true, placeholder: 'Ménagers, encombrants, verts...' },
          { id: 'volume_estime', label: 'Volume estimé', type: 'text', required: false, placeholder: 'En litres ou m³' },
          { id: 'lieu_precis', label: 'Lieu précis du dépôt', type: 'text', required: true, placeholder: 'Trottoir, terrain vague, bord de route...' },
          { id: 'conteneur_disponible', label: 'Conteneur disponible à proximité', type: 'select', required: false, options: ['Oui', 'Non'] },
          { id: 'horaire_collecte', label: 'Horaire de collecte', type: 'text', required: false, placeholder: 'Jour et heure de collecte prévus' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualificationNum6({ article: 'R632-1 CP', classe: '2e', amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '', texteLoi: '' }),
      sectionDroitsNum7(),
      sectionTransmissionNum8(),
      sectionClotureNum9(),
    ]
  },

  // 4.3 — Dépôt de gravats / encombrants
  {
    id: 'tpl_4_3', ref: '4.3', nom: 'Dépôt de gravats / encombrants',
    famille: 'Propreté urbaine', familleNum: 4,
    description: 'Art. R635-8 CP — Contravention 5e classe — 1500 €',
    article: 'R635-8 CP', classeContravention: '5e',
    amendeForfaitaire: '1500 €', amendeMinoree: '', amendeMajoree: '1500 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      {
        id: 'faits', label: '5. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_materiaux', label: 'Type de matériaux', type: 'text', required: true, placeholder: 'Gravats, béton, tuiles, meubles...' },
          { id: 'volume_estime', label: 'Volume estimé', type: 'text', required: false, placeholder: 'En m³' },
          { id: 'surface_occupee', label: 'Surface occupée', type: 'text', required: false, placeholder: 'En m²' },
          { id: 'lieu_precis', label: 'Lieu précis du dépôt', type: 'text', required: true, placeholder: 'Voie publique, terrain, trottoir...' },
          { id: 'origine_materiaux', label: 'Origine des matériaux', type: 'text', required: false, placeholder: 'Chantier, déménagement...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualificationNum6({ article: 'R635-8 CP', classe: '5e', amendeForfaitaire: '1500 €', amendeMinoree: '', amendeMajoree: '1500 €', retraitPoints: '', texteLoi: '' }),
      sectionDroitsNum7(),
      sectionTransmissionNum8(),
      sectionClotureNum9(),
    ]
  },

  // ────────────────────────────────────────────────────────────────────────────
  // FAMILLE 5 : ANIMAUX (4 templates)
  // Sections: 1-4 common, 5=Description animal, 6=Faits, 7-10
  // ────────────────────────────────────────────────────────────────────────────

  // 5.1 — Divagation d'animal
  {
    id: 'tpl_5_1', ref: '5.1', nom: "Divagation d'animal",
    famille: 'Animaux', familleNum: 5,
    description: 'Art. R622-2 CP — Contravention 2e classe — 35 €',
    article: 'R622-2 CP', classeContravention: '2e',
    amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionAnimal(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'lieu_capture', label: 'Lieu de capture / observation', type: 'text', required: false, placeholder: 'Adresse précise' },
          { id: 'comportement', label: "Comportement de l'animal", type: 'textarea', required: false, placeholder: 'Calme, agressif, craintif...' },
          { id: 'mesures_prises', label: 'Mesures prises', type: 'textarea', required: false, placeholder: 'Capture, mise en fourrière, restitution...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'R622-2 CP', classe: '2e', amendeForfaitaire: '35 €', amendeMinoree: '22 €', amendeMajoree: '75 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 5.2 — Chien dangereux sans muselière
  {
    id: 'tpl_5_2', ref: '5.2', nom: 'Chien dangereux sans muselière',
    famille: 'Animaux', familleNum: 5,
    description: 'Art. L211-16 CRPM — Contravention 4e classe — 135 €',
    article: 'L211-16 CRPM', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionAnimal(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'categorie_chien', label: 'Catégorie du chien', type: 'select', required: true, options: ['1ère catégorie', '2e catégorie'] },
          { id: 'museliere', label: 'État de la muselière', type: 'select', required: true, options: ['Absente', 'Non conforme'] },
          { id: 'laisse', label: 'État de la laisse', type: 'select', required: false, options: ['Absente', 'Non conforme'] },
          { id: 'comportement', label: "Comportement de l'animal", type: 'textarea', required: false, placeholder: 'Calme, agressif, craintif...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'L211-16 CRPM', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 5.3 — Défaut de déclaration chien catégorisé
  {
    id: 'tpl_5_3', ref: '5.3', nom: 'Défaut de déclaration chien catégorisé',
    famille: 'Animaux', familleNum: 5,
    description: 'Art. L211-14 CRPM — Contravention 4e classe — 135 €',
    article: 'L211-14 CRPM', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionAnimal(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'categorie_chien', label: 'Catégorie du chien', type: 'select', required: true, options: ['1ère catégorie', '2e catégorie'] },
          { id: 'declaration_effectuee', label: 'Déclaration en mairie', type: 'select', required: true, options: ['Non effectuée', 'Incomplète'] },
          { id: 'date_acquisition', label: "Date d'acquisition de l'animal", type: 'date', required: false },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'L211-14 CRPM', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // 5.4 — Défaut d'assurance RC animal
  {
    id: 'tpl_5_4', ref: '5.4', nom: "Défaut d'assurance RC animal",
    famille: 'Animaux', familleNum: 5,
    description: 'Art. L211-15 CRPM — Contravention 3e classe — 68 €',
    article: 'L211-15 CRPM', classeContravention: '3e',
    amendeForfaitaire: '68 €', amendeMinoree: '', amendeMajoree: '180 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      sectionAnimal(),
      {
        id: 'faits', label: '6. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'attestation_rc', label: 'Attestation RC', type: 'select', required: true, options: ['Non présentée', 'Périmée', 'Inexistante'] },
          { id: 'delai_presentation', label: 'Délai accordé pour présentation', type: 'text', required: false, placeholder: 'Ex: 5 jours' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualification({ article: 'L211-15 CRPM', classe: '3e', amendeForfaitaire: '68 €', amendeMinoree: '', amendeMajoree: '180 €', retraitPoints: '', texteLoi: '' }),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ]
  },

  // ────────────────────────────────────────────────────────────────────────────
  // FAMILLE 6 : DOMAINE PUBLIC (3 templates)
  // Sections: 1-4 common, 5=Faits, 6=Qualification, 7=Droits, 8=Transmission, 9=Clôture
  // ────────────────────────────────────────────────────────────────────────────

  // 6.1 — Occupation sans autorisation
  {
    id: 'tpl_6_1', ref: '6.1', nom: 'Occupation sans autorisation',
    famille: 'Domaine public', familleNum: 6,
    description: 'Art. R610-5 CP — Contravention 1e classe — 38 €',
    article: 'R610-5 CP', classeContravention: '1e',
    amendeForfaitaire: '38 €', amendeMinoree: '', amendeMajoree: '78 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      {
        id: 'faits', label: '5. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'nature_occupation', label: "Nature de l'occupation", type: 'select', required: true, options: ['Terrasse', 'Étalage', 'Matériaux', 'Benne', 'Échafaudage', 'Autre'] },
          { id: 'surface_occupee', label: 'Surface occupée', type: 'text', required: false, placeholder: 'En m²' },
          { id: 'duree_occupation', label: "Durée estimée de l'occupation", type: 'text', required: false },
          { id: 'gene_constatee', label: 'Gêne constatée', type: 'textarea', required: false, placeholder: 'Nature de la gêne...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualificationNum6({ article: 'R610-5 CP', classe: '1e', amendeForfaitaire: '38 €', amendeMinoree: '', amendeMajoree: '78 €', retraitPoints: '', texteLoi: '' }),
      sectionDroitsNum7(),
      sectionTransmissionNum8(),
      sectionClotureNum9(),
    ]
  },

  // 6.2 — Travaux sans autorisation
  {
    id: 'tpl_6_2', ref: '6.2', nom: 'Travaux sans autorisation',
    famille: 'Domaine public', familleNum: 6,
    description: 'Arrêté Municipal — Contravention variable',
    article: 'Arrêté Municipal', classeContravention: 'Variable',
    amendeForfaitaire: 'Variable', amendeMinoree: '', amendeMajoree: 'Variable', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      {
        id: 'faits', label: '5. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'nature_travaux', label: 'Nature des travaux', type: 'text', required: true, placeholder: 'Terrassement, pose de clôture, ravalement...' },
          { id: 'surface_concernee', label: 'Surface concernée', type: 'text', required: false, placeholder: 'En m²' },
          { id: 'entreprise', label: 'Entreprise réalisant les travaux', type: 'text', required: false },
          { id: 'autorisation_demandee', label: 'Autorisation demandée', type: 'select', required: true, options: ['Non', 'En cours', 'Refusée'] },
          { id: 'gene_constatee', label: 'Gêne constatée', type: 'textarea', required: false, placeholder: 'Nature de la gêne...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualificationNum6({ article: 'Arrêté Municipal', classe: 'Variable', amendeForfaitaire: 'Variable', amendeMinoree: '', amendeMajoree: 'Variable', retraitPoints: '', texteLoi: '' }),
      sectionDroitsNum7(),
      sectionTransmissionNum8(),
      sectionClotureNum9(),
    ]
  },

  // 6.3 — Dépôt de matériaux sur voie publique
  {
    id: 'tpl_6_3', ref: '6.3', nom: 'Dépôt de matériaux sur voie publique',
    famille: 'Domaine public', familleNum: 6,
    description: 'Art. R644-2 CP — Contravention 4e classe — 135 €',
    article: 'R644-2 CP', classeContravention: '4e',
    amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      {
        id: 'faits', label: '5. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_materiaux', label: 'Type de matériaux', type: 'text', required: true, placeholder: 'Sable, gravier, bois, métal...' },
          { id: 'volume_estime', label: 'Volume estimé', type: 'text', required: false, placeholder: 'En m³' },
          { id: 'surface_occupee', label: 'Surface occupée', type: 'text', required: false, placeholder: 'En m²' },
          { id: 'duree_depot', label: 'Durée estimée du dépôt', type: 'text', required: false },
          { id: 'gene_constatee', label: 'Gêne constatée', type: 'textarea', required: false, placeholder: 'Nature de la gêne...' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualificationNum6({ article: 'R644-2 CP', classe: '4e', amendeForfaitaire: '135 €', amendeMinoree: '90 €', amendeMajoree: '375 €', retraitPoints: '', texteLoi: '' }),
      sectionDroitsNum7(),
      sectionTransmissionNum8(),
      sectionClotureNum9(),
    ]
  },

  // ────────────────────────────────────────────────────────────────────────────
  // FAMILLE 7 : MARCHÉS / COMMERCE (3 templates)
  // Sections: 1-4 common, 5=Faits, 6=Qualification, 7=Droits, 8=Transmission, 9=Clôture
  // ────────────────────────────────────────────────────────────────────────────

  // 7.1 — Débordement hors emplacement
  {
    id: 'tpl_7_1', ref: '7.1', nom: 'Débordement hors emplacement',
    famille: 'Marchés / Commerce', familleNum: 7,
    description: 'Arrêté Municipal — Contravention variable',
    article: 'Arrêté Municipal', classeContravention: 'Variable',
    amendeForfaitaire: 'Variable', amendeMinoree: '', amendeMajoree: 'Variable', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      {
        id: 'faits', label: '5. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_activite', label: "Type d'activité commerciale", type: 'text', required: true, placeholder: 'Fruits et légumes, vêtements, brocante...' },
          { id: 'emplacement_attribue', label: 'Emplacement attribué', type: 'text', required: true, placeholder: 'N° d\'emplacement, allée...' },
          { id: 'surface_debordement', label: 'Surface de débordement', type: 'text', required: false, placeholder: 'En m²' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'gene_constatee', label: 'Gêne constatée', type: 'textarea', required: false, placeholder: 'Gêne à la circulation, aux autres commerçants...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualificationNum6({ article: 'Arrêté Municipal', classe: 'Variable', amendeForfaitaire: 'Variable', amendeMinoree: '', amendeMajoree: 'Variable', retraitPoints: '', texteLoi: '' }),
      sectionDroitsNum7(),
      sectionTransmissionNum8(),
      sectionClotureNum9(),
    ]
  },

  // 7.2 — Non-respect horaires
  {
    id: 'tpl_7_2', ref: '7.2', nom: 'Non-respect horaires',
    famille: 'Marchés / Commerce', familleNum: 7,
    description: 'Arrêté Municipal — Contravention variable',
    article: 'Arrêté Municipal', classeContravention: 'Variable',
    amendeForfaitaire: 'Variable', amendeMinoree: '', amendeMajoree: 'Variable', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      {
        id: 'faits', label: '5. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_activite', label: "Type d'activité commerciale", type: 'text', required: true, placeholder: 'Fruits et légumes, vêtements, brocante...' },
          { id: 'horaire_autorise', label: 'Horaire autorisé', type: 'text', required: true, placeholder: 'Ex: 7h00 — 13h00' },
          { id: 'horaire_constate', label: 'Horaire constaté', type: 'text', required: true, placeholder: 'Ex: activité constatée à 14h30' },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualificationNum6({ article: 'Arrêté Municipal', classe: 'Variable', amendeForfaitaire: 'Variable', amendeMinoree: '', amendeMajoree: 'Variable', retraitPoints: '', texteLoi: '' }),
      sectionDroitsNum7(),
      sectionTransmissionNum8(),
      sectionClotureNum9(),
    ]
  },

  // 7.3 — Vente ambulante sans autorisation
  {
    id: 'tpl_7_3', ref: '7.3', nom: 'Vente ambulante sans autorisation',
    famille: 'Marchés / Commerce', familleNum: 7,
    description: 'Arrêté Municipal — Contravention variable',
    article: 'Arrêté Municipal', classeContravention: 'Variable',
    amendeForfaitaire: 'Variable', amendeMinoree: '', amendeMajoree: 'Variable', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionDateLieu(),
      sectionContrevenant(),
      {
        id: 'faits', label: '5. Faits constatés', fields: [
          { id: 'circonstances', label: 'Circonstances', type: 'textarea', required: true, placeholder: 'Décrivez les circonstances...' },
          { id: 'type_activite', label: "Type d'activité commerciale", type: 'text', required: true, placeholder: 'Vente de nourriture, bijoux, vêtements...' },
          { id: 'lieu_vente', label: 'Lieu de vente', type: 'text', required: true, placeholder: 'Rue, place, marché...' },
          { id: 'autorisation', label: 'Autorisation de vente', type: 'select', required: true, options: ['Non présentée', 'Inexistante', 'Périmée'] },
          { id: 'description_faits', label: 'Description précise des faits', type: 'textarea', required: true, placeholder: 'Description détaillée...' },
          { id: 'declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
          { id: 'temoins', label: 'Témoins', type: 'textarea', required: false, placeholder: 'Nom, prénom et coordonnées des témoins' },
        ]
      },
      sectionQualificationNum6({ article: 'Arrêté Municipal', classe: 'Variable', amendeForfaitaire: 'Variable', amendeMinoree: '', amendeMajoree: 'Variable', retraitPoints: '', texteLoi: '' }),
      sectionDroitsNum7(),
      sectionTransmissionNum8(),
      sectionClotureNum9(),
    ]
  },

];

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════════════════

export { BUILTIN_TEMPLATES };
export default BUILTIN_TEMPLATES;
