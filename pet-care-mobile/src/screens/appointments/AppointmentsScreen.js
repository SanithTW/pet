import React, { useLayoutEffect, useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert, RefreshControl, Linking } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api, { getBackendOrigin } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

export default function AppointmentsScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    if(navigation) navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchAppointments = async () => {
    try {
       const { data } = await api.get('/appointments/my', {
          headers: { Authorization: `Bearer ${userToken}` }
       });
       setAppointments(data);
    } catch (error) {
       console.error("Error fetching appointments:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, []);

  const handleCancel = async (id) => {
    Alert.alert("Cancel Appointment", "Are you sure you want to cancel this appointment?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: async () => {
          try {
            await api.put(`/appointments/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${userToken}` }});
            fetchAppointments();
            Alert.alert("Success", "Appointment cancelled successfully");
          } catch(e) {
            Alert.alert("Error", e.response?.data?.message || "Could not cancel");
          }
      }}
    ]);
  };

  const handleReschedule = (app) => {
    // Navigate to a Booking screen or show a reschedule modal.
    // We can simply instruct the user to cancel and book a new one for now or pass context to booking.
    Alert.alert("Reschedule", "To reschedule, please cancel this appointment and book a new one.");
  };

  const handleViewInvoice = (invoiceUrl) => {
    const origin = getBackendOrigin();
    const path = invoiceUrl.startsWith('/') ? invoiceUrl : `/${invoiceUrl}`;
    const fullUrl = `${origin}${path}`;
    Linking.openURL(fullUrl).catch(err => {
      console.error("Failed to open URL", err);
      Alert.alert("Error", "Could not open the invoice.");
    });
  };

  return (
    <View style={styles.mainContainer}>
      {/* Green Header exactly like HomeScreen */}
      <View style={styles.greenHeader}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation && navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.greeting}>Appointments</Text>
            <View style={styles.avatarContainer}>
              <Image style={styles.avatarImage} source={require('../../../assets/1.png')} />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
         contentContainerStyle={styles.container} 
         showsVerticalScrollIndicator={false}
         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {appointments.map(app => (
          <View key={app._id} style={styles.upcomingCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}><FontAwesome5 name="hospital" size={16} color="#5EBFA4" /> Visit Details</Text>
              <View style={[styles.badge, app.status === 'Approved' ? styles.badgeApproved : app.status === 'Completed' ? styles.badgeCompleted : app.status === 'Pending' ? styles.badgePending : app.status === 'Rejected' ? styles.badgeRejected : null]}>
                <Text style={[styles.badgeText, app.status === 'Approved' ? styles.badgeTextApproved : app.status === 'Completed' ? styles.badgeTextCompleted : app.status === 'Pending' ? styles.badgeTextPending : app.status === 'Rejected' ? styles.badgeTextRejected : null]}>{app.status}</Text>
              </View>
            </View>

            <View style={styles.vetDetailsRow}>
            
              <View style={styles.vetInfo}>
                <Text style={styles.vetName}>{app.vet?.name || 'Vet'}</Text>
                <Text style={styles.vetSub}>{app.reason}</Text>
                <Text style={styles.vetDate}><FontAwesome5 name="calendar-alt" size={12} color="#888" /> {new Date(app.date).toLocaleDateString()} at {app.time}</Text>
              </View>
            </View>

            {/* Action Buttons for the Specific Appointment */}
            {app.status !== 'Cancelled' && app.status !== 'Rejected' && app.status !== 'Completed' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionReschedule} onPress={() => handleReschedule(app)}>
                  <Text style={styles.actionRescheduleText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCancel} onPress={() => handleCancel(app._id)}>
                  <Text style={styles.actionCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {app.status === 'Completed' && app.invoiceUrl && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionInvoice} onPress={() => handleViewInvoice(app.invoiceUrl)}>
                  <Text style={styles.actionInvoiceText}>📄 View Invoice</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {appointments.length === 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>No appointments yet! 🐾</Text>
            <Text style={styles.infoText}>Regular checkups help ensure your pet stays happy and healthy. Book one today!</Text>
          </View>
        )}

        {/* Action Button matching the floating 'Book New' style */}
        <TouchableOpacity style={styles.bookButton} activeOpacity={0.8} onPress={() => navigation.navigate('BookAppointment')}>
          <Text style={styles.bookButtonText}>+ Book New Appointment</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F4F6F8' },
  greenHeader: {
    backgroundColor: '#5EBFA4', // Green from mockup
    height: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 35, // For notch and status bar
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  backButton: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrow: { fontSize: 26, color: '#FFF', fontWeight: 'bold' },
  avatarContainer: {
    backgroundColor: '#FFF',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  container: { paddingHorizontal: 20, paddingBottom: 60 },
  
  managementCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginTop: -20,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  memberBadge: { backgroundColor: '#EDE7F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  memberBadgeText: { color: '#5E35B1', fontSize: 12, fontWeight: 'bold' },
  managementTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  managementSub: { fontSize: 13, color: '#666', marginBottom: 12, marginTop: 4 },
  pillsContainer: { flexDirection: 'row'},
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  pillText: { fontSize: 12, fontWeight: 'bold' },

  upcomingCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  badge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8
  },
  badgeText: { fontSize: 12, color: '#4CAF50', fontWeight: 'bold' },
  badgePending: { backgroundColor: '#FFF3E0' },
  badgeTextPending: { color: '#FF9800' },
  badgeApproved: { backgroundColor: '#E8F5E9' },
  badgeTextApproved: { color: '#4CAF50' },
  badgeCompleted: { backgroundColor: '#E3F2FD' },
  badgeTextCompleted: { color: '#2196F3' },
  badgeRejected: { backgroundColor: '#FFEBEE' },
  badgeTextRejected: { color: '#F44336' },

  vetDetailsRow: {
    flexDirection: 'row',
  },
  vetImage: {
    width: 70, height: 70, borderRadius: 16, marginRight: 16,
    backgroundColor: '#F0F0F0'
  },
  vetInfo: { flex: 1, justifyContent: 'center' },
  vetName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  vetSub: { fontSize: 13, color: '#666', marginBottom: 6 },
  vetDate: { fontSize: 13, color: '#FF6B6B', fontWeight: 'bold' },

  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#60B66C',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  infoText: { fontSize: 14, color: '#666' },

  bookButton: {
    backgroundColor: '#5EBFA4', // Green from mockup
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  bookButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 16 },
  actionReschedule: { backgroundColor: '#FFF3E0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  actionRescheduleText: { color: '#E65100', fontWeight: 'bold', fontSize: 13 },
  actionCancel: { backgroundColor: '#FFEBEE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionCancelText: { color: '#C62828', fontWeight: 'bold', fontSize: 13 },
  actionInvoice: { backgroundColor: '#E1F5FE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  actionInvoiceText: { color: '#0277BD', fontWeight: 'bold', fontSize: 14 },
});