# MissionCRM - Gestion de Missions

## Overview
Interface CRM professionnelle pour gérer des missions avec des templates auto-remplis. L'application permet de créer, modifier, visualiser et supprimer des missions, avec un système de templates qui se remplit automatiquement avec les données de chaque mission.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js
- **Database**: PostgreSQL avec Drizzle ORM
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: TanStack Query

## Project Structure
```
client/
├── src/
│   ├── components/       # Composants réutilisables
│   │   ├── app-sidebar.tsx       # Navigation latérale
│   │   ├── mission-card.tsx      # Carte de mission
│   │   ├── mission-form.tsx      # Formulaire de mission
│   │   ├── mission-template.tsx  # Vue template auto-remplie
│   │   ├── stats-card.tsx        # Carte de statistiques
│   │   ├── theme-provider.tsx    # Gestion du thème
│   │   └── theme-toggle.tsx      # Bouton changement de thème
│   ├── pages/            # Pages de l'application
│   │   ├── dashboard.tsx         # Tableau de bord
│   │   ├── missions.tsx          # Liste des missions
│   │   ├── mission-new.tsx       # Créer une mission
│   │   ├── mission-detail.tsx    # Détails d'une mission
│   │   ├── mission-edit.tsx      # Modifier une mission
│   │   ├── mission-template.tsx  # Template de mission
│   │   ├── templates.tsx         # Liste des templates
│   │   └── settings.tsx          # Paramètres
│   └── App.tsx           # Point d'entrée avec routing
server/
├── db.ts                 # Configuration PostgreSQL
├── routes.ts             # API REST endpoints
├── seed.ts               # Données de démonstration
└── storage.ts            # Interface de stockage
shared/
└── schema.ts             # Schémas Drizzle et types TypeScript
```

## Features
- **Tableau de bord**: Vue d'ensemble avec statistiques
- **Gestion des missions**: CRUD complet
- **Templates auto-remplis**: Chaque mission génère un template formaté
- **Filtrage et recherche**: Par statut et texte
- **Mode sombre/clair**: Thème personnalisable
- **Responsive**: Fonctionne sur mobile et desktop

## API Endpoints
- `GET /api/missions` - Liste toutes les missions
- `GET /api/missions/:id` - Récupère une mission
- `POST /api/missions` - Crée une mission
- `PATCH /api/missions/:id` - Met à jour une mission
- `DELETE /api/missions/:id` - Supprime une mission

## Database Schema
```typescript
missions {
  id: varchar (UUID)
  title: text
  clientName: text
  clientEmail: text
  clientPhone: text
  description: text
  startDate: timestamp
  endDate: timestamp
  budget: integer
  status: text (pending, in_progress, completed, cancelled)
  location: text
  notes: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Running the Project
```bash
npm run dev     # Démarre le serveur de développement
npm run db:push # Synchronise le schéma de la base de données
```
