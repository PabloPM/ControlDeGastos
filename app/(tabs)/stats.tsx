import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import { Colors } from '../../Colors'; // Tu paleta de colores
import { supabase } from '../../lib/supabase';

export default function StatsScreen() {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        fetchMonthlyStats();
    }, []);

    const fetchMonthlyStats = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        // Obtenemos gastos de los últimos 6 meses
        const seisMesesAtras = new Date();
        seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

        const { data, error } = await supabase
            .from('expenses')
            .select('amount, created_at')
            .eq('payer_id', user.id)
            .gte('created_at', seisMesesAtras.toISOString());

        if (!error && data) {
            procesarDatosParaGrafica(data);
        }
        setLoading(false);
    };

    const procesarDatosParaGrafica = (gastos) => {
        const mesesAbreviados = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const resumen = {};

        // Agrupar por mes
        gastos.forEach(g => {
            const fecha = new Date(g.created_at);
            const mesAnio = `${mesesAbreviados[fecha.getMonth()]} ${fecha.getFullYear().toString().slice(-2)}`;
            resumen[mesAnio] = (resumen[mesAnio] || 0) + parseFloat(g.amount);
        });

        // Convertir al formato de Gifted Charts
        const datosFormateados = Object.keys(resumen).map(key => ({
            value: resumen[key],
            label: key,
            frontColor: '#3B82F6', // Azul principal
            gradientColor: '#60A5FA',
            showGradient: true,
        })).reverse().slice(0, 6).reverse(); // Asegurar orden cronológico de los últimos 6

        setChartData(datosFormateados);
    };

    if (loading) return <ActivityIndicator style={styles.loader} size="large" />;

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>Tendencia de Gastos</Text>
            <Text style={styles.subtitle}>Últimos 6 meses</Text>

            <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                <BarChart
                    data={chartData}
                    barWidth={35}
                    noOfSections={4}
                    barBorderRadius={6}
                    frontColor={'#3B82F6'}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    yAxisTextStyle={{ color: theme.subtext }}
                    xAxisLabelTextStyle={{ color: theme.subtext, fontSize: 10 }}
                    isAnimated
                    animationDuration={500}
                />
            </View>

            {/* Lista detallada debajo de la gráfica */}
            <View style={styles.listSection}>
                {chartData.map((item, index) => (
                    <View key={index} style={[styles.row, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.rowLabel, { color: theme.text }]}>{item.label}</Text>
                        <Text style={[styles.rowValue, { color: theme.primary }]}>
                            ${item.value.toLocaleString()}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    loader: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
    subtitle: { color: '#94A3B8', fontSize: 14, marginBottom: 25 },
    chartCard: { padding: 20, borderRadius: 20, marginBottom: 30, alignItems: 'center' },
    listSection: { marginTop: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1 },
    rowLabel: { fontSize: 16, fontWeight: '500' },
    rowValue: { fontSize: 18, fontWeight: 'bold' }
});
