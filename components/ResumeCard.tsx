import { StyleSheet, Text, View } from 'react-native';

export const ResumenCard = ({ totales }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Total a pagar este mes</Text>
      <Text style={styles.mainAmount}>${totales.totalMes.toFixed(2)}</Text>
      
      <View style={styles.divider} />
      
      <View style={styles.row}>
        <View>
          <Text style={styles.subLabel}>Gastos Directos</Text>
          <Text style={styles.subAmount}>${totales.soloDirecto.toFixed(2)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.subLabel}>Cuotas MSI</Text>
          <Text style={styles.subAmount}>${totales.soloMSI.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B', // Azul oscuro profesional
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    elevation: 4,
  },
  title: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  mainAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  subLabel: { color: '#94A3B8', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 },
  subAmount: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' }
});
