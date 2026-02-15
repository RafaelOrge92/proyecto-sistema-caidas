import { Router } from 'express';
import { db } from '../config/db';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

const isUniqueOwnerConflict = (error: any): boolean =>
  error?.code === '23505' && String(error?.constraint || '').includes('device_single_owner_idx');

// Get all patients
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT
         patient_id as "patientId",
         CONCAT(first_name, ' ', last_name) as "patientName",
         first_name as "firstName",
         last_name as "lastName",
         nif,
         date_of_birth as "dateOfBirth",
         city,
         address_line1 as "addressLine1"
       FROM public.patients
       ORDER BY first_name ASC, last_name ASC`
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

// Get available patients (with devices, not assigned to any user)
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT
         p.patient_id as "patientId",
         CONCAT(p.first_name, ' ', p.last_name) as "patientName",
         p.first_name as "firstName",
         p.last_name as "lastName",
         p.nif,
         p.date_of_birth as "dateOfBirth",
         p.city,
         p.address_line1 as "addressLine1",
         COUNT(d.device_id)::int as "deviceCount"
       FROM public.patients p
       JOIN public.devices d ON d.patient_id = p.patient_id
       WHERE NOT EXISTS (
         SELECT 1
         FROM public.device_access da
         JOIN public.devices d2 ON d2.device_id = da.device_id
         WHERE d2.patient_id = p.patient_id
       )
       GROUP BY p.patient_id, p.first_name, p.last_name, p.nif, p.date_of_birth, p.city, p.address_line1
       ORDER BY p.first_name ASC, p.last_name ASC`
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error fetching available patients:', error);
    return res.status(500).json({ error: 'Error al obtener pacientes disponibles' });
  }
});

// Assign patient (all its devices) to current user
router.post('/:patientId/assign-me', authenticateToken, async (req, res) => {
  const patientId = req.params.patientId as string;
  const accountId = (req as any).user?.sub as string | undefined;

  if (!accountId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  if (!patientId) {
    return res.status(400).json({ error: 'patientId es requerido' });
  }

  try {
    const patient = await db.query(
      'SELECT patient_id FROM public.patients WHERE patient_id = $1 LIMIT 1',
      [patientId]
    );
    if (patient.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const devices = await db.query(
      'SELECT device_id FROM public.devices WHERE patient_id = $1',
      [patientId]
    );
    if (devices.length === 0) {
      return res.status(400).json({ error: 'El paciente no tiene dispositivos asignados' });
    }

    const alreadyAssigned = await db.query(
      `SELECT 1
       FROM public.device_access da
       JOIN public.devices d ON d.device_id = da.device_id
       WHERE d.patient_id = $1
       LIMIT 1`,
      [patientId]
    );
    if (alreadyAssigned.length > 0) {
      return res.status(409).json({ error: 'El paciente ya esta asignado' });
    }

    const result = await db.query(
      `INSERT INTO public.device_access (account_id, device_id, access_type)
       SELECT $1, d.device_id, 'MEMBER'
       FROM public.devices d
       WHERE d.patient_id = $2
       RETURNING account_id, device_id, access_type`,
      [accountId, patientId]
    );

    return res.status(201).json({
      message: 'Paciente asignado al usuario',
      assignedDevices: result.length
    });
  } catch (error: any) {
    console.error('Error assigning patient to user:', error);

    if (isUniqueOwnerConflict(error)) {
      return res.status(409).json({ error: 'No se puede asignar OWNER' });
    }

    return res.status(500).json({ error: 'Error al asignar paciente' });
  }
});

// List users assigned to all devices of a patient
router.get('/:patientId/users', authenticateToken, requireAdmin, async (req, res) => {
  const patientId = req.params.patientId as string;

  try {
    const patient = await db.query(
      `SELECT
         patient_id as "patientId",
         CONCAT(first_name, ' ', last_name) as "patientName"
       FROM public.patients
       WHERE patient_id = $1
       LIMIT 1`,
      [patientId]
    );

    if (patient.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const rows = await db.query(
      `SELECT
         a.account_id as "accountId",
         a.full_name as "fullName",
         a.email as email,
         a.role::text as role,
         ARRAY_AGG(DISTINCT da.access_type::text) as "accessTypes",
         COUNT(DISTINCT da.device_id)::int as "devicesAssigned"
       FROM public.devices d
       JOIN public.device_access da ON da.device_id = d.device_id
       JOIN public.accounts a ON a.account_id = da.account_id
       WHERE d.patient_id = $1
       GROUP BY a.account_id, a.full_name, a.email, a.role
       ORDER BY a.full_name ASC`,
      [patientId]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching patient users:', error);
    return res.status(500).json({ error: 'Error al obtener usuarios asignados al paciente' });
  }
});

// Assign one user to all devices of a patient
router.post('/:patientId/users', authenticateToken, requireAdmin, async (req, res) => {
  const patientId = req.params.patientId as string;
  const accountId = req.body?.accountId as string | undefined;
  const accessType = (req.body?.accessType || 'MEMBER') as 'OWNER' | 'MEMBER';

  if (!accountId) {
    return res.status(400).json({ error: 'accountId es requerido' });
  }

  if (!['OWNER', 'MEMBER'].includes(accessType)) {
    return res.status(400).json({ error: 'accessType debe ser OWNER o MEMBER' });
  }

  try {
    const patient = await db.query(
      'SELECT patient_id FROM public.patients WHERE patient_id = $1 LIMIT 1',
      [patientId]
    );
    if (patient.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const user = await db.query(
      'SELECT account_id FROM public.accounts WHERE account_id = $1 LIMIT 1',
      [accountId]
    );
    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const devices = await db.query(
      'SELECT device_id FROM public.devices WHERE patient_id = $1',
      [patientId]
    );
    if (devices.length === 0) {
      return res.status(400).json({ error: 'El paciente no tiene dispositivos asignados' });
    }

    const result = await db.query(
      `INSERT INTO public.device_access (account_id, device_id, access_type)
       SELECT $1, d.device_id, $3::access_type
       FROM public.devices d
       WHERE d.patient_id = $2
       ON CONFLICT (account_id, device_id)
       DO UPDATE SET access_type = EXCLUDED.access_type
       RETURNING account_id, device_id, access_type`,
      [accountId, patientId, accessType]
    );

    return res.status(201).json({
      message: 'Usuario asignado al paciente',
      assignedDevices: result.length
    });
  } catch (error: any) {
    console.error('Error assigning patient user:', error);

    if (isUniqueOwnerConflict(error)) {
      return res.status(409).json({
        error: 'No se puede asignar OWNER porque alguno de los dispositivos ya tiene OWNER'
      });
    }

    return res.status(500).json({ error: 'Error al asignar usuario al paciente' });
  }
});

// Remove one user from all devices of a patient
router.delete('/:patientId/users/:accountId', authenticateToken, requireAdmin, async (req, res) => {
  const patientId = req.params.patientId as string;
  const accountId = req.params.accountId as string;

  try {
    const result = await db.query(
      `DELETE FROM public.device_access da
       USING public.devices d
       WHERE da.device_id = d.device_id
         AND d.patient_id = $1
         AND da.account_id = $2
       RETURNING da.device_id`,
      [patientId, accountId]
    );

    return res.json({
      message: 'Usuario desasignado del paciente',
      removedDevices: result.length
    });
  } catch (error) {
    console.error('Error removing patient user:', error);
    return res.status(500).json({ error: 'Error al desasignar usuario del paciente' });
  }
});

// Create a new patient
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { firstName, lastName, nif, dateOfBirth, addressLine1, addressLine2, city, province, postalCode, country, notes } = req.body;

  if (!firstName || !lastName || !nif) {
    return res.status(400).json({ error: 'firstName, lastName y nif son requeridos' });
  }

  if (!addressLine1 || !city) {
    return res.status(400).json({ error: 'addressLine1 y city son requeridos' });
  }

  try {
    // Verificar que el NIF no exista
    const existingNif = await db.query(
      'SELECT patient_id FROM public.patients WHERE nif = $1 LIMIT 1',
      [nif]
    );
    
    if (existingNif.length > 0) {
      return res.status(409).json({ error: 'Ya existe un paciente con este NIF' });
    }

    const result = await db.query(
      `INSERT INTO public.patients (first_name, last_name, nif, date_of_birth, address_line1, address_line2, city, province, postal_code, country, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING 
         patient_id as "patientId",
         CONCAT(first_name, ' ', last_name) as "patientName",
         first_name as "firstName",
         last_name as "lastName",
         nif,
         date_of_birth as "dateOfBirth",
         city,
         address_line1 as "addressLine1"`,
      [firstName, lastName, nif, dateOfBirth || null, addressLine1, addressLine2 || null, city, province || null, postalCode || null, country || 'España', notes || null]
    );

    return res.status(201).json(result[0]);
  } catch (error: any) {
    console.error('Error creating patient:', error);
    
    if (error?.code === '23505' && error?.constraint?.includes('nif')) {
      return res.status(409).json({ error: 'Ya existe un paciente con este NIF' });
    }

    return res.status(500).json({ error: 'Error al crear paciente' });
  }
});

export const patientsRoutes = router;

