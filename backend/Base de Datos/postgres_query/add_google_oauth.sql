-- ============================================================
-- Migración: Agregar soporte para Google OAuth
-- Descripción: Agrega campos google_id y profile_picture a la tabla accounts
-- ============================================================

-- Agregar columna google_id (opcional, para Google OAuth)
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Agregar columna profile_picture (URL de foto de perfil de Google)
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Crear índice en google_id para búsquedas rápidas
CREATE INDEX IF NOT EXISTS accounts_google_id_idx 
ON public.accounts(google_id);

COMMENT ON COLUMN public.accounts.google_id IS 'Google ID del usuario para autenticación OAuth';
COMMENT ON COLUMN public.accounts.profile_picture IS 'URL de la foto de perfil desde Google';
