import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  Alert, Modal, ActivityIndicator, TextInput, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const STATUS_COLOR = {
  Pending:   { bg: '#FFF8E1', text: '#F59E0B' },
  Confirmed: { bg: '#E3F2FD', text: '#1565C0' },
  Completed: { bg: '#E8F5E9', text: '#2E7D32' },
  Cancelled: { bg: '#FFEBEE', text: '#C62828' },
};

export default function GroomingScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const authHeader = { headers: { Authorization: `Bearer ${userToken}` } };

  const [tab, setTab] = useState('services'); // 'services' | 'history'
  const [services, setServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Booking modal
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchServices();
    fetchPets();
    fetchBookings();
  }, []);

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/grooming/services', authHeader);
      setServices(data);
    } catch (e) { console.error('fetchServices', e); }
  };

  const fetchPets = async () => {
    try {
      const { data } = await api.get('/pets', authHeader);
      setPets(data);
      if (data.length > 0) setSelectedPet(data[0]);
    } catch (e) { console.error('fetchPets', e); }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/grooming/bookings', authHeader);
      setBookings(data);
    } catch (e) { console.error('fetchBookings', e); }
    finally { setLoading(false); }
  };

  const openBooking = (service) => {
    setSelectedService(service);
    setBookingDate(new Date());
    setNotes('');
    setShowModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedPet) { Alert.alert('Error', 'You need to add a pet first'); return; }
    try {
      await api.post('/grooming/bookings', {
        petId: selectedPet._id,
        serviceId: selectedService._id,
        date: bookingDate.toISOString(),
        notes
      }, authHeader);
      Alert.alert('Booked! 🐾', `${selectedService.name} scheduled for ${selectedPet.name}`);
      setShowModal(false);
      fetchBookings();
      setTab('history');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not book');
    }
  };

  const handleCancel = (id) => {
    Alert.alert('Cancel Booking', 'Cancel this grooming session?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try {
          await api.put(`/grooming/bookings/${id}/cancel`, {}, authHeader);
          fetchBookings();
        } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Could not cancel'); }
      }}
    ]);
  };

  const serviceEmoji = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('bath')) return '🛁';
    if (n.includes('nail')) return '💅';
    if (n.includes('full')) return '✨';
    if (n.includes('hair') || n.includes('trim')) return '✂️';
    return '🐾';
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Grooming</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'services' && styles.tabActive]} onPress={() => setTab('services')}>
          <Text style={[styles.tabText, tab === 'services' && styles.tabTextActive]}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'history' && styles.tabActive]} onPress={() => setTab('history')}>
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      {/* Pet quick-selector bar (always visible) */}
      {pets.length > 0 && (
        <View style={styles.petBarWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petBar}>
            {pets.map(p => (
              <TouchableOpacity
                key={p._id}
                style={[styles.petChip, selectedPet?._id === p._id && styles.petChipActive]}
                onPress={() => setSelectedPet(p)}
              >
                <Text style={[styles.petChipText, selectedPet?._id === p._id && styles.petChipTextActive]}>
                  🐾 {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Services Tab */}
      {tab === 'services' && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {services.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✂️</Text>
              <Text style={styles.emptyText}>No grooming services available yet.</Text>
            </View>
          )}
          {services.map(s => (
            <View key={s._id} style={styles.serviceCard}>
              <View style={styles.serviceTop}>
                <View style={styles.serviceIcon}>
                  <Text style={{ fontSize: 26 }}>{serviceEmoji(s.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <View style={styles.pillRow}>
                    <View style={styles.pill}><Text style={styles.pillGreen}>💰 Rs. {s.price}</Text></View>
                    <View style={styles.pillOrange}><Text style={styles.pillOrangeText}>⏱ {s.duration}</Text></View>
                  </View>
                </View>
              </View>
              <Text style={styles.serviceDesc}>{s.description}</Text>
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => openBooking(s)}
                disabled={!selectedPet}
              >
                <Text style={styles.bookBtnText}>
                  {selectedPet ? `Book for ${selectedPet.name}` : 'Select a pet above'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {loading && <ActivityIndicator size="large" color="#5EBFA4" style={{ marginTop: 20 }} />}
          {!loading && bookings.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No grooming bookings yet.</Text>
              <Text style={styles.emptySub}>Switch to "Services" to book your first session.</Text>
            </View>
          )}
          {bookings.map(b => {
            const sc = STATUS_COLOR[b.status] || STATUS_COLOR.Pending;
            return (
              <View key={b._id} style={styles.bookingCard}>
                <View style={styles.bookingTop}>
                  <View style={styles.bookingIcon}>
                    <Text style={{ fontSize: 22 }}>{serviceEmoji(b.service?.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingService}>{b.service?.name || '—'}</Text>
                    <Text style={styles.bookingPet}>🐾 {b.pet?.name} • {b.pet?.species}</Text>
                    <Text style={styles.bookingDate}>📅 {formatDate(b.date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{b.status}</Text>
                  </View>
                </View>
                {b.notes ? <Text style={styles.bookingNotes}>📝 {b.notes}</Text> : null}
                <View style={styles.bookingMeta}>
                  <Text style={styles.bookingPrice}>💰 Rs. {b.service?.price}</Text>
                  {(b.status === 'Pending' || b.status === 'Confirmed') && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(b._id)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Booking Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Booking</Text>
            {selectedService && (
              <View style={styles.confirmService}>
                <Text style={styles.confirmServiceName}>{serviceEmoji(selectedService.name)} {selectedService.name}</Text>
                <Text style={styles.confirmServiceSub}>💰 Rs. {selectedService.price}  ⏱ {selectedService.duration}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Pet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {pets.map(p => (
                <TouchableOpacity
                  key={p._id}
                  style={[styles.petChip, { marginRight: 8 }, selectedPet?._id === p._id && styles.petChipActive]}
                  onPress={() => setSelectedPet(p)}
                >
                  <Text style={[styles.petChipText, selectedPet?._id === p._id && styles.petChipTextActive]}>🐾 {p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity style={styles.dateField} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateFieldText}>📅  {bookingDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={bookingDate} mode="date" display="default"
                minimumDate={new Date()}
                onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setBookingDate(d); }}
              />
            )}

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any special requests?"
              value={notes} onChangeText={setNotes}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.mCancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.mCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mConfirmBtn} onPress={handleConfirmBooking}>
                <Text style={styles.mConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: {
    backgroundColor: '#5EBFA4', height: 120,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 50,
  },
  backBtn: { width: 40 },
  backArrow: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },

  tabs: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#5EBFA4' },
  tabText: { fontSize: 14, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#5EBFA4', fontWeight: 'bold' },

  petBarWrap: { backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  petBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  petChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD' },
  petChipActive: { backgroundColor: '#5EBFA4', borderColor: '#5EBFA4' },
  petChipText: { fontSize: 13, color: '#555', fontWeight: 'bold' },
  petChipTextActive: { color: '#FFF' },

  list: { padding: 20, paddingBottom: 60 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 30, alignItems: 'center', marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: 15, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center' },

  serviceCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  serviceTop: { flexDirection: 'row', marginBottom: 10 },
  serviceIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  serviceName: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  pillRow: { flexDirection: 'row', gap: 6 },
  pill: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pillGreen: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
  pillOrange: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pillOrangeText: { color: '#E65100', fontSize: 12, fontWeight: 'bold' },
  serviceDesc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 14 },
  bookBtn: { backgroundColor: '#5EBFA4', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  bookBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  bookingCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  bookingTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bookingIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bookingService: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 2 },
  bookingPet: { fontSize: 12, color: '#666', marginBottom: 2 },
  bookingDate: { fontSize: 12, color: '#888' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  bookingNotes: { fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 8 },
  bookingMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
  bookingPrice: { fontSize: 13, fontWeight: 'bold', color: '#2E7D32' },
  cancelBtn: { backgroundColor: '#FFEBEE', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  cancelText: { color: '#C62828', fontWeight: 'bold', fontSize: 12 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 16 },
  confirmService: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, marginBottom: 16 },
  confirmServiceName: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32', marginBottom: 4 },
  confirmServiceSub: { fontSize: 13, color: '#555' },
  fieldLabel: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 6, marginTop: 4 },
  dateField: { backgroundColor: '#F4F6F8', padding: 14, borderRadius: 12, marginBottom: 12 },
  dateFieldText: { fontSize: 14, color: '#333' },
  notesInput: { backgroundColor: '#F4F6F8', padding: 14, borderRadius: 12, minHeight: 70, textAlignVertical: 'top', fontSize: 14, color: '#333', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  mCancelBtn: { flex: 1, padding: 14, backgroundColor: '#F4F6F8', borderRadius: 12, alignItems: 'center' },
  mCancelText: { color: '#666', fontWeight: 'bold' },
  mConfirmBtn: { flex: 1, padding: 14, backgroundColor: '#5EBFA4', borderRadius: 12, alignItems: 'center' },
  mConfirmText: { color: '#FFF', fontWeight: 'bold' },
});
