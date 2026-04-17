import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { PieChart } from "react-native-gifted-charts";
import { Colors } from '../../Colors';
import { supabase } from '../../lib/supabase';

export default function StatsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [loading, setLoading] = useState(true);
    const [mesSeleccionado, setMesSeleccionado] = useState('actual'); // 'actual' o 'pasado'
    const [datosGraficas, setDatosGraficas] = useState({
        pie: [],
        fijosVar: { fijos: 0, variables: 0 },
        total: 0
    });

    useFocusEffect(
        useCallback(() => {
            fetchAllStats();
        }, [mesSeleccionado])
    );

    const fetchAllStats = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        // Definir rangos de fechas
        const ahora = new Date();
        const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const inicioMesPasado = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
        const finMesPasado = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

        const r_inicio = mesSeleccionado === 'actual' ? inicioMesActual.toISOString() : inicioMesPasado.toISOString();
        const r_fin = mesSeleccionado === 'actual' ? ahora.toISOString() : finMesPasado.toISOString();

        const { data: expenses, error } = await supabase
            .from('expenses')
            .select(`amount, is_recurring, created_at, categories (name, color_hex)`)
            .eq('payer_id', user?.id)
            .gte('created_at', r_inicio)
            .lte('created_at', r_fin);

        if (!error && expenses) {
            // 1. Procesar Pastel
            const agrupar = expenses.reduce((acc, curr) => {
                const cat = curr.categories?.name || 'Otros';
                if (!acc[cat]) acc[cat] = { value: 0, color: curr.categories?.color_hex || '#94A3B8', text: cat };
                acc[cat].value += parseFloat(curr.amount);
                return acc;
            }, {});

            // 2. Procesar Fijos vs Variables
            const totals = expenses.reduce((acc, curr) => {
                if (curr.is_recurring) acc.fijos += parseFloat(curr.amount);
                else acc.variables += parseFloat(curr.amount);
                return acc;
            }, { fijos: 0, variables: 0 });

            setDatosGraficas({
                pie: Object.values(agrupar),
                fijosVar: totals,
                total: totals.fijos + totals.variables
            });
        }
        setLoading(false);
    };

    if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.background }} size="large" color={theme.primary} />;

    const porcFijos = datosGraficas.total > 0 ? (datosGraficas.fijosVar.fijos / datosGraficas.total) * 100 : 0;

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: theme.text }]}>Análisis</Text>

            {/* SELECTOR DE MES */}
            <View style={[styles.toggleContainer, { backgroundColor: theme.card }]}>
                <TouchableOpacity
                    style={[styles.toggleBtn, mesSeleccionado === 'actual' && { backgroundColor: theme.primary }]}
                    onPress={() => setMesSeleccionado('actual')}
                >
                    <Text style={[styles.toggleText, mesSeleccionado === 'actual' ? { color: 'white' } : { color: theme.subtext }]}>Mes Actual</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, mesSeleccionado === 'pasado' && { backgroundColor: theme.primary }]}
                    onPress={() => setMesSeleccionado('pasado')}
                >
                    <Text style={[styles.toggleText, mesSeleccionado === 'pasado' ? { color: 'white' } : { color: theme.subtext }]}>Mes Pasado</Text>
                </TouchableOpacity>
            </View>

            {/* CARD DE TOTAL TOTAL */}
            <View style={[styles.card, { backgroundColor: theme.card, alignItems: 'center' }]}>
                <Text style={{ color: theme.subtext, fontSize: 12, textTransform: 'uppercase' }}>Total Gastado</Text>
                <Text style={{ color: theme.text, fontSize: 32, fontWeight: 'bold' }}>${datosGraficas.total.toFixed(2)}</Text>
            </View>

            {/* GRÁFICA DE PASTEL */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Distribución</Text>
                <View style={styles.pieRow}>
                    <PieChart
                        data={datosGraficas.pie}
                        donut
                        radius={70}
                        innerRadius={50}
                        innerCircleColor={theme.card}
                    />
                    <View style={styles.legend}>
                        {datosGraficas.pie.slice(0, 10).map((item, i) => (
                            <View key={i} style={styles.legendItem}>
                                <View style={[styles.dot, { backgroundColor: item.color }]} />
                                <Text style={{ color: theme.subtext, fontSize: 11 }} numberOfLines={1}>{item.text}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* SALUD FINANCIERA */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Fijos vs Variables</Text>
                <View style={[styles.progressBase, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { width: `${porcFijos}%`, backgroundColor: '#6366F1' }]} />
                </View>
                <View style={styles.labelsRow}>
                    <View><Text style={styles.labelType}>Fijo</Text><Text style={[styles.labelPrice, { color: theme.text }]}>${datosGraficas.fijosVar.fijos.toFixed(2)}</Text></View>
                    <View style={{ alignItems: 'flex-end' }}><Text style={styles.labelType}>Variable</Text><Text style={[styles.labelPrice, { color: theme.text }]}>${datosGraficas.fijosVar.variables.toFixed(2)}</Text></View>
                </View>
            </View>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    title: { fontSize: 26, fontWeight: 'bold', marginTop: 50, marginBottom: 20 },
    toggleContainer: { flexDirection: 'row', padding: 5, borderRadius: 15, marginBottom: 20 },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    toggleText: { fontWeight: 'bold', fontSize: 14 },
    card: { padding: 20, borderRadius: 24, marginBottom: 15, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    pieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    legend: { flex: 1, marginLeft: 20 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    progressBase: { height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 10 },
    progressFill: { height: '100%' },
    labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    labelType: { color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },
    labelPrice: { fontSize: 18, fontWeight: 'bold' },
});
