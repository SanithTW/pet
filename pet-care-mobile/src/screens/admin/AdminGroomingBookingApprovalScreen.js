import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminGroomingBookingApprovalScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/grooming/bookings/all', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setBookings(data);
    } catch (error) {
      console.error('Error fetching grooming bookings:', error);
      Alert.alert('Error', 'Could not load grooming bookings.');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/grooming/bookings/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      Alert.alert('Success', `Booking ${status}`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Could not update booking status.');
    }
  };

  const statusStyles = (status) => {
    if (status === 'Confirmed') return { badge: styles.badgeConfirmed, text: styles.badgeTextConfirmed };
    if (status === 'Pending') return { badge: styles.badgePending, text: styles.badgeTextPending };
    if (status === 'Cancelled') return { badge: styles.badgeRejected, text: styles.badgeTextRejected };
    if (status === 'Rejected') return { badge: styles.badgeRejected, text: styles.badgeTextRejected };
    return { badge: styles.badgeDefault, text: styles.badgeTextDefault };
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.greenHeader}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.greeting}>Grooming Approvals</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Pending Grooming Bookings</Text>
        {bookings.map((booking) => {
          const statusStyle = statusStyles(booking.status);
          return (
            <View key={booking._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{booking.pet?.name || 'Unknown Pet'} • {booking.service?.name || 'Grooming'}</Text>
                <View style={[styles.badge, statusStyle.badge]}>
                  <Text style={[styles.badgeText, statusStyle.text]}>{booking.status}</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>Owner: {booking.owner?.name || 'Unknown'}</Text>
              <Text style={styles.cardSub}>Email: {booking.owner?.email || '—'}</Text>
              <Text style={styles.cardSub}>Date: {new Date(booking.date).toLocaleDateString()}</Text>
              {booking.notes ? <Text style={styles.cardSub}>Notes: {booking.notes}</Text> : null}

              {booking.status === 'Pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleUpdateStatus(booking._id, 'Rejected')}>
                    <Text style={styles.btnTextReject}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleUpdateStatus(booking._id, 'Confirmed')}>
                    <Text style={styles.btnTextApprove}>Approve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
        {bookings.length === 0 && <Text style={styles.emptyText}>No grooming bookings found.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F4F6F8' },
  greenHeader: {
    backgroundColor: '#5EBFA4',
    height: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 35,
  },
  backButton: { width: 40 },
  backArrow: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  container: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  card: {
    backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EEE' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  badgePending: { backgroundColor: '#FFF3E0' },
  badgeTextPending: { color: '#FF9800' },
  badgeConfirmed: { backgroundColor: '#E8F5E9' },
  badgeTextConfirmed: { color: '#4CAF50' },
  badgeRejected: { backgroundColor: '#FFEBEE' },
  badgeTextRejected: { color: '#F44336' },
  badgeDefault: { backgroundColor: '#EEE' },
  badgeTextDefault: { color: '#666' },
  cardSub: { fontSize: 14, color: '#666', marginBottom: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  rejectBtn: { backgroundColor: '#FFEBEE' },
  approveBtn: { backgroundColor: '#E8F5E9', marginLeft: 10 },
  btnTextReject: { color: '#F44336', fontWeight: 'bold' },
  btnTextApprove: { color: '#4CAF50', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
});