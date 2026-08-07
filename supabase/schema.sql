-- =============================================================================
-- Energy Monitoring Dashboard — Schema (idempotente: seguro re-ejecutar)
-- Diseñado para telemetría de assets distribuidos (solar, batería, EV).
-- =============================================================================

-- Tipos de asset conocidos (extensible: agrega valores al ENUM o migra a tabla)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
    CREATE TYPE asset_type AS ENUM ('solar', 'battery', 'ev_charger');
  END IF;
END $$;

-- Lecturas de telemetría. Un row = un punto de medición de un asset.
--
-- Escalabilidad (miles de assets):
-- 1. Índice compuesto (asset_type, timestamp DESC) acelera series temporales
--    filtradas por tipo — el patrón más común del dashboard.
-- 2. Índice en timestamp solo cubre rangos "últimas 24h" sin filtrar tipo.
-- 3. Si creces a miles de assets físicos, añade `asset_id UUID` + tabla
--    `assets(id, name, type, site_id)` y particiona `energy_readings`
--    por rango de tiempo (pg_partman / declarative partitioning).
-- 4. Retención: borra o archiva lecturas > N días con un cron / pg_cron.
CREATE TABLE IF NOT EXISTS energy_readings (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_type asset_type NOT NULL,
  value      DOUBLE PRECISION NOT NULL,
  unit       TEXT NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints ligeros para integridad de telemetría
  CONSTRAINT energy_readings_value_finite CHECK (value = value), -- no NaN
  CONSTRAINT energy_readings_unit_not_empty CHECK (char_length(unit) > 0)
);

-- Consultas por ventana temporal (ej. últimas 24h de todo el sitio)
CREATE INDEX IF NOT EXISTS idx_energy_readings_timestamp_desc
  ON energy_readings (timestamp DESC);

-- Consultas por asset + ventana (gráficas filtradas, gauges)
CREATE INDEX IF NOT EXISTS idx_energy_readings_asset_timestamp
  ON energy_readings (asset_type, timestamp DESC);

-- ---------------------------------------------------------------------------
-- Realtime: habilitar publicación de INSERT/UPDATE/DELETE en esta tabla
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'energy_readings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE energy_readings;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RLS: el dashboard (anon key) solo LEE; el simulador IoT usa service_role
-- ---------------------------------------------------------------------------
ALTER TABLE energy_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura pública de lecturas" ON energy_readings;
CREATE POLICY "Permitir lectura pública de lecturas"
  ON energy_readings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Permisos explícitos (necesario para PostgREST + Realtime)
GRANT SELECT ON energy_readings TO anon, authenticated;
GRANT USAGE ON TYPE asset_type TO anon, authenticated;

-- Sin policy de INSERT para anon → solo service_role / secret key
-- puede escribir. Esto refleja el modelo real: dispositivos autenticados
-- publican; el dashboard solo consume.

-- ---------------------------------------------------------------------------
-- Vista opcional: última lectura por tipo de asset (útil para gauges)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW latest_energy_readings AS
SELECT DISTINCT ON (asset_type)
  id,
  asset_type,
  value,
  unit,
  timestamp
FROM energy_readings
ORDER BY asset_type, timestamp DESC;

GRANT SELECT ON latest_energy_readings TO anon, authenticated;
