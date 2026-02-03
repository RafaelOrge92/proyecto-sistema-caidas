import React from 'react';
//import { Line } from 'react-router-dom'; // Rafa cambiará esto por la gráfica real

interface ChartProps {
    data: { accX: number; accY: number; accZ: number; timestamp: string }[];
}

export const LiveChart: React.FC<ChartProps> = ({ data }) => {
    return (
        <div className="bg-white p-4 rounded shadow-md mt-6">
            <h3 className="text-lg font-bold mb-2">Monitorización de Aceleración (G)</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 border-dashed border-2 border-gray-300">
                {/* Aquí Rafa insertará el componente <Line /> de Chart.js */}
                <p className="text-gray-400 text-sm">Espacio reservado para la gráfica de Rafa</p>
                <ul className="text-xs text-gray-500 ml-4">
                    <li>Último X: {data[data.length -1]?.accX}</li>
                    <li>Último Y: {data[data.length -1]?.accY}</li>
                    <li>Último Z: {data[data.length -1]?.accZ}</li>
                </ul>
            </div>
        </div>
    );
};