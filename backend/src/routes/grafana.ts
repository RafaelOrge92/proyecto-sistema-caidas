import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const DEFAULT_GRAFANA_ISSUER = 'fallguard-backend';
const DEFAULT_ORG_ID = '1';
const DEFAULT_PANEL_ID = '2';
const DEFAULT_TOKEN_TTL_SECONDS = 300;
const DEFAULT_ADMIN_UID = 'fallguard-admin-overview';
const DEFAULT_MEMBER_UID = 'fallguard-member-overview';
const DEFAULT_ADMIN_SLUG = 'fallguard-admin-overview';
const DEFAULT_MEMBER_SLUG = 'fallguard-member-overview';

type EmbedView = 'panel' | 'full';

const sanitizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, '');

const getGrafanaBaseUrl = (): string => {
  const explicitBaseUrl = process.env.GRAFANA_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return sanitizeBaseUrl(explicitBaseUrl);
  }

  const railwayGrafanaHost = process.env.RAILWAY_SERVICE_GRAFANA_URL?.trim();
  if (railwayGrafanaHost) {
    return `https://${sanitizeBaseUrl(railwayGrafanaHost)}`;
  }

  return '';
};

const getPrivateKey = (): string => {
  const raw = process.env.GRAFANA_JWT_PRIVATE_KEY?.trim();
  if (!raw) {
    throw new Error('GRAFANA_JWT_PRIVATE_KEY no configurada');
  }
  return raw
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n');
};

const parsePositiveInt = (rawValue: unknown, fallback: number): number => {
  const value = Number(rawValue);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const buildEmbedPath = (view: EmbedView, uid: string, slug: string, orgId: string, panelId: string): string => {
  if (view === 'full') {
    return `/d/${uid}/${slug}?orgId=${orgId}&kiosk=tv`;
  }
  return `/d-solo/${uid}/${slug}?orgId=${orgId}&panelId=${panelId}&kiosk=tv`;
};

router.get('/embed', authenticateToken, async (req, res) => {
  if (!req.user?.sub || !req.user?.email || !req.user?.role) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const baseUrl = getGrafanaBaseUrl();
  if (!baseUrl) {
    return res.status(503).json({ error: 'Grafana no configurado: falta GRAFANA_BASE_URL o RAILWAY_SERVICE_GRAFANA_URL' });
  }

  const viewQuery = typeof req.query.view === 'string' ? req.query.view.trim().toLowerCase() : '';
  const view: EmbedView = viewQuery === 'full' ? 'full' : 'panel';
  const panelIdRaw = typeof req.query.panelId === 'string' ? req.query.panelId.trim() : '';
  const panelId = /^\d+$/.test(panelIdRaw) ? panelIdRaw : DEFAULT_PANEL_ID;
  const orgId = process.env.GRAFANA_ORG_ID?.trim() || DEFAULT_ORG_ID;
  const issuer = process.env.GRAFANA_JWT_ISSUER?.trim() || DEFAULT_GRAFANA_ISSUER;
  const tokenTtlSeconds = parsePositiveInt(process.env.GRAFANA_JWT_TTL_SECONDS, DEFAULT_TOKEN_TTL_SECONDS);

  const isAdmin = req.user.role === 'ADMIN';
  const dashboardUid = isAdmin
    ? process.env.GRAFANA_DASHBOARD_UID_ADMIN?.trim() || DEFAULT_ADMIN_UID
    : process.env.GRAFANA_DASHBOARD_UID_MEMBER?.trim() || DEFAULT_MEMBER_UID;
  const dashboardSlug = isAdmin
    ? process.env.GRAFANA_DASHBOARD_SLUG_ADMIN?.trim() || DEFAULT_ADMIN_SLUG
    : process.env.GRAFANA_DASHBOARD_SLUG_MEMBER?.trim() || DEFAULT_MEMBER_SLUG;

  try {
    const token = jwt.sign(
      {
        sub: req.user.sub,
        email: req.user.email,
        name: req.user.fullName || req.user.email,
        role: isAdmin ? 'Admin' : 'Viewer',
        iss: issuer
      },
      getPrivateKey(),
      {
        algorithm: 'RS256',
        expiresIn: tokenTtlSeconds
      }
    );

    const embedPath = buildEmbedPath(view, dashboardUid, dashboardSlug, orgId, panelId);
    const embedUrl = new URL(embedPath, `${baseUrl}/`);
    embedUrl.searchParams.set('auth_token', token);

    return res.json({
      embedUrl: embedUrl.toString(),
      view,
      dashboardUid
    });
  } catch (error: any) {
    console.error('[grafana] Error creando URL de embed:', error);
    return res.status(500).json({ error: error?.message || 'No se pudo generar la URL de Grafana' });
  }
});

export const grafanaRoutes = router;
