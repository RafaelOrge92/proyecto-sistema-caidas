export const formatDateTime = (value?: string | null) => {
  if (!value) return 'Sin datos';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};
