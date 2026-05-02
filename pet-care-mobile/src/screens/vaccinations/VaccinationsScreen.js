import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Linking
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api, { apiBaseUrl } from '../../services/api';

export default function VaccinationsScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const authHeader = { headers: { Authorization: `Bearer ${userToken}` } };

  const [pets, setPets] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(false);

  const baseFileUrl = apiBaseUrl.replace('/api', '');

  useEffect(() => { fetchPets(); }, []);
  useEffect(() => { if (selectedPet) fetchRecords(selectedPet._id); }, [selectedPet]);

  const fetchPets = async () => {
    try {
      const { data } = await api.get('/pets', authHeader);
      setPets(data);
      if (data.length > 0) setSelectedPet(data[0]);
    } catch (e) { console.error(e); }
  };

  const fetchRecords = async (petId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/vaccines/records?petId=${petId}`, authHeader);
      setRecords(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}><FontAwesome5 name="syringe" size={20} color="#FFF" /> Vaccinations</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      {/* Pet Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petBar} contentContainerStyle={styles.petBarContent}>
        {pets.map(p => (
          <TouchableOpacity
            key={p._id}
            style={[styles.petChip, selectedPet?._id === p._id && styles.petChipActive]}
            onPress={() => setSelectedPet(p)}
          >
            <Text style={[styles.petChipText, selectedPet?._id === p._id && styles.petChipTextActive]}><FontAwesome5 name="paw" size={12} color={selectedPet?._id === p._id ? "#FFF" : "#888"} /> {p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#5EBFA4" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {records.length === 0 && (
            <View style={styles.emptyCard}>
              <FontAwesome5 name="syringe" size={48} color="#CCC" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>No vaccination records</Text>
              <Text style={styles.emptySub}>Your vet will add vaccination records after your appointment.</Text>
            </View>
          )}
          {records.map(r => (
            <View key={r._id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconBox}><FontAwesome5 name="syringe" size={24} color="#5EBFA4" /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>{r.vaccineName || 'Vaccine'}</Text>
                  <Text style={styles.cardSub}><FontAwesome5 name="calendar-day" size={12} color="#888" /> Given: {formatDate(r.dateAdministered)}</Text>
                  {r.nextDueDate && <Text style={styles.cardSub}><FontAwesome5 name="bell" size={12} color="#888" /> Next Due: {formatDate(r.nextDueDate)}</Text>}
                </View>
                <View style={[styles.badge, r.status === 'Completed' ? styles.badgeDone : styles.badgePending]}>
                  <Text style={styles.badgeText}>{r.status}</Text>
                </View>
              </View>
              {r.notes ? <Text style={styles.notes}><FontAwesome5 name="sticky-note" size={12} color="#888" /> {r.notes}</Text> : null}
              {r.documentUrl ? (
                <TouchableOpacity 
                  style={styles.viewDocBtn} 
                  onPress={() => {
                    if (r.documentUrl.startsWith('data:')) {
                      // For simplicity, we can show an alert or you can implement a modal viewer
                      // For now, let's assume it's viewable via Linking or handled by the system
                      Linking.openURL(r.documentUrl);
                    } else {
                      Linking.openURL(`${baseFileUrl}${r.documentUrl}`);
                    }
                  }}
                >
                  <Text style={styles.viewDocText}><FontAwesome5 name="file-pdf" size={14} color="#4A90E2" /> View Certificate</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { backgroundColor: '#5EBFA4', height: 115, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 35 },
  backArrow: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  petBar: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE', maxHeight: 60 },
  petBarContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  petChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD' },
  petChipActive: { backgroundColor: '#5EBFA4', borderColor: '#5EBFA4' },
  petChipText: { fontSize: 13, fontWeight: 'bold', color: '#555' },
  petChipTextActive: { color: '#FFF' },
  list: { padding: 20, paddingBottom: 60 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 30, alignItems: 'center', marginTop: 20, elevation: 2 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 6 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  badgeDone: { backgroundColor: '#E8F5E9' },
  badgePending: { backgroundColor: '#FFF3E0' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  notes: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 10, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 8 },
  viewDocBtn: { marginTop: 10, backgroundColor: '#E3F2FD', borderRadius: 8, padding: 10, alignItems: 'center' },
  viewDocText: { color: '#1976D2', fontWeight: 'bold', fontSize: 13 },
});
