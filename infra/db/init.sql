-- Initialisation de la base de données Laundry Express
-- Ce fichier est exécuté automatiquement lors du premier démarrage de PostgreSQL

-- Création des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Les tables sont créées via les migrations Alembic
-- Ce fichier peut être utilisé pour des données de référence ou des configurations initiales

SELECT 'Base de données Laundry Express initialisée avec succès' as message;