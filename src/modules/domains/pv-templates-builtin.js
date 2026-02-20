// PV — 37 built-in templates for Police Municipale OMP 2026
// Each template describes the sections and fields of a PV form
// Common sections are factored via helper functions

// ============================================================
// SECTION FACTORIES — Shared sections across all PV templates
// ============================================================

function sectionIdentification() {
  return {
    id: 'identification',
    label: '1. Identification du procès-verbal',
    fields: [
      { id: 'numero_pv', label: 'Numéro du PV', type: 'text', required: true, placeholder: 'Auto-généré' },
      { id: 'date_redaction', label: 'Date de rédaction', type: 'date', required: true },
      { id: 'type_infraction', label: "Type d'infraction", type: 'text', required: true },
      { id: 'fondement_legal', label: 'Fondement légal', type: 'text', required: true },
    ],
  };
}

function sectionAgent() {
  return {
    id: 'agent',
    label: '2. Agent verbalisateur',
    fields: [
      { id: 'grade', label: 'Grade', type: 'select', required: true, options: ['Gardien-Brigadier', 'Brigadier', 'Brigadier-chef principal', 'Chef de service PM'] },
      { id: 'nom_agent', label: 'Nom et prénom', type: 'text', required: true, placeholder: 'NOM Prénom' },
      { id: 'matricule', label: 'Matricule', type: 'text', required: true },
      { id: 'service', label: 'Service', type: 'text', required: true, placeholder: 'Police Municipale de...' },
      { id: 'agent_serment', label: 'Assermenté et agréé', type: 'select', required: true, options: ['Oui', 'Non'] },
      { id: 'collegue_nom', label: 'Collègue présent (nom)', type: 'text', required: false },
      { id: 'collegue_matricule', label: 'Collègue (matricule)', type: 'text', required: false },
    ],
  };
}

function sectionConstatation() {
  return {
    id: 'constatation',
    label: '3. Date, heure et lieu de constatation',
    fields: [
      { id: 'date_constatation', label: 'Date de constatation', type: 'date', required: true },
      { id: 'heure_constatation', label: 'Heure', type: 'time', required: true },
      { id: 'adresse', label: 'Adresse / lieu précis', type: 'text', required: true, placeholder: 'N°, rue, commune' },
      { id: 'reperes', label: 'Repères / complément', type: 'text', required: false, placeholder: 'Face au n°, angle rue...' },
      { id: 'commune', label: 'Commune', type: 'text', required: true },
      { id: 'conditions_meteo', label: 'Conditions météo', type: 'select', required: false, options: ['Beau temps', 'Couvert', 'Pluie', 'Neige', 'Brouillard', 'Nuit'] },
    ],
  };
}

function sectionContrevenant() {
  return {
    id: 'contrevenant',
    label: '4. Identification du contrevenant',
    fields: [
      { id: 'ctrv_nom', label: 'Nom', type: 'text', required: true },
      { id: 'ctrv_prenom', label: 'Prénom', type: 'text', required: true },
      { id: 'ctrv_naissance_date', label: 'Date de naissance', type: 'date', required: true },
      { id: 'ctrv_naissance_lieu', label: 'Lieu de naissance', type: 'text', required: true },
      { id: 'ctrv_adresse', label: 'Adresse complète', type: 'textarea', required: true, placeholder: 'N°, rue, CP, ville' },
      { id: 'ctrv_nationalite', label: 'Nationalité', type: 'text', required: false, placeholder: 'Française' },
      { id: 'ctrv_profession', label: 'Profession', type: 'text', required: false },
      { id: 'ctrv_piece_id', label: "Pièce d'identité", type: 'select', required: true, options: ['CNI', 'Passeport', 'Permis de conduire', 'Titre de séjour', 'Autre'] },
      { id: 'ctrv_num_piece', label: 'Numéro pièce', type: 'text', required: true },
      { id: 'ctrv_pm_raison', label: 'Personne morale — Raison sociale', type: 'text', required: false },
      { id: 'ctrv_pm_siret', label: 'N° SIRET', type: 'text', required: false },
      { id: 'ctrv_pm_representant', label: 'Représentant légal', type: 'text', required: false },
    ],
  };
}

function sectionVehicule() {
  return {
    id: 'vehicule',
    label: '5. Identification du véhicule',
    fields: [
      { id: 'veh_immat', label: 'Immatriculation', type: 'text', required: true, placeholder: 'AA-123-BB' },
      { id: 'veh_marque', label: 'Marque', type: 'text', required: true },
      { id: 'veh_modele', label: 'Modèle', type: 'text', required: false },
      { id: 'veh_couleur', label: 'Couleur', type: 'text', required: true },
      { id: 'veh_type', label: 'Type / Carrosserie', type: 'select', required: false, options: ['Berline', 'Break', 'SUV', 'Utilitaire', 'Camion', 'Moto', 'Scooter', 'Vélo', 'Autre'] },
      { id: 'veh_pays', label: "Pays d'immatriculation", type: 'text', required: false, placeholder: 'France' },
    ],
  };
}

// ============================================================
// FAMILY-SPECIFIC FAITS SECTIONS
// ============================================================

function sectionFaitsStationnement() {
  return {
    id: 'faits',
    label: '6. Faits constatés',
    fields: [
      { id: 'faits_circonstances', label: 'Circonstances de la constatation', type: 'textarea', required: true, placeholder: "Décrivez les circonstances dans lesquelles l'infraction a été constatée" },
      { id: 'faits_description', label: "Description de l'infraction", type: 'textarea', required: true, placeholder: 'Description détaillée du stationnement irrégulier' },
      { id: 'faits_signalisation', label: 'Signalisation présente', type: 'textarea', required: false, placeholder: 'Panneaux, marquages au sol, etc.' },
      { id: 'faits_gene', label: 'Gêne occasionnée', type: 'textarea', required: false, placeholder: 'Nature de la gêne pour la circulation ou les piétons' },
      { id: 'faits_photos', label: 'Photos / preuves', type: 'select', required: false, options: ['Oui — photos jointes', 'Non'] },
      { id: 'faits_temoins', label: 'Témoins éventuels', type: 'text', required: false },
      { id: 'faits_declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
    ],
  };
}

function sectionFaitsCirculation() {
  return {
    id: 'faits',
    label: '6. Faits constatés',
    fields: [
      { id: 'faits_circonstances', label: 'Circonstances de la constatation', type: 'textarea', required: true, placeholder: "Décrivez les circonstances" },
      { id: 'faits_description', label: "Description de l'infraction", type: 'textarea', required: true, placeholder: "Description détaillée de l'infraction routière" },
      { id: 'faits_vitesse_relevee', label: 'Vitesse relevée (km/h)', type: 'text', required: false, placeholder: 'Si excès de vitesse' },
      { id: 'faits_vitesse_retenue', label: 'Vitesse retenue (km/h)', type: 'text', required: false, placeholder: 'Après marge technique' },
      { id: 'faits_vitesse_autorisee', label: 'Vitesse autorisée (km/h)', type: 'text', required: false },
      { id: 'faits_moyen_constatation', label: 'Moyen de constatation', type: 'select', required: false, options: ['Visuel', 'Cinémomètre', 'Radar embarqué', 'Vidéo-verbalisation', 'Autre'] },
      { id: 'faits_signalisation', label: 'Signalisation présente', type: 'textarea', required: false },
      { id: 'faits_photos', label: 'Photos / preuves', type: 'select', required: false, options: ['Oui — photos jointes', 'Non'] },
      { id: 'faits_temoins', label: 'Témoins', type: 'text', required: false },
      { id: 'faits_declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
    ],
  };
}

function sectionCirconstancesIntervention() {
  return {
    id: 'circonstances',
    label: "5. Circonstances de l'intervention",
    fields: [
      { id: 'inter_origine', label: "Origine de l'intervention", type: 'select', required: true, options: ['Plainte d\'un riverain', 'Appel au 17', 'Ronde de surveillance', 'Signalement mairie', 'Constatation directe'] },
      { id: 'inter_plaignant', label: 'Identité du plaignant', type: 'text', required: false, placeholder: 'Nom, adresse (si souhaite rester anonyme, indiquer)' },
      { id: 'inter_heure_appel', label: "Heure de l'appel/signalement", type: 'time', required: false },
      { id: 'inter_heure_arrivee', label: "Heure d'arrivée sur place", type: 'time', required: true },
      { id: 'inter_heure_fin', label: "Heure de fin d'intervention", type: 'time', required: false },
    ],
  };
}

function sectionFaitsTapage() {
  return {
    id: 'faits',
    label: '6. Faits constatés — Troubles à la tranquillité',
    fields: [
      { id: 'faits_nature', label: 'Nature du trouble', type: 'select', required: true, options: ['Musique amplifiée', 'Cris / disputes', 'Travaux bruyants', 'Fête privée', 'Activité professionnelle', 'Aboiements', 'Autre'] },
      { id: 'faits_description', label: 'Description détaillée', type: 'textarea', required: true },
      { id: 'faits_niveau_sonore', label: 'Niveau sonore constaté', type: 'select', required: false, options: ['Audible depuis la voie publique', 'Audible depuis les logements voisins', 'Excessif — conversation impossible à proximité', 'Mesuré par sonomètre'] },
      { id: 'faits_duree', label: 'Durée estimée du trouble', type: 'text', required: false, placeholder: 'Ex: environ 2 heures' },
      { id: 'faits_repetition', label: 'Caractère répétitif', type: 'select', required: false, options: ['Première fois signalé', 'Récurrent — déjà signalé', 'Habituel — multiples plaintes'] },
      { id: 'faits_mesures', label: 'Mesures prises sur place', type: 'textarea', required: false, placeholder: 'Demande de baisser le volume, avertissement verbal, etc.' },
      { id: 'faits_temoins', label: 'Témoins', type: 'text', required: false },
      { id: 'faits_declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
    ],
  };
}

function sectionFaitsProprete() {
  return {
    id: 'faits',
    label: '5. Faits constatés — Atteinte à la propreté',
    fields: [
      { id: 'faits_type_dechet', label: 'Type de déchets / dépôt', type: 'select', required: true, options: ['Déjections canines', 'Ordures ménagères', 'Encombrants', 'Gravats / matériaux', 'Déchets verts', 'Déchets dangereux', 'Autre'] },
      { id: 'faits_volume', label: 'Volume / quantité estimée', type: 'text', required: false, placeholder: 'Ex: environ 2 m³' },
      { id: 'faits_lieu_precis', label: 'Lieu précis du dépôt', type: 'textarea', required: true, placeholder: 'Sur la voie publique, trottoir, espace vert, etc.' },
      { id: 'faits_description', label: 'Description détaillée', type: 'textarea', required: true },
      { id: 'faits_impact', label: 'Impact constaté', type: 'textarea', required: false, placeholder: 'Gêne pour les piétons, risque sanitaire, atteinte au cadre de vie' },
      { id: 'faits_photos', label: 'Photos / preuves', type: 'select', required: false, options: ['Oui — photos jointes', 'Non'] },
      { id: 'faits_declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
    ],
  };
}

function sectionAnimal() {
  return {
    id: 'animal',
    label: "5. Description de l'animal",
    fields: [
      { id: 'animal_espece', label: 'Espèce', type: 'select', required: true, options: ['Chien', 'Chat', 'NAC', 'Autre'] },
      { id: 'animal_race', label: 'Race', type: 'text', required: false },
      { id: 'animal_categorie', label: 'Catégorie (chien)', type: 'select', required: false, options: ['Non catégorisé', '1re catégorie — attaque', '2e catégorie — garde et défense'] },
      { id: 'animal_nom', label: "Nom de l'animal", type: 'text', required: false },
      { id: 'animal_signalement', label: 'Signalement (couleur, taille, signes distinctifs)', type: 'textarea', required: true },
      { id: 'animal_puce', label: 'Identification (puce / tatouage)', type: 'select', required: false, options: ['Pucé — numéro connu', 'Tatoué', 'Non identifié', 'Non vérifié'] },
      { id: 'animal_num_puce', label: 'N° identification', type: 'text', required: false },
      { id: 'animal_vaccination', label: 'Vaccination antirabique', type: 'select', required: false, options: ['À jour', 'Périmée', 'Inconnue', 'Non présentée'] },
    ],
  };
}

function sectionFaitsAnimaux() {
  return {
    id: 'faits',
    label: '6. Faits constatés — Animaux',
    fields: [
      { id: 'faits_description', label: 'Description des faits', type: 'textarea', required: true },
      { id: 'faits_laisse', label: 'Animal tenu en laisse', type: 'select', required: false, options: ['Oui', 'Non', 'Non applicable'] },
      { id: 'faits_museliere', label: 'Muselière portée', type: 'select', required: false, options: ['Oui', 'Non', 'Non applicable', 'Non obligatoire'] },
      { id: 'faits_comportement', label: "Comportement de l'animal", type: 'textarea', required: false, placeholder: 'Agressif, en divagation, calme, etc.' },
      { id: 'faits_victimes', label: 'Victimes éventuelles', type: 'text', required: false },
      { id: 'faits_mesures', label: 'Mesures prises', type: 'textarea', required: false, placeholder: 'Capture, mise en fourrière, avertissement...' },
      { id: 'faits_declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
    ],
  };
}

function sectionFaitsDomainePublic() {
  return {
    id: 'faits',
    label: '5. Faits constatés — Atteinte au domaine public',
    fields: [
      { id: 'faits_nature', label: "Nature de l'occupation / atteinte", type: 'select', required: true, options: ['Terrasse non autorisée', 'Étalage débordant', 'Entreposage de matériaux', 'Travaux sans autorisation', 'Dégradation mobilier urbain', 'Affichage sauvage', 'Autre'] },
      { id: 'faits_surface', label: 'Surface occupée (m²)', type: 'text', required: false },
      { id: 'faits_duree', label: 'Durée estimée', type: 'text', required: false, placeholder: 'Ex: depuis 3 jours' },
      { id: 'faits_autorisation', label: 'Autorisation municipale', type: 'select', required: true, options: ['Aucune autorisation', 'Autorisation expirée', 'Dépassement de l\'autorisation', 'Autorisation révoquée'] },
      { id: 'faits_description', label: 'Description détaillée', type: 'textarea', required: true },
      { id: 'faits_gene', label: 'Gêne pour le public', type: 'textarea', required: false },
      { id: 'faits_photos', label: 'Photos / preuves', type: 'select', required: false, options: ['Oui — photos jointes', 'Non'] },
      { id: 'faits_declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
    ],
  };
}

function sectionFaitsMarches() {
  return {
    id: 'faits',
    label: '5. Faits constatés — Marchés et commerce',
    fields: [
      { id: 'faits_type_activite', label: "Type d'activité commerciale", type: 'text', required: true, placeholder: 'Ex: vente de fruits et légumes' },
      { id: 'faits_emplacement', label: 'Emplacement attribué', type: 'text', required: false, placeholder: 'N° emplacement ou zone' },
      { id: 'faits_emplacement_reel', label: 'Emplacement réel constaté', type: 'text', required: false },
      { id: 'faits_autorisation', label: 'Autorisation / titre', type: 'select', required: true, options: ['Aucune autorisation', 'Autorisation de marché valide', 'Autorisation expirée', 'Carte de commerçant ambulant', 'Pas de carte ambulant'] },
      { id: 'faits_num_autorisation', label: "N° d'autorisation", type: 'text', required: false },
      { id: 'faits_description', label: 'Description détaillée', type: 'textarea', required: true },
      { id: 'faits_gene', label: 'Gêne constatée', type: 'textarea', required: false },
      { id: 'faits_declarations', label: 'Déclarations du contrevenant', type: 'textarea', required: false },
    ],
  };
}

// ============================================================
// ARRÊTÉ MUNICIPAL — SECTION FACTORIES (Famille 8)
// ============================================================

function sectionArreteEnTete() {
  return {
    id: 'arrete_entete',
    label: '1. En-tête et identification',
    fields: [
      { id: 'commune', label: 'Commune', type: 'text', required: true, placeholder: 'Nom de la commune' },
      { id: 'code_postal', label: 'Code postal', type: 'text', required: true },
      { id: 'telephone_mairie', label: 'Téléphone mairie', type: 'text', required: false },
      { id: 'email_mairie', label: 'Email mairie', type: 'text', required: false },
      { id: 'numero_arrete', label: "Numéro de l'arrêté", type: 'text', required: true, placeholder: 'Ex: AM-2026-001' },
      { id: 'date_arrete', label: "Date de l'arrêté", type: 'date', required: true },
    ],
  };
}

function sectionArreteVisas() {
  return {
    id: 'arrete_visas',
    label: '2. Visas et considérants',
    fields: [
      { id: 'visas_fixed', label: 'Fondements juridiques', type: 'fixed', fixedValue: "VU le Code général des collectivités territoriales (CGCT), notamment ses articles L2212-1 et suivants relatifs aux pouvoirs de police du maire ;\nVU le Code de la route, notamment ses articles R417-10 et suivants relatifs au stationnement ;\nVU le Code pénal, notamment ses articles R622-2, R623-1, R623-2, R632-1 et R635-1 ;\nVU le Code de procédure pénale, notamment son article 21 relatif aux attributions des agents de police judiciaire adjoints ;\nVU la loi n°99-5 du 6 janvier 1999 relative aux animaux dangereux et errants et à la protection des animaux ;\nCONSIDÉRANT la nécessité d'assurer la sécurité, la tranquillité et la salubrité publiques sur le territoire de la commune ;\nCONSIDÉRANT que les infractions constatées au présent arrêté peuvent être relevées par les agents de la Police Municipale, APJA au sens de l'article 21 du Code de procédure pénale ;" },
      { id: 'date_deliberation', label: 'Date de la délibération du Conseil Municipal', type: 'date', required: true },
    ],
  };
}

function sectionArreteStationnement() {
  return {
    id: 'arrete_chap1',
    label: 'Chap. I — Stationnement et circulation',
    fields: [
      { id: 'art1_fixed', label: 'Articles 1 à 4', type: 'fixed', fixedValue: "Article 1 — Stationnement gênant et dangereux\nIl est interdit de laisser stationner tout véhicule de façon à constituer une gêne ou un danger pour la circulation publique sur l'ensemble du territoire communal. Est notamment interdit tout stationnement obstruant les trottoirs, les passages piétons, les sorties de garage, les accès aux bâtiments de secours, les bouches d'incendie et les voies réservées aux véhicules prioritaires.\n\nArticle 2 — Stationnement en zone bleue\nDans les zones réglementées par disque de stationnement (zones bleues), tout véhicule doit afficher un disque réglementaire, correctement réglé à l'heure d'arrivée.\n\nArticle 3 — Stationnement réservé\nLes emplacements réservés aux personnes en situation de handicap ne peuvent être occupés que par des véhicules arborant visiblement la carte européenne de stationnement.\n\nArticle 4 — Zones piétonnes et couloirs de bus\nTout stationnement et tout arrêt est interdit dans les zones piétonnes et dans les couloirs réservés aux transports en commun." },
      { id: 'duree_zone_bleue', label: 'Durée maximale zone bleue', type: 'text', required: false, placeholder: 'Ex: 1h30' },
    ],
  };
}

function sectionArreteProprete() {
  return {
    id: 'arrete_chap2',
    label: 'Chap. II — Propreté urbaine et salubrité',
    fields: [
      { id: 'art5_7_fixed', label: 'Articles 5 à 7', type: 'fixed', fixedValue: "Article 5 — Déjections canines\nIl est fait obligation à tout propriétaire ou détenteur d'un animal de ramasser immédiatement les déjections de celui-ci sur les voies et espaces publics de la commune. Le non-respect est passible d'une amende (art. R632-1 CP).\n\nArticle 6 — Dépôts sauvages d'ordures et de déchets\nIl est interdit de déposer, d'abandonner ou de déverser des ordures, déchets, gravats hors des emplacements désignés. Les déchets ménagers doivent être déposés dans les bacs réglementaires aux jours et heures de collecte.\n\nArticle 7 — Affichage sauvage\nIl est interdit d'apposer des affiches, tracts ou tout autre support sur les murs, clôtures, mobiliers urbains et équipements publics, sauf dans les espaces réservés à cet effet." },
      { id: 'liste_points_distribution', label: 'Points de distribution de sachets canins', type: 'textarea', required: false, placeholder: 'Parc central, square de la Liberté, etc.' },
      { id: 'adresse_dechetterie', label: 'Adresse de la déchetterie', type: 'text', required: false },
      { id: 'horaires_dechetterie', label: 'Horaires de la déchetterie', type: 'text', required: false },
    ],
  };
}

function sectionArreteTranquillite() {
  return {
    id: 'arrete_chap3',
    label: 'Chap. III — Tranquillité publique',
    fields: [
      { id: 'art8_10_fixed', label: 'Articles 8 à 10', type: 'fixed', fixedValue: "Article 8 — Bruits de voisinage et tapage nocturne\nConformément aux articles R623-1 et R623-2 du Code pénal, tout bruit de nature à troubler la tranquillité du voisinage est interdit. Sont prohibés les bruits répétés, intenses ou prolongés causés par des activités domestiques, des instruments de musique, des systèmes de sonorisation, des travaux de bricolage ou d'entretien en dehors des horaires autorisés.\n\nArticle 9 — Tapage nocturne\nEntre les heures de nuit, tout bruit ou tapage injurieux troublant la tranquillité d'autrui est formellement interdit. Toute manifestation sonore susceptible de troubler les riverains doit faire l'objet d'une déclaration préalable en mairie.\n\nArticle 10 — Travaux bruyants\nLes travaux de construction, démolition ou rénovation générant des nuisances sonores sont autorisés uniquement selon les plages horaires définies ci-dessous. Ils sont interdits les dimanches et jours fériés." },
      { id: 'heure_debut_nuit', label: 'Heure de début de nuit', type: 'time', required: false, placeholder: '22:00' },
      { id: 'heure_fin_nuit', label: 'Heure de fin de nuit', type: 'time', required: false, placeholder: '07:00' },
      { id: 'heure_debut_travaux_semaine', label: 'Travaux semaine — début', type: 'time', required: false },
      { id: 'heure_fin_travaux_semaine', label: 'Travaux semaine — fin', type: 'time', required: false },
      { id: 'heure_sam_debut', label: 'Travaux samedi — début', type: 'time', required: false },
      { id: 'heure_sam_fin', label: 'Travaux samedi — fin', type: 'time', required: false },
    ],
  };
}

function sectionArreteAnimaux() {
  return {
    id: 'arrete_chap4',
    label: 'Chap. IV — Animaux sur la voie publique',
    fields: [
      { id: 'art11_14_fixed', label: 'Articles 11 à 14', type: 'fixed', fixedValue: "Article 11 — Tenue des animaux en laisse\nTout animal domestique évoluant sur la voie publique, dans les parcs et espaces publics doit être tenu en laisse.\n\nArticle 12 — Animaux en divagation\nLa divagation de tout animal domestique est interdite (art. R622-2 CP). Tout animal en divagation pourra être capturé et conduit en fourrière. Les frais seront à la charge du propriétaire.\n\nArticle 13 — Chiens dangereux — catégories 1 et 2\nLes chiens de 1re catégorie (attaque) sont interdits sur la voie publique et lieux publics. Les chiens de 2e catégorie (garde/défense) doivent être tenus en laisse et muselés. Les propriétaires doivent présenter : déclaration en mairie, attestation d'assurance RC, justificatif d'identification.\n\nArticle 14 — Accès aux espaces publics avec animaux\nL'accès à certains espaces est interdit aux animaux. Des espaces aménagés pour les chiens sont accessibles." },
      { id: 'nom_fourriere', label: 'Nom de la fourrière', type: 'text', required: false },
      { id: 'adresse_fourriere', label: 'Adresse de la fourrière', type: 'text', required: false },
      { id: 'liste_espaces_interdits_animaux', label: 'Espaces interdits aux animaux', type: 'textarea', required: false, placeholder: 'Marché couvert, aire de jeux, cimetière...' },
      { id: 'localisation_dog_parks', label: 'Espaces canins (dog parks)', type: 'textarea', required: false, placeholder: 'Parc du Centre, Espace canin des Tilleuls...' },
    ],
  };
}

function sectionArreteDispositions() {
  return {
    id: 'arrete_chap5',
    label: 'Chap. V — Dispositions pénales et finales',
    fields: [
      { id: 'art15_fixed', label: 'Article 15 — Sanctions', type: 'fixed', fixedValue: "Les infractions sont constatées par les agents de la Police Municipale (APJA, art. 21 CPP) et transmises à l'OMP :\n\n• Contraventions de 1re classe (38 €) : déjections canines (R632-1 CP), occupation domaine public (R610-5 CP)\n• Contraventions de 2e classe (35 à 68 €) : stationnement gênant (R417-10 CDR), dépôt sauvage (R632-1 CP)\n• Contraventions de 3e classe (68 €) : bruits de voisinage et tapage nocturne (R623-1 / R623-2 CP)\n• Contraventions de 4e classe (135 €) : stationnement dangereux (R417-11 CDR), zone handicapés (R417-10 III CDR), chiens dangereux (L211-16 CRPM)\n• Contraventions de 5e classe (jusqu'à 1 500 €) : dépôt de gravats (R635-8 CP), dégradations légères (R635-1 CP)" },
      { id: 'numero_arrete_abroge', label: "N° de l'arrêté abrogé", type: 'text', required: false, placeholder: 'Ex: AM-2024-012' },
      { id: 'date_arrete_abroge', label: "Date de l'arrêté abrogé", type: 'date', required: false },
      { id: 'sous_prefecture', label: 'Sous-Préfecture', type: 'text', required: false },
      { id: 'ville_tribunal', label: 'Ville du Tribunal judiciaire', type: 'text', required: false },
      { id: 'commissariat_gendarmerie', label: 'Commissariat / Gendarmerie', type: 'text', required: false },
      { id: 'date_entree_vigueur', label: "Date d'entrée en vigueur", type: 'date', required: true },
    ],
  };
}

function sectionArreteSignature() {
  return {
    id: 'arrete_signature',
    label: 'Signature du Maire',
    fields: [
      { id: 'commune_signature', label: 'Fait à', type: 'text', required: true, placeholder: 'Commune' },
      { id: 'date_signature', label: 'Le', type: 'date', required: true },
      { id: 'prenom_nom_maire', label: 'Prénom et nom du Maire', type: 'text', required: true, placeholder: 'PRÉNOM NOM' },
      { id: 'signature_maire', label: 'Signature et cachet', type: 'signature', required: true },
    ],
  };
}

// ============================================================
// SHARED CLOSING SECTIONS
// ============================================================

function sectionQualification(article, classeContravention, amendeFF, amendeMin, amendeMaj, retraitPoints = '') {
  const fields = [
    { id: 'qual_article', label: 'Article applicable', type: 'text', required: true },
    { id: 'qual_fixed_article', label: 'Texte de loi applicable', type: 'fixed', fixedValue: `Article ${article}` },
    { id: 'qual_classe', label: 'Classe de contravention', type: 'text', required: true },
    { id: 'qual_fixed_bareme', label: 'Barème des amendes', type: 'fixed', fixedValue: `Amende forfaitaire : ${amendeFF}\u20AC\nAmende minorée : ${amendeMin}\u20AC\nAmende majorée : ${amendeMaj}\u20AC${retraitPoints ? '\nRetrait de points : ' + retraitPoints : ''}` },
    { id: 'qual_transmission', label: 'Transmission au Parquet', type: 'select', required: false, options: ['Non — paiement forfaitaire', 'Oui — infractions multiples', 'Oui — refus de paiement', 'Oui — récidive'] },
  ];
  return {
    id: 'qualification',
    label: '7. Qualification juridique',
    fields,
  };
}

function sectionDroits() {
  return {
    id: 'droits',
    label: '8. Droits du contrevenant',
    fields: [
      { id: 'droits_fixed', label: 'Information des droits', type: 'fixed', fixedValue: "Conformément aux articles 529 et suivants du Code de procédure pénale, le contrevenant est informé :\n\n\u2022 Qu'il dispose d'un délai de 45 jours pour payer l'amende forfaitaire\n\u2022 Qu'il peut contester la contravention dans un délai de 45 jours par requête en exonération\n\u2022 Que le défaut de paiement ou de contestation dans les délais entraîne une amende majorée\n\u2022 Qu'il peut formuler des observations au verso du présent avis" },
      { id: 'droits_modalite', label: 'Modalité de remise', type: 'select', required: true, options: ['Remis en main propre', 'Déposé sur le véhicule', 'Envoyé par courrier', 'Envoyé en RAR'] },
      { id: 'droits_observations', label: 'Observations du contrevenant', type: 'textarea', required: false },
    ],
  };
}

function sectionTransmission() {
  return {
    id: 'transmission',
    label: '9. Transmission',
    fields: [
      { id: 'trans_destinataire', label: 'Destinataire OMP', type: 'text', required: true, placeholder: "Officier du Ministère Public — Tribunal de Police de..." },
      { id: 'trans_date', label: "Date d'envoi", type: 'date', required: false },
      { id: 'trans_annexes', label: 'Annexes jointes', type: 'textarea', required: false, placeholder: 'Photos, PV complémentaire, témoignages...' },
    ],
  };
}

function sectionCloture() {
  return {
    id: 'cloture',
    label: '10. Clôture et signature',
    fields: [
      { id: 'cloture_lieu', label: 'Fait à', type: 'text', required: true, placeholder: 'Commune' },
      { id: 'cloture_date', label: 'Le', type: 'date', required: true },
      { id: 'cloture_heure', label: 'À', type: 'time', required: true },
      { id: 'signature_agent', label: "Signature de l'agent", type: 'signature', required: true },
      { id: 'cloture_grade_nom', label: "Grade et nom de l'agent", type: 'text', required: true },
    ],
  };
}

// ============================================================
// 36 BUILT-IN TEMPLATES
// ============================================================

export const BUILTIN_TEMPLATES = [

  // ──────────────────────────────────────────────────────────
  // FAMILY 1: STATIONNEMENT (9 templates)
  // ──────────────────────────────────────────────────────────

  {
    id: 'tpl_1_1',
    ref: '1.1',
    nom: 'Stationnement gênant',
    famille: 'Stationnement',
    familleNum: 1,
    description: 'Art. R417-10 CDR — Contravention 2e classe',
    article: 'R417-10 CDR',
    classeContravention: '2e',
    amendeForFaitaire: '35',
    amendeMinoree: '22',
    amendeMajoree: '75',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsStationnement(),
      sectionQualification('R417-10 CDR', '2e', '35', '22', '75'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_1_2',
    ref: '1.2',
    nom: 'Stationnement dangereux',
    famille: 'Stationnement',
    familleNum: 1,
    description: 'Art. R417-11 CDR — Contravention 4e classe',
    article: 'R417-11 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsStationnement(),
      sectionQualification('R417-11 CDR', '4e', '135', '90', '375'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_1_3',
    ref: '1.3',
    nom: 'Non-respect zone bleue',
    famille: 'Stationnement',
    familleNum: 1,
    description: 'Art. R417-3 CDR — Contravention 2e classe',
    article: 'R417-3 CDR',
    classeContravention: '2e',
    amendeForFaitaire: '35',
    amendeMinoree: '22',
    amendeMajoree: '75',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsStationnement(),
      sectionQualification('R417-3 CDR', '2e', '35', '22', '75'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_1_4',
    ref: '1.4',
    nom: 'Stationnement zone piétonne',
    famille: 'Stationnement',
    familleNum: 1,
    description: 'Art. R417-6 CDR — Contravention 4e classe',
    article: 'R417-6 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsStationnement(),
      sectionQualification('R417-6 CDR', '4e', '135', '90', '375'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_1_5',
    ref: '1.5',
    nom: 'Stationnement couloir de bus',
    famille: 'Stationnement',
    familleNum: 1,
    description: 'Art. R417-10 CDR — Contravention 2e classe',
    article: 'R417-10 CDR',
    classeContravention: '2e',
    amendeForFaitaire: '35',
    amendeMinoree: '22',
    amendeMajoree: '75',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsStationnement(),
      sectionQualification('R417-10 CDR', '2e', '35', '22', '75'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_1_6',
    ref: '1.6',
    nom: 'Stationnement place handicapés',
    famille: 'Stationnement',
    familleNum: 1,
    description: 'Art. R417-10 III CDR — Contravention 4e classe',
    article: 'R417-10 III CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsStationnement(),
      sectionQualification('R417-10 III CDR', '4e', '135', '90', '375'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_1_7',
    ref: '1.7',
    nom: 'Stationnement trottoir/passage piéton',
    famille: 'Stationnement',
    familleNum: 1,
    description: 'Art. R417-10 CDR — Contravention 2e classe',
    article: 'R417-10 CDR',
    classeContravention: '2e',
    amendeForFaitaire: '35',
    amendeMinoree: '22',
    amendeMajoree: '75',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsStationnement(),
      sectionQualification('R417-10 CDR', '2e', '35', '22', '75'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_1_8',
    ref: '1.8',
    nom: 'Obstruction garage/sortie secours',
    famille: 'Stationnement',
    familleNum: 1,
    description: 'Art. R417-10 CDR — Contravention 2e classe',
    article: 'R417-10 CDR',
    classeContravention: '2e',
    amendeForFaitaire: '35',
    amendeMinoree: '22',
    amendeMajoree: '75',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsStationnement(),
      sectionQualification('R417-10 CDR', '2e', '35', '22', '75'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_1_9',
    ref: '1.9',
    nom: 'Stationnement axe rouge',
    famille: 'Stationnement',
    familleNum: 1,
    description: 'Art. R417-10 CDR — Contravention 2e classe',
    article: 'R417-10 CDR',
    classeContravention: '2e',
    amendeForFaitaire: '35',
    amendeMinoree: '22',
    amendeMajoree: '75',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsStationnement(),
      sectionQualification('R417-10 CDR', '2e', '35', '22', '75'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  // ──────────────────────────────────────────────────────────
  // FAMILY 2: CIRCULATION (12 templates)
  // ──────────────────────────────────────────────────────────

  {
    id: 'tpl_2_1',
    ref: '2.1',
    nom: 'Excès de vitesse (<20km/h en ville)',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R413-14 CDR — Contravention 4e classe',
    article: 'R413-14 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '1',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R413-14 CDR', '4e', '135', '90', '375', '1'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_2',
    ref: '2.2',
    nom: 'Excès de vitesse (20-30km/h)',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R413-14 CDR — Contravention 4e classe',
    article: 'R413-14 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '2',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R413-14 CDR', '4e', '135', '90', '375', '2'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_3',
    ref: '2.3',
    nom: 'Non-respect feu rouge',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R412-30 CDR — Contravention 4e classe',
    article: 'R412-30 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '4',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R412-30 CDR', '4e', '135', '90', '375', '4'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_4',
    ref: '2.4',
    nom: 'Non-respect stop',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R415-6 CDR — Contravention 4e classe',
    article: 'R415-6 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '4',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R415-6 CDR', '4e', '135', '90', '375', '4'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_5',
    ref: '2.5',
    nom: 'Circulation en sens interdit',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R412-28 CDR — Contravention 4e classe',
    article: 'R412-28 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '4',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R412-28 CDR', '4e', '135', '90', '375', '4'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_6',
    ref: '2.6',
    nom: 'Non-respect priorité piéton',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R415-11 CDR — Contravention 4e classe',
    article: 'R415-11 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '6',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R415-11 CDR', '4e', '135', '90', '375', '6'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_7',
    ref: '2.7',
    nom: 'Usage téléphone au volant',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R412-6-1 CDR — Contravention 4e classe',
    article: 'R412-6-1 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '3',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R412-6-1 CDR', '4e', '135', '90', '375', '3'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_8',
    ref: '2.8',
    nom: "Défaut d'assurance",
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. L324-2 CDR — Délit',
    article: 'L324-2 CDR',
    classeContravention: 'Délit',
    amendeForFaitaire: '500',
    amendeMinoree: '',
    amendeMajoree: '3750',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('L324-2 CDR', 'Délit', '500', '-', '3750'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_9',
    ref: '2.9',
    nom: 'Non-respect cédez-le-passage',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R415-7 CDR — Contravention 4e classe',
    article: 'R415-7 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '4',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R415-7 CDR', '4e', '135', '90', '375', '4'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_10',
    ref: '2.10',
    nom: 'Non-port ceinture de sécurité',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R412-1 CDR — Contravention 4e classe',
    article: 'R412-1 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '3',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R412-1 CDR', '4e', '135', '90', '375', '3'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_11',
    ref: '2.11',
    nom: 'Non-port casque (deux-roues)',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R431-1 CDR — Contravention 4e classe',
    article: 'R431-1 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '3',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R431-1 CDR', '4e', '135', '90', '375', '3'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_2_12',
    ref: '2.12',
    nom: 'Défaut de contrôle technique',
    famille: 'Circulation',
    familleNum: 2,
    description: 'Art. R323-1 CDR — Contravention 4e classe',
    article: 'R323-1 CDR',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionVehicule(),
      sectionFaitsCirculation(),
      sectionQualification('R323-1 CDR', '4e', '135', '90', '375'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  // ──────────────────────────────────────────────────────────
  // FAMILY 3: TRANQUILLITÉ PUBLIQUE (2 templates)
  // ──────────────────────────────────────────────────────────

  {
    id: 'tpl_3_1',
    ref: '3.1',
    nom: 'Tapage nocturne',
    famille: 'Tranquillité publique',
    familleNum: 3,
    description: 'Art. R623-2 CP — Contravention 3e classe',
    article: 'R623-2 CP',
    classeContravention: '3e',
    amendeForFaitaire: '68',
    amendeMinoree: '45',
    amendeMajoree: '180',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionCirconstancesIntervention(),
      sectionFaitsTapage(),
      sectionQualification('R623-2 CP', '3e', '68', '45', '180'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_3_2',
    ref: '3.2',
    nom: 'Bruits de voisinage',
    famille: 'Tranquillité publique',
    familleNum: 3,
    description: 'Art. R623-1 CP — Contravention 3e classe',
    article: 'R623-1 CP',
    classeContravention: '3e',
    amendeForFaitaire: '68',
    amendeMinoree: '45',
    amendeMajoree: '180',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionCirconstancesIntervention(),
      sectionFaitsTapage(),
      sectionQualification('R623-1 CP', '3e', '68', '45', '180'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  // ──────────────────────────────────────────────────────────
  // FAMILY 4: PROPRETÉ URBAINE (3 templates)
  // ──────────────────────────────────────────────────────────

  {
    id: 'tpl_4_1',
    ref: '4.1',
    nom: 'Déjections canines',
    famille: 'Propreté urbaine',
    familleNum: 4,
    description: 'Art. R632-1 CP — Contravention 1re classe',
    article: 'R632-1 CP',
    classeContravention: '1re',
    amendeForFaitaire: '38',
    amendeMinoree: '',
    amendeMajoree: '78',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionFaitsProprete(),
      sectionQualification('R632-1 CP', '1re', '38', '-', '78'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_4_2',
    ref: '4.2',
    nom: "Dépôt sauvage d'ordures",
    famille: 'Propreté urbaine',
    familleNum: 4,
    description: 'Art. R632-1 CP — Contravention 2e classe',
    article: 'R632-1 CP',
    classeContravention: '2e',
    amendeForFaitaire: '35',
    amendeMinoree: '22',
    amendeMajoree: '75',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionFaitsProprete(),
      sectionQualification('R632-1 CP', '2e', '35', '22', '75'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_4_3',
    ref: '4.3',
    nom: 'Dépôt de gravats/matériaux',
    famille: 'Propreté urbaine',
    familleNum: 4,
    description: 'Art. R635-8 CP — Contravention 5e classe',
    article: 'R635-8 CP',
    classeContravention: '5e',
    amendeForFaitaire: '1500',
    amendeMinoree: '',
    amendeMajoree: '3000',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionFaitsProprete(),
      sectionQualification('R635-8 CP', '5e', '1500', '-', '3000'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  // ──────────────────────────────────────────────────────────
  // FAMILY 5: ANIMAUX (4 templates)
  // ──────────────────────────────────────────────────────────

  {
    id: 'tpl_5_1',
    ref: '5.1',
    nom: "Divagation d'animal",
    famille: 'Animaux',
    familleNum: 5,
    description: 'Art. R622-2 CP — Contravention 2e classe',
    article: 'R622-2 CP',
    classeContravention: '2e',
    amendeForFaitaire: '35',
    amendeMinoree: '22',
    amendeMajoree: '75',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionAnimal(),
      sectionFaitsAnimaux(),
      sectionQualification('R622-2 CP', '2e', '35', '22', '75'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_5_2',
    ref: '5.2',
    nom: 'Chien dangereux sans muselière',
    famille: 'Animaux',
    familleNum: 5,
    description: 'Art. L211-16 CRPM — Contravention 4e classe',
    article: 'L211-16 CRPM',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionAnimal(),
      sectionFaitsAnimaux(),
      sectionQualification('L211-16 CRPM', '4e', '135', '90', '375'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_5_3',
    ref: '5.3',
    nom: 'Défaut de déclaration chien catégorisé',
    famille: 'Animaux',
    familleNum: 5,
    description: 'Art. L211-14 CRPM — Contravention 3e classe',
    article: 'L211-14 CRPM',
    classeContravention: '3e',
    amendeForFaitaire: '68',
    amendeMinoree: '45',
    amendeMajoree: '180',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionAnimal(),
      sectionFaitsAnimaux(),
      sectionQualification('L211-14 CRPM', '3e', '68', '45', '180'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_5_4',
    ref: '5.4',
    nom: "Défaut d'assurance RC animal dangereux",
    famille: 'Animaux',
    familleNum: 5,
    description: 'Art. L211-14 CRPM — Contravention 3e classe',
    article: 'L211-14 CRPM',
    classeContravention: '3e',
    amendeForFaitaire: '68',
    amendeMinoree: '45',
    amendeMajoree: '180',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionAnimal(),
      sectionFaitsAnimaux(),
      sectionQualification('L211-14 CRPM', '3e', '68', '45', '180'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  // ──────────────────────────────────────────────────────────
  // FAMILY 6: DOMAINE PUBLIC (3 templates)
  // ──────────────────────────────────────────────────────────

  {
    id: 'tpl_6_1',
    ref: '6.1',
    nom: 'Occupation sans autorisation du domaine public',
    famille: 'Domaine public',
    familleNum: 6,
    description: 'Art. R610-5 CP — Contravention 1re classe',
    article: 'R610-5 CP',
    classeContravention: '1re',
    amendeForFaitaire: '38',
    amendeMinoree: '',
    amendeMajoree: '78',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionFaitsDomainePublic(),
      sectionQualification('R610-5 CP', '1re', '38', '-', '78'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_6_2',
    ref: '6.2',
    nom: 'Travaux sans autorisation sur voie publique',
    famille: 'Domaine public',
    familleNum: 6,
    description: 'Arrêté Municipal — Contravention 1re classe',
    article: 'Arrêté Municipal',
    classeContravention: '1re',
    amendeForFaitaire: '38',
    amendeMinoree: '',
    amendeMajoree: '78',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionFaitsDomainePublic(),
      sectionQualification('Arrêté Municipal', '1re', '38', '-', '78'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_6_3',
    ref: '6.3',
    nom: 'Dépôt de matériaux sur voie publique',
    famille: 'Domaine public',
    familleNum: 6,
    description: 'Art. R644-2 CP — Contravention 4e classe',
    article: 'R644-2 CP',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionFaitsDomainePublic(),
      sectionQualification('R644-2 CP', '4e', '135', '90', '375'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  // ──────────────────────────────────────────────────────────
  // FAMILY 7: MARCHÉS / COMMERCE (3 templates)
  // ──────────────────────────────────────────────────────────

  {
    id: 'tpl_7_1',
    ref: '7.1',
    nom: 'Vente hors emplacement autorisé',
    famille: 'Marchés / Commerce',
    familleNum: 7,
    description: 'Arrêté Municipal — Contravention variable',
    article: 'Arrêté Municipal',
    classeContravention: 'Variable',
    amendeForFaitaire: '38',
    amendeMinoree: '',
    amendeMajoree: '78',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionFaitsMarches(),
      sectionQualification('Arrêté Municipal', 'Variable', '38', '-', '78'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_7_2',
    ref: '7.2',
    nom: 'Non-respect horaires de marché',
    famille: 'Marchés / Commerce',
    familleNum: 7,
    description: 'Arrêté Municipal — Contravention variable',
    article: 'Arrêté Municipal',
    classeContravention: 'Variable',
    amendeForFaitaire: '38',
    amendeMinoree: '',
    amendeMajoree: '78',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionFaitsMarches(),
      sectionQualification('Arrêté Municipal', 'Variable', '38', '-', '78'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  {
    id: 'tpl_7_3',
    ref: '7.3',
    nom: 'Vente ambulante sans autorisation',
    famille: 'Marchés / Commerce',
    familleNum: 7,
    description: 'Art. L442-8 Code Commerce — Contravention 4e classe',
    article: 'L442-8 Code Commerce',
    classeContravention: '4e',
    amendeForFaitaire: '135',
    amendeMinoree: '90',
    amendeMajoree: '375',
    retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionIdentification(),
      sectionAgent(),
      sectionConstatation(),
      sectionContrevenant(),
      sectionFaitsMarches(),
      sectionQualification('L442-8 Code Commerce', '4e', '135', '90', '375'),
      sectionDroits(),
      sectionTransmission(),
      sectionCloture(),
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // FAMILLE 8 : ARRÊTÉS MUNICIPAUX (1 template)
  // ────────────────────────────────────────────────────────────────────────────

  // 8.1 — Arrêté Municipal Général de Police
  {
    id: 'tpl_8_1', ref: '8.1', nom: 'Arrêté Municipal Général de Police',
    famille: 'Arrêtés Municipaux', familleNum: 8,
    description: 'CGCT L2212-1 et suivants — Acte administratif',
    article: 'CGCT L2212-1', classeContravention: 'N/A',
    amendeForfaitaire: '', amendeMinoree: '', amendeMajoree: '', retraitPoints: '',
    isBuiltin: true,
    sections: [
      sectionArreteEnTete(),
      sectionArreteVisas(),
      sectionArreteStationnement(),
      sectionArreteProprete(),
      sectionArreteTranquillite(),
      sectionArreteAnimaux(),
      sectionArreteDispositions(),
      sectionArreteSignature(),
    ],
  },

];
