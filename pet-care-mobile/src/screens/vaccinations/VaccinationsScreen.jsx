import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api, { getBackendOrigin } from '../../services/api';

export default function VaccinationsScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const authHeader = { headers: { Authorization: `Bearer ${userToken}` } };

  const [pets, setPets] = useState([]);
  const [records, setRecords] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVaccineIds, setSelectedVaccineIds] = useState(() => new Set());
  const [submitting, setSubmitting] = useState(false);

  /** Avoid applying history from a fetch for the wrong pet if the user switched chips mid‑request */
  const selectedPetIdRef = useRef(null);
  useEffect(() => {
    selectedPetIdRef.current = selectedPet?._id ? String(selectedPet._id) : null;
  }, [selectedPet]);

  const baseFileUrl = getBackendOrigin();

  const fetchPets = useCallback(async () => {
    try {
      const { data } = await api.get('/pets', authHeader);
      const list = Array.isArray(data) ? data : [];
      setPets(list);
      setSelectedPet((prev) => {
        if (!list.length) return null;
        if (prev && list.some((p) => p._id === prev._id)) return prev;
        return list[0];
      });
    } catch (e) {
      console.error(e);
    }
  }, [userToken]);

  const fetchRecords = useCallback(async (petId, quiet) => {
    const pid = String(petId);
    if (!quiet) setLoadingRecords(true);
    try {
      const { data } = await api.get(`/vaccines/records?petId=${pid}`, authHeader);
      if (selectedPetIdRef.current !== pid) return;
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      if (selectedPetIdRef.current === pid && !quiet) setLoadingRecords(false);
      setRefreshing(false);
    }
  }, [userToken]);

  const fetchCatalog = useCallback(async () => {
    try {
      const { data } = await api.get('/vaccines/catalog', authHeader);
      setCatalog(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  }, [userToken]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    if (selectedPet?._id) fetchRecords(selectedPet._id);
  }, [selectedPet, fetchRecords]);

  const listedCatalogIds = useMemo(() => {
    const s = new Set();
    records.forEach((r) => {
      if (r.status !== 'Scheduled') return;
      const cid = r.catalogVaccine?._id ?? r.catalogVaccine;
      if (cid) s.add(String(cid));
    });
    return s;
  }, [records]);

  useEffect(() => {
    setSelectedVaccineIds(new Set());
  }, [selectedPet]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPets();
    fetchCatalog();
    if (selectedPet) fetchRecords(selectedPet._id, true);
    else setRefreshing(false);
  }, [fetchPets, fetchCatalog, selectedPet, fetchRecords]);

  const toggleVaccine = (id, alreadyListed) => {
    if (alreadyListed) return;
    const k = String(id);
    setSelectedVaccineIds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const confirmSelection = async () => {
    if (!selectedPet?._id) return;
    const petIdSnap = String(selectedPet._id);
    const petNameSnap = selectedPet.name?.trim() || 'this pet';
    const idsSnap = [...selectedVaccineIds];
    if (idsSnap.length === 0) return;

    setSubmitting(true);
    try {
      const { data } = await api.post(
        '/vaccines/records/confirm',
        { petId: petIdSnap, vaccineIds: idsSnap },
        authHeader
      );
      const msg =
        data?.message ||
        (data?.created?.length ? `Added ${data.created.length}` : 'Saved');
      await fetchRecords(petIdSnap, true);
      if (selectedPetIdRef.current === petIdSnap) setSelectedVaccineIds(new Set());
      Alert.alert('Updated', `${msg}\n\nSaved for ${petNameSnap}`);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not save');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const badgeForRecord = (r) => {
    if (r.status === 'Completed') return { label: 'Recorded', style: styles.badgeDone };
    return { label: 'Listed', style: styles.badgeListed };
  };

  const noPets = pets.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              <FontAwesome5 name="syringe" size={20} color="#FFF" /> Vaccinations
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      {!noPets && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petBar} contentContainerStyle={styles.petBarContent}>
          {pets.map((p) => (
            <TouchableOpacity
              key={p._id}
              disabled={submitting}
              style={[
                styles.petChip,
                selectedPet?._id === p._id && styles.petChipActive,
                submitting && styles.petChipDisabled,
              ]}
              onPress={() => setSelectedPet(p)}
            >
              <Text style={[styles.petChipText, selectedPet?._id === p._id && styles.petChipTextActive]}>
                <FontAwesome5 name="paw" size={12} color={selectedPet?._id === p._id ? '#FFF' : '#888'} /> {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {noPets ? (
        <View style={styles.emptyCard}>
          <FontAwesome5 name="paw" size={42} color="#CCC" />
          <Text style={styles.emptyTitle}>Add a pet first</Text>
          <Text style={styles.emptySub}>Then choose vaccines here.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5EBFA4']} />}
        >
          <Text style={styles.sectionHeading}>Choose vaccines</Text>
          <Text style={styles.intro}>
            Tick what your pet needs, tap Confirm — your history below updates straight away.
          </Text>

          {catalog.length === 0 ? (
            <View style={[styles.emptyCard, { marginTop: 0 }]}>
              <Text style={styles.emptyTitle}>No vaccines in the app yet</Text>
              <Text style={styles.emptySub}>Ask an admin to add types to the vaccine list.</Text>
            </View>
          ) : (
            catalog.map((v) => {
              const idStr = String(v._id);
              const listed = listedCatalogIds.has(idStr);
              const checked = selectedVaccineIds.has(idStr);
              return (
                <TouchableOpacity
                  key={v._id}
                  style={[styles.catRow, listed && styles.catRowMuted]}
                  onPress={() => toggleVaccine(v._id, listed)}
                  activeOpacity={listed ? 1 : 0.7}
                >
                  <View style={[styles.check, checked && !listed && styles.checkOn, listed && styles.checkListed]}>
                    {(checked || listed) && (
                      <FontAwesome5 name="check" size={12} color={listed ? '#666' : '#FFF'} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{v.name}</Text>
                    {!!v.description && <Text style={styles.catDesc}>{v.description}</Text>}
                    {listed && <Text style={styles.listedTag}>Already in history</Text>}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, (submitting || selectedVaccineIds.size === 0) && styles.confirmBtnDisabled]}
            disabled={submitting || selectedVaccineIds.size === 0}
            onPress={confirmSelection}
          >
            <Text style={styles.confirmTxt}>
              {submitting ? 'Saving…' : `Confirm (${selectedVaccineIds.size} selected)`}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />
          <Text style={styles.sectionHeading}>History</Text>

          {loadingRecords ? (
            <ActivityIndicator size="small" color="#5EBFA4" style={{ marginVertical: 24 }} />
          ) : records.length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome5 name="syringe" size={40} color="#CCC" />
              <Text style={styles.emptyTitle}>Nothing listed yet</Text>
              <Text style={styles.emptySub}>Pick vaccines above and confirm to build your pet&apos;s history.</Text>
            </View>
          ) : (
            records.map((r) => {
              const badge = badgeForRecord(r);
              const primaryDate =
                r.status === 'Completed'
                  ? { label: 'Given', date: formatDate(r.dateAdministered) }
                  : { label: 'Added', date: formatDate(r.createdAt) };

              return (
                <View key={r._id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.iconBox}>
                      <FontAwesome5 name="syringe" size={24} color="#5EBFA4" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardTitle}>{r.vaccineName || 'Vaccine'}</Text>
                      <Text style={styles.cardSub}>
                        <FontAwesome5 name="calendar-day" size={12} color="#888" /> {primaryDate.label}: {primaryDate.date}
                      </Text>
                      {r.status === 'Completed' && r.nextDueDate && (
                        <Text style={styles.cardSub}>
                          <FontAwesome5 name="bell" size={12} color="#888" /> Next due: {formatDate(r.nextDueDate)}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.badge, badge.style]}>
                      <Text style={styles.badgeText}>{badge.label}</Text>
                    </View>
                  </View>
                  {r.notes ? (
                    <Text style={styles.notes}>
                      <FontAwesome5 name="sticky-note" size={12} color="#888" /> {r.notes}
                    </Text>
                  ) : null}
                  {r.documentUrl ? (
                    <TouchableOpacity style={styles.viewDocBtn} onPress={() => Linking.openURL(`${baseFileUrl}${r.documentUrl}`)}>
                      <Text style={styles.viewDocText}>
                        <FontAwesome5 name="file-pdf" size={14} color="#4A90E2" /> View certificate
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: {
    backgroundColor: '#5EBFA4',
    height: 115,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35,
  },
  backArrow: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  petBar: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE', maxHeight: 60 },
  petBarContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  petChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  petChipActive: { backgroundColor: '#5EBFA4', borderColor: '#5EBFA4' },
  petChipDisabled: { opacity: 0.55 },
  petChipText: { fontSize: 13, fontWeight: 'bold', color: '#555' },
  petChipTextActive: { color: '#FFF' },
  list: { padding: 18, paddingBottom: 72 },
  sectionHeading: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
  },
  intro: { fontSize: 13, color: '#555', marginBottom: 14, lineHeight: 19 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },
  catRowMuted: { opacity: 0.85 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#5EBFA4',
    marginRight: 14,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: '#5EBFA4', borderColor: '#5EBFA4' },
  checkListed: { backgroundColor: '#E0E0E0', borderColor: '#BDBDBD' },
  catName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  catDesc: { fontSize: 12, color: '#777', marginTop: 4 },
  listedTag: { fontSize: 11, color: '#5EBFA4', marginTop: 6, fontWeight: 'bold' },
  confirmBtn: {
    backgroundColor: '#5EBFA4',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#DDD', marginVertical: 20 },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 26,
    alignItems: 'center',
    marginTop: 14,
    elevation: 2,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 6 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  badgeDone: { backgroundColor: '#E8F5E9' },
  badgeListed: { backgroundColor: '#E3F2FD' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  notes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 8,
  },
  viewDocBtn: { marginTop: 10, backgroundColor: '#E3F2FD', borderRadius: 8, padding: 10, alignItems: 'center' },
  viewDocText: { color: '#1976D2', fontWeight: 'bold', fontSize: 13 },
});
