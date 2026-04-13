import * as Icons from 'lucide-react-native';
import React from 'react';

interface IconProps {
    name: string;      // El nombre que viene de la DB (ej: 'dog')
    color?: string;    // Color hex
    size?: number;     // Tamaño del icono
}

export const DynamicIcon = ({ name, color = '#000', size = 24 }: IconProps) => {
    // 1. Transformar el nombre de la DB a formato PascalCase (opcional según cómo guardes)
    // Ej: 'shopping-cart' -> 'ShoppingCart'
    const pascalName = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

    // 2. Buscar el componente en la librería Lucide
    const LucideIcon = Icons[pascalName as keyof typeof Icons] || Icons.HelpCircle;

    return <LucideIcon color={color} size={size} />;
};
